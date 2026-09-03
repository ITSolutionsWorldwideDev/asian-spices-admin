//  components/chatbot/GenieChatWidget.tsx

"use client";

import Image from "next/image";
import { useState } from "react";

import { motion } from "framer-motion";

import { GenieChatPanel } from "@/components/chatbot/GenieChatPanel";

type GenieChatWidgetProps = {
  panelClassName?: string;
  launcherClassName?: string;
};

export function GenieChatWidget({
  panelClassName,
  launcherClassName,
}: GenieChatWidgetProps) {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={false}
        animate={
          isWidgetOpen
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 24, scale: 0.98 }
        }
        transition={{ duration: 0.32, ease: "easeOut" }}
        aria-hidden={!isWidgetOpen}
        className={
          panelClassName ??
          `fixed inset-x-3 bottom-[7.25rem] top-24 z-40 sm:inset-x-auto sm:bottom-[8rem] sm:right-5 sm:top-24 sm:w-[min(700px,calc(100vw-2rem))] xl:w-[720px] ${
            isWidgetOpen
              ? "pointer-events-auto visible"
              : "pointer-events-none invisible"
          }`
        }
      >
        <GenieChatPanel onClose={() => setIsWidgetOpen(false)} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className={
          launcherClassName ??
          "fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6"
        }
      >
        <div className="flex items-center gap-3">
          {!isWidgetOpen ? (
            <div className="rounded-full border border-[rgba(255,255,255,0.48)] bg-[rgba(238,242,255,0.75)] px-4 py-2 text-sm font-medium text-[#3730A3] shadow-[0_12px_28px_rgba(11,31,77,0.2)]">
              ✨ Need help?
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsWidgetOpen((current) => !current)}
            className="group relative flex h-[104px] w-[104px] items-center justify-center rounded-full border border-[rgba(79,70,229,0.4)] bg-[rgba(238,242,255,0.55)] shadow-[0_18px_44px_rgba(11,31,77,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(11,31,77,0.36)] sm:h-[112px] sm:w-[112px]"
            aria-label={
              isWidgetOpen ? "Close Genie chat widget" : "Open Genie chat widget"
            }
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_46%),linear-gradient(160deg,rgba(37,99,235,0.16),rgba(79,70,229,0.1))]" />
            <div className="relative flex h-[90px] w-[90px] items-center justify-center overflow-hidden rounded-full sm:h-[98px] sm:w-[98px]">
              <Image
                src="/assets/chatbot/genie-avatar.jpeg"
                alt="Genie logo"
                width={98}
                height={98}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </button>
        </div>
      </motion.div>
    </>
  );
}
