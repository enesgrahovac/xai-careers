"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import React from "react";
import { ChevronDownIcon, LightBulbIcon } from "@heroicons/react/24/outline";

export interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    isThinking?: boolean;
}

export default function ChatMessage({ role, content, isThinking = false }: ChatMessageProps) {
    const isUser = role === "user";
    const [elapsed, setElapsed] = React.useState(0);
    const startRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (isThinking) {
            if (startRef.current === null) startRef.current = Date.now();
            const id = setInterval(() => {
                if (startRef.current !== null) {
                    setElapsed(((Date.now() - startRef.current) / 1000));
                }
            }, 100);
            return () => clearInterval(id);
        } else {
            if (startRef.current !== null) {
                const secs = ((Date.now() - startRef.current) / 1000);
                setElapsed(secs);
                startRef.current = null;
            }
        }
    }, [isThinking]);

    let renderedContent = content;
    const summaryRegex = /<details><summary>(.*?)<\/summary>/;
    const match = content.match(summaryRegex);
    if (match) {
        const summaryText = isThinking ? `Thinking for ${elapsed.toFixed(1)}s` : `Thought for ${elapsed.toFixed(1)}s`;
        renderedContent = content.replace(summaryRegex, `<details><summary>${summaryText}</summary>`);
    }

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
                        details: ({ node, ...props }) => (
                            <details
                                {...props}
                                open={isThinking}
                                className="group ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3 my-2"
                            >
                                {props.children}
                            </details>
                        ),
                        summary: ({ node, ...props }) => (
                            <summary
                                {...props}
                                className="flex items-center text-gray-500 dark:text-gray-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
                            >
                                <LightBulbIcon className="w-4 h-4 mr-2 inline-block align-middle" />
                                {props.children}
                                <ChevronDownIcon className="w-4 h-4 ml-2 transition-transform duration-200 -rotate-90 group-open:rotate-0" />
                            </summary>
                        ),
                    }}
                    className="rounded-3xl px-4 py-3 max-w-3xl w-full prose dark:prose-invert break-words leading-relaxed min-h-7 text-black dark:text-white"
                >
                    {renderedContent}
                </ReactMarkdown>
            )}
        </div>
    );
} 