"use client";

export interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";
    const containerClasses = `w-full flex mb-5 ${isUser ? "justify-end" : "justify-start"}`;
    return (
        <div className={containerClasses}>
            {isUser ? (
                <div className="bg-black text-white rounded-2xl px-4 py-2 max-w-lg text-sm leading-relaxed">
                    {content}
                </div>
            ) : (
                <div className="rounded-3xl px-4 py-3 max-w-3xl w-full prose dark:prose-invert break-words leading-relaxed min-h-7 text-black dark:text-white">
                    {content}
                </div>
            )}
        </div>
    );
} 