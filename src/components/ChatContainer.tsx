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
        departments: string[],
        cvText?: string
    ) => {
        append(
            { role: "user", content: text },
            {
                body: {
                    locations,
                    departments,
                    cvText,
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
        console.log(messages, "messages");
    }, [messages]);

    const hasMessages = messages.length > 0;

    return (
        <div
            /*
             * Fill all remaining vertical space after the fixed header that lives in
             * `layout.tsx`.  Because the <body> is a flex-column container, simply
             * applying `flex-1` here ensures we grow to the full viewport height on
             * every device without having to hard-code `calc(100vh-56px)`.
             */
            className={
                hasMessages
                    ? "flex flex-col flex-1 w-full min-h-0"
                    : "flex flex-col flex-1 justify-center w-full min-h-0"
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
            {!hasMessages && (
                <div className="text-center mb-8 space-y-4">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Find your perfect role at xAI
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        We&apos;ve ingested all of the open roles at xAI and can help you find the best fit.
                    </p>
                </div>
            )}
            <div
                className={
                    hasMessages
                        ? "pb-4 px-4 sm:px-0 max-w-3xl mx-auto w-full"
                        : "px-4 max-w-3xl mx-auto w-full"
                }
            >
                <ChatInput onSend={sendMessage} disabled={isLoading} />
            </div>
        </div>
    );
} 