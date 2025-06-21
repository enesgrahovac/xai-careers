import React from "react";

interface JobListingCardProps {
    id: string | number;
    title: string;
    locations: string[];
    department: string;
    payRange?: string;
    summary: string;
}

export default function JobListingCard({
    id,
    title,
    locations,
    department,
    payRange,
    summary,
}: JobListingCardProps) {
    const href = `https://job-boards.greenhouse.io/xai/jobs/${id}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="my-3 block border border-black/10 dark:border-white/15 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
            {/* Title */}
            <h3 className="text-base font-semibold mb-1 text-black dark:text-white">
                {title}
            </h3>

            {/* Meta information */}
            <div className="flex flex-wrap text-xs gap-x-2 gap-y-1 mb-2 text-zinc-600 dark:text-zinc-400">
                {department && (
                    <span className="after:content-['•'] after:ml-2 last:after:hidden">
                        {department}
                    </span>
                )}
                {payRange && (
                    <span className="after:content-['•'] after:ml-2 last:after:hidden">
                        {payRange}
                    </span>
                )}
                {locations.map((loc, idx) => (
                    <span
                        key={idx}
                        className="after:content-['•'] after:ml-2 last:after:hidden first:ml-0"
                    >
                        {loc}
                    </span>
                ))}
            </div>

            {/* Summary */}
            <p
                className="text-sm leading-snug text-zinc-700 dark:text-zinc-300"
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                }}
            >
                {summary}
            </p>
        </a>
    );
} 