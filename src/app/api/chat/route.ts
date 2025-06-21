import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { getOpenJobs, JobListing } from "@/lib/jobs";

export const runtime = "edge";
export const maxDuration = 30;

interface ChatRequestBody {
    messages: any[];
    locations?: string[];
    departments?: string[];
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
    return `You are an AI assistant helping candidates learn about open roles at xAI.

Below is a JSON array with all open job listings. Each item has the following fields:
  id, title, location, department, description_md.

When answering the user's questions, rely ONLY on this data. Do not hallucinate roles that are not listed. If a question cannot be answered from the listings, politely say you don't have that information.

Open job listings:\n\n${JSON.stringify(jobs)}\n\n`;
}

/**
 * Builds the second system prompt that communicates the user's currently
 * selected locations and/or departments.  This message must be re-appended
 * before every new user message because the user can change these selections
 * at any time.
 */
function buildFiltersPrompt(locations?: string[], departments?: string[]) {
    const filtersDesc = [
        locations && locations.length ? `locations: ${locations.join(", ")}` : null,
        departments && departments.length ? `departments: ${departments.join(", ")}` : null,
    ]
        .filter(Boolean)
        .join("; ") || "none";

    return `# User's desired locations and departments

The user's current selections are (${filtersDesc}). If the user has specified filters, focus on roles that match those filters. If the user has not specified filters, focus on roles that are open to all locations and departments.

Always pay attention to the user's desired locations and departments. This system message will appear immediately before every user message and therefore contains the most up-to-date preferences.`;
}

export async function POST(req: Request) {
    const { messages, locations, departments } = (await req.json()) as ChatRequestBody;

    // Fetch all open job listings.
    const jobs = await getOpenJobs();

    // ---------------------------------------------------------------------
    // Build system messages
    // ---------------------------------------------------------------------
    const identitySystemMessage = {
        role: "system",
        content: buildIdentityPrompt(jobs),
    } as const;

    const filtersSystemMessage = {
        role: "system",
        content: buildFiltersPrompt(locations, departments),
    } as const;

    // ---------------------------------------------------------------------
    // Prepare message list: identity message first, then for *each* user
    // message insert the current filters system message immediately before it.
    // ---------------------------------------------------------------------

    const preparedMessages: typeof messages = [identitySystemMessage];

    for (const msg of messages) {
        if (msg.role === "user") {
            // Re-append filters message before every user message so the model
            // always has the latest user preferences.
            preparedMessages.push({ ...filtersSystemMessage });
        }
        preparedMessages.push(msg);
    }

    const result = streamText({
        model: xai("grok-3-mini-fast"),
        providerOptions: {
            xai: {
                reasoningEffort: "medium",
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

            let sentReasoning = false;

            for await (const part of fullStream) {
                if (part.type === 'reasoning') {
                    if (!sentReasoning) {
                        // Send opening details block with placeholder summary.
                        const detailsHeader = `<details><summary>💡 Thinking...</summary>\n\n`;
                        controller.enqueue(encoder.encode(detailsHeader));
                        sentReasoning = true;
                    }
                    controller.enqueue(encoder.encode(part.textDelta));
                } else if (part.type === 'text-delta') {
                    if (sentReasoning) {
                        const detailsFooter = `\n\n</details>\n\n`; // close details
                        controller.enqueue(encoder.encode(detailsFooter));
                        sentReasoning = false; // prevent closing multiple times
                    }
                    controller.enqueue(encoder.encode(part.textDelta));
                }
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