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

If the user has specified filters (${filtersDesc || "none"}), focus on roles that match those filters.

Open job listings:\n\n${JSON.stringify(jobs)}\n\n`;
}

export async function POST(req: Request) {
    const { messages, locations, departments } = (await req.json()) as ChatRequestBody;

    // Fetch job listings and apply basic filtering (exact match) if filters are provided.
    let jobs = await getOpenJobs();
    jobs = jobs.slice(0, 5);

    const systemPrompt = buildSystemPrompt(jobs, locations, departments);

    console.log(systemPrompt, "system prompt");

    const systemMessage = {
        role: "system",
        content: systemPrompt,
    } as const;

    const result = streamText({
        model: xai("grok-3-mini-beta"),
        providerOptions: {
            xai: {
                reasoningEffort: 'low'
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

            let reasoningText = '';
            const reasoningStartedAt = Date.now();
            let sentReasoning = false;

            for await (const part of fullStream) {
                if (part.type === 'reasoning') {
                    // Buffer reasoning tokens – we will emit them all together once reasoning ends
                    reasoningText += part.textDelta;
                } else if (part.type === 'text-delta') {
                    // When the first answer token arrives, flush the reasoning block (if any)
                    if (!sentReasoning && reasoningText) {
                        const thinkingTimeSec = ((Date.now() - reasoningStartedAt) / 1000).toFixed(1);
                        const detailsHeader = `<details><summary>💡 Thought for ${thinkingTimeSec}s</summary>\n\n`;
                        const detailsFooter = `\n\n</details>\n\n`;
                        controller.enqueue(encoder.encode(detailsHeader + reasoningText + detailsFooter));
                        sentReasoning = true;
                    }
                    // Stream answer tokens straight through
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