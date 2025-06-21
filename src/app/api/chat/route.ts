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

    // if (locations && locations.length > 0) {
    //     const locSet = new Set(locations.map((l) => l.toLowerCase()));
    //     jobs = jobs.filter((j) => j.location && locSet.has(j.location.toLowerCase()));
    // }

    // if (departments && departments.length > 0) {
    //     const deptSet = new Set(departments.map((d) => d.toLowerCase()));
    //     jobs = jobs.filter((j) => j.department && deptSet.has(j.department.toLowerCase()));
    // }


    const systemPrompt = buildSystemPrompt(jobs, locations, departments);

    console.log(systemPrompt, "system prompt");

    const systemMessage = {
        role: "system",
        content: systemPrompt,
    } as const;

    const result = streamText({
        model: xai("grok-3-mini"),
        providerOptions: {
            xai: {
                reasoningEffort: 'low'
            }
        },
        messages: [systemMessage, ...messages],
    });

    return result.toDataStreamResponse();
} 