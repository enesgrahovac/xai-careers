"use client";
import { useState, useRef, useEffect } from "react";
import {
    PaperClipIcon,
    ChevronDownIcon,
    ArrowUpIcon,
    CheckIcon,
    GlobeAltIcon,
    Squares2X2Icon
} from "@heroicons/react/24/outline";
import Tooltip from "./Tooltip";

interface ChatInputProps {
    onSend: (message: string, locations: string[], departments: string[]) => void;
    disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [locOpen, setLocOpen] = useState(false);
    const [deptOpen, setDeptOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Add refs for dropdown containers
    const locDropdownRef = useRef<HTMLDivElement>(null);
    const deptDropdownRef = useRef<HTMLDivElement>(null);

    // Reference to the hidden file input (PDF resume/CV)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hard-coded options from official website
    const LOCATIONS = [
        "Any",
        "Palo Alto",
        "San Francisco",
        "London",
        "Dublin",
        "Remote",
        "Memphis",
    ] as const;

    const DEPARTMENTS = [
        "Any",
        "Engineering, Research & Product",
        "Human Data",
        "Data Center Operations",
        "Other",
    ] as const;

    const [selectedLocations, setSelectedLocations] = useState<string[]>(["Any"]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>(["Any"]);

    const toggleLocation = (loc: string) => {
        setSelectedLocations((prev) => {
            if (loc === "Any") {
                return ["Any"]; // selecting "Any" clears others
            }
            const newSet = prev.includes(loc)
                ? prev.filter((l) => l !== loc)
                : [...prev.filter((l) => l !== "Any"), loc];
            return newSet.length === 0 ? ["Any"] : newSet;
        });
    };

    const toggleDepartment = (dept: string) => {
        setSelectedDepartments((prev) => {
            if (dept === "Any") {
                return ["Any"];
            }
            const newSet = prev.includes(dept)
                ? prev.filter((d) => d !== dept)
                : [...prev.filter((d) => d !== "Any"), dept];
            return newSet.length === 0 ? ["Any"] : newSet;
        });
    };

    const send = () => {
        if (disabled || !message.trim()) return;
        onSend(message.trim(), selectedLocations, selectedDepartments);
        setMessage("");
        // Focus immediately after sending so user can continue typing
        textareaRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        send();
    };

    // Auto grow textarea height
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        // Reset height to allow shrink/grow based on content
        el.style.height = "auto";

        // Determine a reasonable line-height (fallback to 24px if unable)
        const computed = window.getComputedStyle(el);
        const lineHeight = parseInt(computed.lineHeight) || 24;
        const maxHeight = lineHeight * 5; // height for 5 lines

        // Set the new height, capping at 5 lines
        const newHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${newHeight}px`;

        // Toggle vertical scrolling if content exceeds 5 lines
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [message]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (locOpen && locDropdownRef.current && !locDropdownRef.current.contains(target)) {
                setLocOpen(false);
            }
            if (deptOpen && deptDropdownRef.current && !deptDropdownRef.current.contains(target)) {
                setDeptOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [locOpen, deptOpen]);

    /**
     * When the user selects a PDF we extract its text using pdfjs-dist and append
     * it to whatever is in the message textarea so the user can review / edit
     * before sending.
     */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation – only PDFs up to ~5 MB for the MVP
        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("PDF is too large (max 5 MB). Please choose a smaller file.");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore – pdfjs-dist doesn't ship its own type declarations
            const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf");
            // The worker file – we point to a CDN to avoid bundling hassle
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

            let extracted = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const { items } = await page.getTextContent();
                extracted += (items as any[]).map((it) => (it as any).str).join(" ") + "\n";
            }

            // Append to the current textarea content so the user can review/edit
            setMessage((prev) => prev + `\n\n${extracted.trim()}`);
        } catch (err) {
            console.error("Failed to parse PDF", err);
            alert("Sorry, we couldn't read that PDF. Try another file.");
        } finally {
            // Reset the input so selecting the same file again will trigger onChange
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/15 rounded-2xl p-4 shadow-sm space-y-3 relative"
        >
            {/* Text area */}
            <textarea
                rows={1}
                placeholder="What's your ideal job?"
                className="w-full resize-none outline-none bg-transparent text-sm sm:text-base placeholder-zinc-500"
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!disabled) send();
                    }
                }}
            />

            {/* Actions row */}
            <div className="flex items-center gap-2">
                {/* Attachment */}
                <Tooltip content="Attach your resume or CV (PDF only)">
                    <button
                        type="button"
                        aria-label="Attach file"
                        className="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PaperClipIcon className="h-5 w-5" />
                    </button>
                </Tooltip>

                {/* Hidden file input for CV upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Locations dropdown */}
                <Tooltip content="Filter roles by location">
                    <div className="relative" ref={locDropdownRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setLocOpen(!locOpen);
                                setDeptOpen(false);
                            }}
                            className="group flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-3xl hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/15"
                        >
                            <GlobeAltIcon className="h-4 w-4 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                            Locations
                            <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        {locOpen && (
                            <div className="absolute z-10 bottom-full mb-2 w-52 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-800 shadow-lg p-1">
                                {LOCATIONS.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => toggleLocation(loc)}
                                        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 rounded"
                                    >
                                        <CheckIcon
                                            className={`h-4 w-4 text-black dark:text-white ${selectedLocations.includes(loc) ? "" : "opacity-0"}`}
                                        />
                                        <span className="text-sm">{loc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Tooltip>

                {/* Departments dropdown */}
                <Tooltip content="Filter roles by department">
                    <div className="relative" ref={deptDropdownRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setDeptOpen(!deptOpen);
                                setLocOpen(false);
                            }}
                            className="group flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-3xl hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/15"
                        >
                            <Squares2X2Icon className="h-4 w-4 text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                            Departments
                            <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        {deptOpen && (
                            <div className="absolute z-10 bottom-full mb-2 w-60 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-800 shadow-lg p-1">
                                {DEPARTMENTS.map((dept) => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => toggleDepartment(dept)}
                                        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10 rounded"
                                    >
                                        <CheckIcon
                                            className={`h-4 w-4 text-black dark:text-white ${selectedDepartments.includes(dept) ? "" : "opacity-0"}`}
                                        />
                                        <span className="text-sm">{dept}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Tooltip>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Model label */}
                <Tooltip content="The smartest AI model">
                    <span className="text-xs font-medium text-zinc-500 mr-2 hidden sm:inline cursor-default">Grok 3 mini</span>
                </Tooltip>

                {/* Send */}
                <button
                    type="submit"
                    aria-label="Send message"
                    className="p-2 text-white bg-black rounded-full hover:bg-zinc-800 disabled:opacity-40"
                    disabled={disabled || !message.trim()}
                >
                    <ArrowUpIcon className="h-5 w-5" />
                </button>
            </div>
        </form>
    );
} 