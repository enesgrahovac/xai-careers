import React from "react";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
    return (
        <div className="relative inline-block group">
            {children}
            <span
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
                role="tooltip"
            >
                {content}
            </span>
        </div>
    );
} 