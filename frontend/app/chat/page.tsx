"use client";
import React from "react";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Plane, Trash2 } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import { streamChat } from "@/lib/api";

interface Msg { id: string; role: "user" | "assistant"; content: string; }

const SUGGESTED = [
  "What's the cheapest day to fly from NYC to Miami?",
  "How far in advance should I book a transatlantic flight?",
  "What is Delta's baggage policy?",
  "Which airlines have the best on-time record?",
  "Best airports to avoid during summer storms?",
  "Do I need a visa to fly through Heathrow?",
];


// ── Simple markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  // Split into paragraphs/lines
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc list-inside space-y-1 my-2 ml-1">
        {listItems.map((item, i) => (
          <li key={i} className="leading-relaxed">{inlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet point
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      listItems.push(numMatch[2]);
      continue;
    }

    // Flush any pending list
    flushList();

    if (trimmed === "") {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Heading with ##
    if (trimmed.startsWith("## ")) {
      elements.push(
        <p key={key++} className="font-bold text-base mt-3 mb-1">
          {inlineMarkdown(trimmed.slice(3))}
        </p>
      );
      continue;
    }

    elements.push(
      <p key={key++} className="leading-relaxed">
        {inlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Parse **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm SkyRisk AI, your personal flight specialist powered by GPT-4o.\n\nI can help with flight delays, booking timing, baggage rules, airport tips, airline comparisons, weather impacts, visa requirements, and pricing trends.\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");

    const userId = Date.now().toString();
    const aiId = `${Date.now()}-ai`;

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content },
      { id: aiId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });
      for await (const chunk of streamChat(history)) {
        setMessages((prev) =>
          prev.map((m) => m.id === aiId ? { ...m, content: m.content + chunk } : m)
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId ? { ...m, content: "Connection error. Please try again." } : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0F1117]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-[#1C1F26] border-r border-gray-200 dark:border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-full bg-[var(--sky-primary)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">SkyRisk AI</p>
              <p className="text-[10px] text-[var(--sky-green)]">● GPT-4o · Flight specialist</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Suggested questions</p>
          <div className="space-y-2">
            {SUGGESTED.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                className="w-full text-left text-xs px-3 py-2.5 rounded-lg
                           border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300
                           hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]
                           transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() =>
                setMessages([{
                  id: "welcome",
                  role: "assistant",
                  content: "New conversation started. How can I help you with your travel plans?",
                }])
              }
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear conversation
            </button>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full space-y-4">
            {messages.map((msg) => (
              <AnimatePresence key={msg.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[var(--sky-primary)] flex items-center justify-center flex-shrink-0 mt-1">
                      <Plane className="w-3.5 h-3.5 text-white -rotate-45" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[var(--sky-primary)] text-white rounded-tr-sm"
                        : "bg-white dark:bg-[#1C1F26] text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && msg.content
                      ? <div className="space-y-0.5 text-[15px]">{renderMarkdown(msg.content)}</div>
                      : msg.role === "user"
                      ? <span className="text-[15px]">{msg.content}</span>
                      : null}
                    {!msg.content && streaming && msg.role === "assistant" ? (
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          />
                        ))}
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              </AnimatePresence>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1F26] px-4 py-4">
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about flights, baggage, delays, booking tips…"
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none bg-gray-100 dark:bg-gray-800
                           text-sm text-gray-900 dark:text-white
                           placeholder:text-gray-400
                           rounded-2xl px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-[var(--sky-primary)]
                           max-h-36 overflow-y-auto"
                style={{ minHeight: "48px" }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="w-12 h-12 rounded-full bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                           disabled:bg-gray-300 dark:disabled:bg-gray-700
                           text-white flex items-center justify-center flex-shrink-0
                           transition-colors self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              SkyRisk AI may make mistakes. Verify important travel information with your airline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
