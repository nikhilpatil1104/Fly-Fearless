"use client";
import React from "react";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { streamChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}


// ── Markdown renderer ─────────────────────────────────────────────────────────
function inlineMd(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} className="font-semibold">{p.slice(2,-2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i}>{p.slice(1,-1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function renderMd(text: string): React.ReactNode {
  const lines = text.split("\n");
  const els: React.ReactNode[] = [];
  let list: string[] = [];
  let k = 0;

  const flushList = () => {
    if (!list.length) return;
    els.push(
      <ul key={k++} className="list-disc list-inside space-y-0.5 my-1.5 ml-1">
        {list.map((item, i) => <li key={i} className="leading-relaxed">{inlineMd(item)}</li>)}
      </ul>
    );
    list = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("- ") || t.startsWith("• ")) { list.push(t.slice(2)); continue; }
    const nm = t.match(/^(\d+)\.\s+(.+)/);
    if (nm) { list.push(nm[2]); continue; }
    flushList();
    if (!t) { els.push(<div key={k++} className="h-1.5" />); continue; }
    if (t.startsWith("## ")) { els.push(<p key={k++} className="font-bold mt-2 mb-0.5">{inlineMd(t.slice(3))}</p>); continue; }
    els.push(<p key={k++} className="leading-relaxed">{inlineMd(t)}</p>);
  }
  flushList();
  return <>{els}</>;
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm SkyRisk AI — powered by GPT-4o. Ask me about flight delays, best booking times, baggage rules, airport tips, or any flight question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Msg = { id: Date.now().toString(), role: "user", content: text };
    const assistantId = `${Date.now()}-ai`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      for await (const chunk of streamChat(history)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I'm having trouble connecting. Please try again." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50
                       w-14 h-14 rounded-full
                       bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                       text-white shadow-2xl
                       flex items-center justify-center
                       transition-colors"
            aria-label="Open AI flight assistant"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50
                       w-[380px] h-[520px]
                       bg-white dark:bg-[#1C1F26]
                       rounded-2xl shadow-2xl
                       border border-gray-200 dark:border-gray-700
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--sky-primary)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">SkyRisk AI</p>
                  <p className="flex items-center gap-1 text-[10px] text-[var(--sky-green)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--sky-green)] animate-pulse" />
                    Powered by GPT-4o
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--sky-primary)] text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "assistant" && msg.content
                      ? <div className="text-[13px] space-y-0.5">{renderMd(msg.content)}</div>
                      : msg.role === "user"
                      ? <span className="text-[13px]">{msg.content}</span>
                      : streaming && msg.role === "assistant" ? <TypingIndicator /> : null}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts (only when fresh) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {["Best time to book?", "Cheapest day to fly?", "Baggage policy DL"].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setInput(p); inputRef.current?.focus(); }}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700
                               text-gray-600 dark:text-gray-400 hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]
                               transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Ask about flights..."
                  disabled={streaming}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white
                             placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="w-8 h-8 rounded-full bg-[var(--sky-primary)] disabled:bg-gray-300 dark:disabled:bg-gray-700
                             text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
