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

function buildSystemPrompt(jobs: JobListing[], locations?: string[], departments?: string[]) {
    const filtersDesc = [
        locations && locations.length ? `locations: ${locations.join(", ")}` : null,
        departments && departments.length ? `departments: ${departments.join(", ")}` : null,
    ]
        .filter(Boolean)
        .join("; ");

    return `You are an AI assistant helping candidates learn about open roles at xAI.

Below you will find a JSON array with all open job listings.  Each item has these fields:
  id, title, location, department, description_md.

When answering the user's questions, rely ONLY on this data.  Do not hallucinate roles that are not listed.  If a question cannot be answered from the listings, politely say you don't have that information.

# User's desired locations and departments

These are the user's select locations or departments (${filtersDesc || "none"}). If the user has specified filters, focus on roles that match those filters.
If the user has not specified filters, focus on roles that are open to all locations and departments.
Do not use any job listings that do not match the user's desired locations or departments.

Always pay attention to the user's desired locations and departments, which are in the system prompt. The user can change these at any time, but the most recent selected locations and departments are the ones that are stated here in the system prompt.

Open job listings:\n\n${JSON.stringify(jobs)}\n\n`;
}

export async function POST(req: Request) {
    const { messages, locations, departments } = (await req.json()) as ChatRequestBody;

    // Fetch job listings and apply basic filtering (exact match) if filters are provided.
    let jobs = await getOpenJobs();

    // Filter by locations, if provided
    if (locations && locations.length) {
        jobs = jobs.filter((j) => j.location && locations.includes(j.location));
    }

    // Filter by departments, if provided
    if (departments && departments.length) {
        jobs = jobs.filter((j) => j.department && departments.includes(j.department));
    }

    // Limit to the first 5 jobs to keep prompt size reasonable
    jobs = jobs.slice(0, 5);

    const systemPrompt = buildSystemPrompt(jobs, locations, departments);

    console.log(systemPrompt, "system prompt");

    const systemMessage = {
        role: "system",
        content: systemPrompt,
    } as const;

    const result = streamText({
        model: xai("grok-3-mini-fast"),
        providerOptions: {
            xai: {
                reasoningEffort: 'medium'
            }
        },
        messages: [systemMessage, ...messages],
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