"use client";

import { useRef, useEffect, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import { useChat, type Message as AIMessage } from "@ai-sdk/react";

export default function ChatContainer() {
    const scrollRef = useRef<HTMLDivElement>(null);
    // A sentinel element at the bottom of the message list – easier/cheaper
    // to keep it in view than continuously animating the entire container.
    const bottomRef = useRef<HTMLDivElement>(null);

    // State for welcome message streaming effect
    const [welcomeContent, setWelcomeContent] = useState("");
    const [isStreamingWelcome, setIsStreamingWelcome] = useState(false);
    const [showStarterPrompts, setShowStarterPrompts] = useState(false);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

    const fullWelcomeMessage = "Hi, I'm the xAI careers assistant. I'll help match you to your best fit at xAI. Please feel free to ask me any question or attach your CV and I will help recommend you top positions that match your experience and interests.";

    const allStarterPrompts = [
        "What engineering roles are available at xAI?",
        "Show me remote positions at xAI",
        "What roles would be good for someone with machine learning experience?",
        "Tell me about the company culture at xAI",
        "What data science positions does xAI have open?",
        "Are there any entry-level opportunities at xAI?",
        "What roles are available in San Francisco?",
        "Show me positions in the Research & Product department",
        "What backend engineering roles does xAI offer?",
        "Are there any AI/ML research positions available?",
        "What opportunities exist for senior engineers?",
        "Tell me about xAI's infrastructure and DevOps roles"
    ];

    // Function to randomly select starter prompts
    const getRandomStarterPrompts = () => {
        const shuffled = [...allStarterPrompts].sort(() => 0.5 - Math.random());
        // Show 3 on mobile, 4 on desktop
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const count = isMobile ? 3 : 4;
        return shuffled.slice(0, count);
    };

    const [starterPrompts] = useState(() => getRandomStarterPrompts());

    const {
        messages,
        append,
        isLoading,
    } = useChat({
        api: "/api/chat",
        streamProtocol: "text",
    });

    // Initialize with welcome message on first load
    useEffect(() => {
        // Only run this once on mount
        setShowWelcomeMessage(true);
        setIsStreamingWelcome(true);
        
        // Start streaming the welcome message
        let currentIndex = 0;
        const streamInterval = setInterval(() => {
            if (currentIndex < fullWelcomeMessage.length) {
                const partialMessage = fullWelcomeMessage.slice(0, currentIndex + 1);
                setWelcomeContent(partialMessage);
                currentIndex++;
            } else {
                clearInterval(streamInterval);
                setIsStreamingWelcome(false);
                // Show starter prompts after streaming is done
                setTimeout(() => {
                    setShowStarterPrompts(true);
                }, 666);
            }
        }, 20);

        return () => clearInterval(streamInterval);
    }, []); // Empty dependency array ensures this runs once on mount

    const sendMessage = (
        text: string,
        locations: string[],
        departments: string[],
        cvText?: string
    ) => {
        // Hide starter prompts and welcome message once user sends a message
        setShowStarterPrompts(false);
        setShowWelcomeMessage(false);
        
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

    const handleStarterPromptClick = (prompt: string) => {
        sendMessage(prompt, ["Any"], ["Any"]);
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
    }, [messages, welcomeContent]);

    const hasUserMessages = messages.some(m => m.role === 'user');

    return (
        <div className="flex flex-col flex-1 w-full min-h-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6 max-w-3xl mx-auto">
                    {/* Show welcome message */}
                    {showWelcomeMessage && (
                        <ChatMessage
                            key="welcome"
                            role="assistant"
                            content={welcomeContent}
                            isThinking={isStreamingWelcome}
                        />
                    )}
                    
                    {/* Regular chat messages */}
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
            
            <div className="pb-4 px-4 sm:px-0 max-w-3xl mx-auto w-full">
                {/* Show starter prompts above chat input when no user messages */}
                {showStarterPrompts && !hasUserMessages && !isStreamingWelcome && (
                    <div className="space-y-3 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Here are some questions to get you started:
                        </p>
                        <div className="grid gap-2">
                            {starterPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStarterPromptClick(prompt)}
                                    className="text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                                    disabled={isLoading}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <ChatInput onSend={sendMessage} disabled={isLoading} />
            </div>
        </div>
    );
} 