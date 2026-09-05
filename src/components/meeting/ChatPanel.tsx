import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { useMeeting } from "@/context/MeetingContext";

const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const ChatPanel = () => {
  const { chatMessages, sendMessage, self, setActivePanel } = useMeeting();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages.length]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    // Stacks under the video in portrait (the tutor keeps watching the class
    // while reading chat) and moves to a side column in landscape, where the
    // height is the scarce axis. The old fixed w-80 aside left a 360px phone
    // about 40px of video.
    <aside className="flex min-h-0 w-full shrink-0 basis-[48%] flex-col border-t border-zinc-800 bg-zinc-900 landscape:w-80 landscape:max-w-[45%] landscape:basis-auto landscape:border-l landscape:border-t-0">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-white">Chat</h2>
        <button
          type="button"
          onClick={() => setActivePanel(null)}
          aria-label="Close chat"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {chatMessages.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            No messages yet. Say hello to your class.
          </p>
        )}
        {chatMessages.map((msg) => {
          const isMine = msg.senderId === self?.userId;
          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-300">
                  {isMine ? "You" : msg.senderName}
                </span>
                <span>{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  isMine
                    ? "bg-[var(--primary)] text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-zinc-800 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-base text-white outline-none placeholder:text-zinc-500 focus:border-[var(--primary)] sm:text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white transition disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
};
