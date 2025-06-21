"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import React from "react";
import { ChevronDownIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import JobListingCard from "./JobListingCard";

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

    // Frontend safeguard: Clean up any duplicate thinking tags that might slip through
    const cleanDuplicateThinkingTags = (text: string): string => {
        // Remove duplicate details/summary blocks - keep only the first one
        let cleaned = text;

        // Find all details blocks
        const detailsRegex = /<details><summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi;
        const matches = [...text.matchAll(detailsRegex)];

        if (matches.length > 1) {
            // If we have multiple thinking blocks, merge their content
            const firstMatch = matches[0];
            let combinedContent = '';

            // Combine content from all thinking blocks
            matches.forEach((match, index) => {
                if (index === 0) {
                    combinedContent = match[2]; // First block's content
                } else {
                    combinedContent += '\n\n' + match[2]; // Append subsequent content
                }
            });

            // Replace all thinking blocks with a single merged one
            const firstSummary = firstMatch[1];
            const mergedBlock = `<details><summary>${firstSummary}</summary>${combinedContent}</details>`;

            // Remove all existing thinking blocks and replace with merged one
            cleaned = text.replace(detailsRegex, '');
            // Add the merged block at the beginning
            cleaned = mergedBlock + '\n\n' + cleaned.trim();
        }

        // Additional cleanup: remove any orphaned opening tags
        cleaned = cleaned
            .replace(/<details><summary>💡 Thinking\.\.\.<\/summary>\s*(?=<details>)/gi, '')
            .replace(/(<details><summary>💡 Thinking\.\.\.<\/summary>\s*){2,}/gi, '<details><summary>💡 Thinking...</summary>\n\n');

        return cleaned;
    };

    // NEW HELPER: Escape any <joblistingcard /> occurrences INSIDE <details> blocks so
    // that markdown renders them as plain text within the thinking section.
    const escapeJobListingTagsInDetails = (text: string): string => {
        // This regex finds each <details ...> ... </details> block (non-greedy to stop at the first closing tag)
        return text.replace(/<details[\s\S]*?<\/details>/gi, (detailsBlock) => {
            // Inside each details block, escape ANY joblistingcard tag occurrences (self-closing, opening, or closing).
            return detailsBlock.replace(/<\/?joblistingcard[^>]*>/gi, (tag) => {
                return tag.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            });
        });
    };

    // Convert joblistingcard tags to div elements with data attributes
    const convertJobListingTagsToDiv = (text: string): string => {
        // Convert self-closing joblistingcard tags to div elements
        return text.replace(/<joblistingcard([^>]*)\/>/gi, (match, attributes) => {
            // Parse attributes and convert them to data-* attributes
            const convertedAttributes = attributes.replace(/(\w+)=/g, 'data-$1=');
            return `<div data-job-card="true"${convertedAttributes}></div>`;
        }).replace(/<joblistingcard([^>]*)>(.*?)<\/joblistingcard>/gi, (match, attributes, content) => {
            // Convert open/close tags
            const convertedAttributes = attributes.replace(/(\w+)=/g, 'data-$1=');
            return `<div data-job-card="true"${convertedAttributes}>${content}</div>`;
        });
    };

    let renderedContent = cleanDuplicateThinkingTags(content);
    // Escape job listing tags that appear inside thinking blocks
    renderedContent = escapeJobListingTagsInDetails(renderedContent);
    // Convert joblistingcard tags to div elements with data attributes
    renderedContent = convertJobListingTagsToDiv(renderedContent);

    const summaryRegex = /<details><summary>(.*?)<\/summary>/;
    const match = renderedContent.match(summaryRegex);
    if (match) {
        const summaryText = isThinking ? `Thinking for ${elapsed.toFixed(1)}s` : `Thought for ${elapsed.toFixed(1)}s`;
        renderedContent = renderedContent.replace(summaryRegex, `<details><summary>${summaryText}</summary>`);
    }

    const containerClasses = `w-full flex mb-5 ${isUser ? "justify-end" : "justify-start"}`;
    return (
        <div className={containerClasses}>
            {isUser ? (
                <div className="bg-black text-white rounded-2xl px-4 py-2 max-w-[85vw] md:max-w-lg text-sm leading-relaxed">
                    {content}
                </div>
            ) : (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw]}
                    skipHtml={false}
                    components={{
                        p: ({ ...props }) => <p {...props} className="my-3 leading-relaxed" />,
                        details: ({ ...props }) => (
                            <details
                                {...props}
                                open={isThinking}
                                className="group ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3 my-2"
                            >
                                {props.children}
                            </details>
                        ),
                        summary: ({ ...props }) => (
                            <summary
                                {...props}
                                className="flex items-center text-gray-500 dark:text-gray-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
                            >
                                <LightBulbIcon className="w-4 h-4 mr-2 inline-block align-middle" />
                                {props.children}
                                <ChevronDownIcon className="w-4 h-4 ml-2 transition-transform duration-200 -rotate-90 group-open:rotate-0" />
                            </summary>
                        ),
                        // Handle custom div elements with data-job-card attribute
                        div: ({ ...props }: React.HTMLProps<HTMLDivElement> & { [key: string]: unknown }) => {
                            // Check if this is a job listing card div
                            if (props['data-job-card'] === 'true') {
                                // Extract job data with proper type casting
                                const jobId = String(props['data-id'] || "");
                                const jobTitle = String(props['data-title'] || "");
                                const jobLocations = String(props['data-locations'] || "");
                                const jobDepartment = String(props['data-department'] || "");
                                const jobPayRange = props['data-payrange'] ? String(props['data-payrange']) : undefined;
                                const jobSummary = String(props['data-summary'] || "");

                                const locArray = jobLocations.trim() ? [jobLocations.trim()] : [];

                                return (
                                    <JobListingCard
                                        key={jobId || jobTitle || String(Math.random())}
                                        id={jobId}
                                        title={jobTitle}
                                        locations={locArray}
                                        department={jobDepartment}
                                        payRange={jobPayRange}
                                        summary={jobSummary}
                                    />
                                );
                            }
                            // Regular div element
                            return <div {...props} />;
                        },
                    }}
                    className="rounded-3xl px-4 py-3 max-w-[85vw] md:max-w-3xl prose dark:prose-invert break-words leading-relaxed min-h-7 text-black dark:text-white"
                >
                    {renderedContent}
                </ReactMarkdown>
            )}
        </div>
    );
} 