"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

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
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw]}
                    skipHtml={false}
                    components={{
                        p: ({ node, ...props }) => <p {...props} className="my-3 leading-relaxed" />,
                    }}
                    className="rounded-3xl px-4 py-3 max-w-3xl w-full prose dark:prose-invert break-words leading-relaxed min-h-7 text-black dark:text-white"
                >
                    {content}
                </ReactMarkdown>
            )}
        </div>
    );
} 