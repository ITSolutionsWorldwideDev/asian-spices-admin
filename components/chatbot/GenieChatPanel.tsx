"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type GenieMessage = {
  id: string;
  role: "user" | "genie";
  content: string;
};

const WELCOME_MESSAGE =
  "Hi there! I'm here to help you manage your Partner Portal. How can I assist you today?";

const TOPIC_CARDS: Array<{ label: string; description: string }> = [
  { label: "Login Issues", description: "Help me access my account" },
  { label: "Dashboard", description: "Learn dashboard features" },
  { label: "Products", description: "Create and manage products" },
  { label: "Orders", description: "Track and manage orders" },
  { label: "Customers", description: "Manage customer accounts" },
  { label: "Account Settings", description: "Update profile & security" },
];

const TOPIC_PROMPTS: Record<string, string> = {
  "Login Issues": "I have a login issue.",
  Dashboard: "I need help with the dashboard.",
  Products: "I want to manage my products.",
  Orders: "I need help with my orders.",
  Customers: "I need help with customer management.",
  "Account Settings": "I need help with my account settings.",
};

function createMessage(role: GenieMessage["role"], content: string): GenieMessage {
  return { id: crypto.randomUUID(), role, content };
}

function GenieAvatar({ size }: { size: number }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_12px_28px_rgba(37,99,235,0.22)] ring-1 ring-[rgba(79,70,229,0.25)]"
      style={{ width: size, height: size }}
    >
      {hasError ? (
        <div className="flex h-full w-full items-center justify-center bg-[#eef2ff]">
          <Sparkles className="h-1/2 w-1/2 text-[#4F46E5]" />
        </div>
      ) : (
        <Image
          src="/assets/chatbot/genie-avatar.jpeg"
          alt="Genie logo"
          fill
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

type GenieChatPanelProps = {
  onClose: () => void;
};

export function GenieChatPanel({ onClose }: GenieChatPanelProps) {
  const [messages, setMessages] = useState<GenieMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const showTopics = messages.length === 0;

  async function sendMessage(messageText?: string) {
    const content = (messageText ?? input).trim();
    if (!content || isSending) {
      return;
    }

    setMessages((current) => [...current, createMessage("user", content)]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/genie-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();
      const reply =
        response.ok && typeof data.reply === "string"
          ? data.reply
          : (data.error ?? "Server busy or workflow error.");

      setMessages((current) => [...current, createMessage("genie", reply)]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage("genie", "Server busy or workflow error."),
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSelectTopic(label: string) {
    const prompt = TOPIC_PROMPTS[label] ?? label;
    setInput(prompt);
    inputRef.current?.focus();
  }

  function handleClearChat() {
    setMessages([]);
    setInput("");
    setIsSending(false);
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-[rgba(79,70,229,0.18)] bg-white shadow-[0_28px_90px_rgba(11,31,77,0.28)]">
      <div className="flex items-center justify-between gap-4 border-b border-[rgba(79,70,229,0.14)] bg-[rgba(238,242,255,0.6)] px-5 py-4">
        <div className="relative h-12 w-[132px] shrink-0">
          <Image
            src="/assets/chatbot/genie-header-logo.jpeg"
            alt="Genie AI"
            fill
            className="rounded-full object-cover object-left"
            sizes="132px"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            disabled={isSending}
            className="inline-flex items-center gap-2 rounded-full bg-[rgba(238,242,255,0.8)] px-3 py-2 text-sm font-medium text-[#3730A3] transition hover:bg-[rgba(238,242,255,1)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(238,242,255,0.8)] text-[#3730A3] transition hover:bg-[rgba(238,242,255,1)]"
            aria-label="Close Genie chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <GenieAvatar size={56} />
            <div className="flex-1 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6366F1]">
                Genie for Partner Portal
              </p>
              <div className="rounded-[1.45rem] border border-[rgba(79,70,229,0.16)] bg-[#f9faff] px-[1.05rem] py-[0.95rem] text-[15px] leading-7 text-[#1e1b4b]">
                {WELCOME_MESSAGE}
              </div>
            </div>
          </div>

          {showTopics ? (
            <div>
              <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6366F1]">
                Try one of these
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TOPIC_CARDS.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => handleSelectTopic(topic.label)}
                    className="rounded-[1.1rem] border border-[rgba(79,70,229,0.16)] bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:border-[rgba(79,70,229,0.4)] hover:bg-[#f5f6ff]"
                  >
                    <span className="font-semibold text-[#1e1b4b]">
                      {topic.label}
                    </span>
                    <span className="mt-1 block text-[13px] text-[#6B7280]">
                      {topic.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "items-start gap-3"}`}
            >
              {message.role === "genie" ? <GenieAvatar size={45} /> : null}
              <div
                className={
                  message.role === "user"
                    ? "max-w-[82%] rounded-[1.45rem] rounded-br-sm bg-[#d9fdd3] px-4 py-2.5 text-sm leading-7 text-[#222]"
                    : "max-w-[calc(100%-4rem)] rounded-[1.45rem] bg-[#f4f4f4] px-4 py-3 text-[15px] leading-7 text-[#1e1b4b]"
                }
              >
                {message.role === "user" ? (
                  message.content
                ) : (
                  <div className="prose-genie">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex items-start gap-3">
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { y: [0, -4, 0], scale: [1, 1.03, 1] }
                }
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full ring-1 ring-[rgba(79,70,229,0.25)]"
              >
                <video
                  className="h-full w-full object-cover"
                  src="/assets/chatbot/genie-thinking-animation.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-hidden="true"
                />
              </motion.div>
              <div className="flex items-center gap-2 rounded-[1.45rem] bg-[#f4f4f4] px-4 py-3">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="block h-2 w-2 rounded-full bg-[#6366F1]"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.05, 0.85] }}
                    transition={{
                      duration: 1.1,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[rgba(79,70,229,0.14)] bg-white px-4 py-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void sendMessage();
            }
          }}
          placeholder="Select a topic or type your question..."
          className="flex-1 rounded-full border border-[rgba(79,70,229,0.2)] px-4 py-3 text-[15px] outline-none focus:border-[#4F46E5]"
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={isSending || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-lg text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </section>
  );
}
