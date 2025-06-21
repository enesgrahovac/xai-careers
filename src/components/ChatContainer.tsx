"use client";

import { useRef, useEffect } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import { useChat, type Message as AIMessage } from "@ai-sdk/react";

export default function ChatContainer() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        append,
        isLoading,
    } = useChat({
        api: "/api/chat",
    });

    const sendMessage = (text: string) => {
        append({ role: "user", content: text });
    };

    // Auto scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
                        {messages.map((m: AIMessage) => (
                            <ChatMessage key={m.id} role={m.role as "user" | "assistant"} content={m.content ?? ""} />
                        ))}
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