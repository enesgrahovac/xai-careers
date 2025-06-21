"use client";

import { useRef, useEffect } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import { useChat, type Message as AIMessage } from "@ai-sdk/react";

export default function ChatContainer() {
    const scrollRef = useRef<HTMLDivElement>(null);
    // A sentinel element at the bottom of the message list – easier/cheaper
    // to keep it in view than continuously animating the entire container.
    const bottomRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        append,
        isLoading,
    } = useChat({
        api: "/api/chat",
        streamProtocol: "text",
    });

    const sendMessage = (
        text: string,
        locations: string[],
        departments: string[]
    ) => {
        append(
            { role: "user", content: text },
            {
                body: {
                    locations,
                    departments,
                },
            }
        );
    };

    // Auto-scroll when new content arrives **only if the user is already near the
    // bottom**.  This prevents a "glitchy" feel caused by firing smooth scroll
    // animations on every streamed token while still keeping the latest answer
    // in view for normal reading.
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        // If the user hasn't manually scrolled up (i.e. they are within ~120px
        // of the bottom), keep them pinned to the bottom as new content streams
        // in.  Otherwise, leave the scroll position untouched so they can read
        // earlier messages.
        if (distanceFromBottom < 120) {
            // Jump instead of smooth-scroll to avoid piling up animations.
            container.scrollTop = container.scrollHeight;
        }

    }, [messages]);

    const hasMessages = messages.length > 0;

    return (
        <div
            className={
                hasMessages
                    ? "flex flex-col h-[calc(100vh-56px)] w-full"
                    : "flex flex-col min-h-[calc(100vh-56px)] justify-center w-full"
            }
        >
            {hasMessages && (
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6 max-w-3xl mx-auto">
                        {messages.map((m: AIMessage, idx) => (
                            <ChatMessage
                                key={m.id}
                                role={m.role as "user" | "assistant"}
                                content={m.content ?? ""}
                                isThinking={isLoading && idx === messages.length - 1 && m.role === "assistant"}
                            />
                        ))}
                        {/* Bottom sentinel for scrollIntoView fallback */}
                        <div ref={bottomRef} />
                    </div>
                </div>
            )}
            <div
                className={
                    hasMessages
                        ? "pb-4 max-w-3xl mx-auto w-full"
                        : "px-4 max-w-3xl mx-auto w-full"
                }
            >
                <ChatInput onSend={sendMessage} disabled={isLoading} />
            </div>
        </div>
    );
} 