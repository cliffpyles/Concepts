import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { ArrowDown, Send } from "lucide-react";
import "./styles.css";

type MessageRole = "user" | "assistant";

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: string;
}

const DEMO_MESSAGES: Message[] = [
    { id: "1", role: "assistant", content: "Hi! How can I help you today?", timestamp: "9:00 AM" },
    { id: "2", role: "user", content: "I'm building a scrollable chat component.", timestamp: "9:01 AM" },
    { id: "3", role: "assistant", content: "That sounds interesting! What features are you focusing on?", timestamp: "9:01 AM" },
    { id: "4", role: "user", content: "Auto-scroll on new messages, return-to-bottom button when scrolled up.", timestamp: "9:02 AM" },
    { id: "5", role: "assistant", content: "Great choices. Those are the core UX patterns from Slack and ChatGPT.", timestamp: "9:02 AM" },
    { id: "6", role: "user", content: "I want to use modern CSS—overflow-anchor, scroll-state queries.", timestamp: "9:03 AM" },
    { id: "7", role: "assistant", content: "Excellent! overflow-anchor gives you CSS-only pin-to-bottom. Scroll-state queries handle the return button visibility without JavaScript.", timestamp: "9:03 AM" },
    { id: "8", role: "user", content: "So minimal JS for the actual scroll behavior?", timestamp: "9:04 AM" },
    { id: "9", role: "assistant", content: "Exactly. You only need JS for the return button click—scrollIntoView. The rest is CSS.", timestamp: "9:04 AM" },
    { id: "10", role: "user", content: "What about semantic HTML?", timestamp: "9:05 AM" },
    { id: "11", role: "assistant", content: "Use <main> for the chat, role=\"log\" and aria-live=\"polite\" for the message list, <article> for each message, and <form> for the input.", timestamp: "9:05 AM" },
    { id: "12", role: "user", content: "Got it. And oklch for colors?", timestamp: "9:06 AM" },
    { id: "13", role: "assistant", content: "Yes—oklch() for theme tokens and the round(1.21 - L) trick for accessible contrast on dynamic backgrounds.", timestamp: "9:06 AM" },
    { id: "14", role: "user", content: "Perfect. I'll try it out. Thanks!", timestamp: "9:07 AM" },
    { id: "15", role: "assistant", content: "You're welcome! Scroll up to see the return-to-bottom button appear, then click it to jump back to the latest messages.", timestamp: "9:07 AM" },
];

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isGroupStart(prev: Message | undefined, curr: Message): boolean {
    return !prev || prev.role !== curr.role;
}

export default function ScrollableChat() {
    const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const lastSeenCountRef = useRef(messages.length);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const shouldScrollToBottomRef = useRef(false);
    const shouldScrollForTypingRef = useRef(false);

    const doSubmit = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        shouldScrollToBottomRef.current = true;
        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                role: "user",
                content: trimmed,
                timestamp: formatTime(new Date()),
            },
        ]);
        setInputValue("");
        inputRef.current?.focus();
    }, [inputValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSubmit();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            doSubmit();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    // Scroll to bottom on initial load
    useEffect(() => {
        anchorRef.current?.scrollIntoView({ block: "end" });
    }, []);

    // Track new messages when scrolled up (for "X new messages" badge)
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const checkScrollPosition = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            const threshold = 60;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;

            setIsScrolledUp(!isAtBottom);
            if (isAtBottom) {
                setNewMessageCount(0);
                lastSeenCountRef.current = messages.length;
            } else if (messages.length > lastSeenCountRef.current) {
                setNewMessageCount(messages.length - lastSeenCountRef.current);
            }
        };

        const runCheck = () => {
            requestAnimationFrame(checkScrollPosition);
        };
        runCheck();
        el.addEventListener("scroll", checkScrollPosition, { passive: true });
        return () => el.removeEventListener("scroll", checkScrollPosition);
    }, [messages.length]);

    // When messages change: if user was at bottom, keep them there (pin-to-bottom)
    useEffect(() => {
        if (!shouldScrollToBottomRef.current) return;
        shouldScrollToBottomRef.current = false;
        anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        lastSeenCountRef.current = messages.length;
    }, [messages, messages.length]);

    // When typing indicator appears, scroll to show it if user was at bottom
    useLayoutEffect(() => {
        if (isTyping && shouldScrollForTypingRef.current) {
            shouldScrollForTypingRef.current = false;
            anchorRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
    }, [isTyping]);

    // Re-check scroll position when messages change
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const id = requestAnimationFrame(() => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setIsScrolledUp(scrollHeight - scrollTop - clientHeight >= 60);
        });
        return () => cancelAnimationFrame(id);
    }, [messages]);

    // Simulate typing + new assistant messages
    useEffect(() => {
        let messageTimeout: ReturnType<typeof setTimeout>;

        const scheduleNext = () => {
            const el = scrollContainerRef.current;
            shouldScrollForTypingRef.current = !!(el && el.scrollHeight - el.scrollTop - el.clientHeight < 60);
            setIsTyping(true);
            const typingDuration = 1500 + Math.random() * 1000;
            messageTimeout = setTimeout(() => {
                const el = scrollContainerRef.current;
                const wasAtBottom = !!(el && el.scrollHeight - el.scrollTop - el.clientHeight < 60);
                shouldScrollToBottomRef.current = wasAtBottom;

                setIsTyping(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: `New message at ${formatTime(new Date())}—scroll up to see the return button.`,
                        timestamp: formatTime(new Date()),
                    },
                ]);
            }, typingDuration);
        };

        const interval = setInterval(scheduleNext, 10000);

        return () => {
            clearInterval(interval);
            clearTimeout(messageTimeout);
        };
    }, []);

    return (
        <main className="chat">
            <div ref={scrollContainerRef} className="chat__messages">
                <section
                    className="message-list"
                    role="log"
                    aria-live="polite"
                    aria-label="Chat messages"
                >
                    {messages.map((msg, i) => {
                        const prev = messages[i - 1];
                        const isGroupStartMsg = isGroupStart(prev, msg);

                        return (
                            <article
                                key={msg.id}
                                className={`message message--${msg.role} ${!isGroupStartMsg ? "message--grouped" : ""}`}
                                data-role={msg.role}
                                data-group-start={isGroupStartMsg || undefined}
                                aria-label={`${msg.role === "user" ? "You" : "Assistant"} at ${msg.timestamp}`}
                            >
                                {isGroupStartMsg && (
                                    <span className="message__timestamp" aria-hidden="true">
                                        {msg.timestamp}
                                    </span>
                                )}
                                <p className="message__content">{msg.content}</p>
                            </article>
                        );
                    })}
                    {isTyping && (
                        <article
                            className="message message--assistant message--typing"
                            aria-live="polite"
                            aria-label="Assistant is typing"
                        >
                            <div className="typing-indicator">
                                <span />
                                <span />
                                <span />
                            </div>
                        </article>
                    )}
                </section>

                <div
                    ref={anchorRef}
                    id="chat-anchor"
                    className="scroll-anchor"
                    aria-hidden="true"
                />
            </div>
            <div className="chat__footer">
                <a
                    href="#chat-anchor"
                    className={`return-btn ${!isScrolledUp ? "return-btn--at-bottom" : ""}`}
                    aria-label={newMessageCount > 0 ? `Scroll to latest messages (${newMessageCount} new)` : "Scroll to latest messages"}
                    aria-hidden={!isScrolledUp}
                >
                    <ArrowDown size={18} aria-hidden />
                    {newMessageCount > 0 && (
                        <span className="return-btn__count" aria-hidden="true">
                            {newMessageCount}
                        </span>
                    )}
                </a>
                <form className="chat__input" onSubmit={handleSubmit}>
                <label htmlFor="chat-input" className="visually-hidden">
                    Type a message
                </label>
                <div className="chat__input-inner">
                    <textarea
                        ref={inputRef}
                        id="chat-input"
                        className="chat__textarea"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message…"
                        rows={1}
                        aria-label="Message input"
                    />
                    <button
                        type="submit"
                        className="chat__send"
                        disabled={!inputValue.trim()}
                        onClick={(e) => {
                            e.preventDefault();
                            doSubmit();
                        }}
                        aria-label="Send message"
                        title="Send (Enter)"
                    >
                        <Send size={18} aria-hidden />
                    </button>
                </div>
                <span className="chat__hint" aria-hidden="true">
                    Enter to send · Shift+Enter for new line
                </span>
            </form>
            </div>
        </main>
    );
}
