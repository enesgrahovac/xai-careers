import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { getOpenJobs, JobListing } from "@/lib/jobs";

export const runtime = "edge";
export const maxDuration = 30;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

interface ChatRequestBody {
    messages: ChatMessage[];
    locations?: string[];
    departments?: string[];
    cvText?: string;
}


// -----------------------------------------------------------------------------
// Prompt builders
// -----------------------------------------------------------------------------

/**
 * Builds the first system prompt that identifies the assistant and provides the
 * complete set of job listings.  This message is constant across the lifetime
 * of a conversation.
 */
function buildIdentityPrompt(jobs: JobListing[]) {
    // Format jobs in a more structured way for better LLM parsing
    const formattedJobs = jobs.map((job, index) => {
        return `## Job ${index + 1}: ${job.title}
**ID:** ${job.id}
**Department:** ${job.department || 'Not specified'}
**Location:** ${job.location || 'Not specified'}

**Job Description:**
${job.description_md || 'No description available'}

---`;
    }).join('\n\n');

    return `You are an AI assistant helping candidates learn about open roles at xAI.

Below are all the current open job listings at xAI. Each job is clearly separated and numbered for easy reference.

When answering the user's questions, rely ONLY on this data. Do not hallucinate roles that are not listed. If a question cannot be answered from the listings, politely say you don't have that information. If there are no jobs listed, politely say that no roles match the user's filters.

# How to present recommended jobs

• When you are **confident** you want to recommend one or more roles, output a self-closing HTML tag named <joblistingcard … /> **for each role**.

• Give it the following attributes (all lowercase):
    id="1234567"                  ← Greenhouse job id
    title="Senior SWE – Infra"
    department="Engineering, Research & Product"
    payrange="$180-230 k"         ← omit if blank
    locations="Palo Alto, Remote" ← comma-separated if multiple
    summary="Own and scale Grok's infra. High impact." ← ≤ 2 lines

• Do NOT wrap the tag in markdown code fences, do NOT indent it, do NOT emit a closing tag.  Place every card on its own line **at the very end** of your answer. You may include normal prose earlier in the answer.

• **Never** include <joblistingcard> tags in your internal "reasoning" (chain-of-thought) output. Only include them in the final answer.

# Current Open Positions at xAI

${formattedJobs}`;
}

/**
 * Builds the second system prompt that communicates the user's currently
 * selected locations and/or departments.  This message must be re-appended
 * before every new user message because the user can change these selections
 * at any time.
 */
function buildFiltersPrompt(locations?: string[], departments?: string[]) {
    const filtersDesc = [
        locations && locations.length && !locations.includes("Any") ? `locations: ${locations.join(", ")}` : null,
        departments && departments.length && !departments.includes("Any") ? `departments: ${departments.join(", ")}` : null,
    ]
        .filter(Boolean)
        .join("; ") || "none";

    return `# User's desired locations and departments

The user's current selections are (${filtersDesc}). If the user has specified filters, focus on roles that match those filters. If the user has not specified filters, focus on roles that are open to all locations and departments.

Always pay attention to the user's desired locations and departments. This system message will appear immediately before every user message and therefore contains the most up-to-date preferences.`;
}

export async function POST(req: Request) {
    const { messages, locations, departments, cvText } = (await req.json()) as ChatRequestBody;

    // Fetch all open job listings.
    const jobs = await getOpenJobs();

    // ---------------------------------------------------------------------
    // Build system messages
    // ---------------------------------------------------------------------
    const identitySystemMessage = {
        role: "system",
        content: buildIdentityPrompt(jobs),
    } as const;

    // console.log(identitySystemMessage, "identitySystemMessage");

    // const jobSystemMessage = {
    //     role: "system",
    //     content: buildJobListingsPrompt(filteredJobs),
    // } as const;

    const filtersSystemMessage = {
        role: "system",
        content: buildFiltersPrompt(locations, departments),
    } as const;

    // ---------------------------------------------------------------------
    // Prepare message list: identity message first.  If the user has supplied
    // a CV, add it as a single system message so the model can use it for
    // ranking/search but it never appears in the assistant's visible output.
    // Then for *each* user message insert the filters system message right
    // before it.
    // ---------------------------------------------------------------------

    const preparedMessages: ChatMessage[] = [identitySystemMessage];

    if (cvText && cvText.trim()) {
        preparedMessages.push({
            role: "system",
            content: `# User CV (confidential – do not reveal)\n\n${cvText}`,
        });
    }

    for (const msg of messages) {
        if (msg.role === "user") {
            // Re-append filters and job listings before each user turn so the
            // model always sees the most recent context.
            preparedMessages.push({ ...filtersSystemMessage });
            // preparedMessages.push({ ...jobSystemMessage });
        }
        preparedMessages.push(msg);
    }

    const result = streamText({
        model: xai("grok-3-mini"),
        providerOptions: {
            xai: {
                reasoningEffort: "high",
            },
        },
        messages: preparedMessages,
    });

    // Build a custom ReadableStream that interleaves the model's "reasoning" and
    // "text-delta" parts so the client can display a collapsible "Thought" block
    // followed by the final assistant answer, while still taking advantage of
    // streaming for the answer tokens.

    const { fullStream } = result;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Track whether the <details> block has been opened and/or closed to
            // avoid nested blocks that break the UI.
            let detailsOpened = false; // true once we've inserted the opening tag
            let detailsOpen = false;   // true while the <details> block is still open
            let hasReasoningContent = false; // track if we have any reasoning content

            // Removes details/summary and thinking markers but **not** job card tags.
            const cleanTextTags = (text: string): string => {
                return text
                    // Remove opening details tags (any variation)
                    .replace(/<details[^>]*>/gi, "")
                    // Remove closing details tags
                    .replace(/<\/details>/gi, "")
                    // Remove complete summary tags with any content
                    .replace(/<summary[^>]*>.*?<\/summary>/gi, "")
                    // Remove standalone summary opening tags
                    .replace(/<summary[^>]*>/gi, "")
                    // Remove standalone summary closing tags
                    .replace(/<\/summary>/gi, "")
                    // Remove any thinking indicators that might leak through
                    .replace(/💡\s*Thinking\.\.\.?/gi, "")
                    .replace(/Thinking\.\.\.?/gi, "");
            };

            // Extends cleanTextTags by also removing any job card tags so they never appear in reasoning.
            const cleanReasoningTags = (text: string): string => {
                return cleanTextTags(text).replace(/<joblistingcard[^>]*>/gi, "");
            };

            for await (const part of fullStream) {
                if (part.type === "reasoning") {
                    // Clean the reasoning text thoroughly, also stripping job card tags
                    const cleanedDelta = cleanReasoningTags(part.textDelta);

                    // Only open details block if we haven't already and we have content
                    if (!detailsOpened && cleanedDelta.trim()) {
                        const detailsHeader = `<details><summary>💡 Thinking...</summary>\n\n`;
                        controller.enqueue(encoder.encode(detailsHeader));
                        detailsOpened = true;
                        detailsOpen = true;
                        hasReasoningContent = true;
                    }

                    if (cleanedDelta.trim()) {
                        controller.enqueue(encoder.encode(cleanedDelta));
                        hasReasoningContent = true;
                    }
                } else if (part.type === "text-delta") {
                    // Close the <details> block the first time we encounter a
                    // text-delta after it has been opened and we have reasoning content.
                    if (detailsOpen && hasReasoningContent) {
                        const detailsFooter = `\n\n</details>\n\n`;
                        controller.enqueue(encoder.encode(detailsFooter));
                        detailsOpen = false;
                    }

                    // Clean any stray thinking tags from text content (do NOT remove job cards)
                    const cleanedTextDelta = cleanTextTags(part.textDelta);

                    if (cleanedTextDelta.trim()) {
                        controller.enqueue(encoder.encode(cleanedTextDelta));
                    }
                }
            }

            // Ensure details block is closed if it was opened but never closed
            if (detailsOpen) {
                const detailsFooter = `\n\n</details>\n\n`;
                controller.enqueue(encoder.encode(detailsFooter));
            }

            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
} 