import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: xai("grok-3-mini"),
        messages,
    });

    return result.toDataStreamResponse();
} 