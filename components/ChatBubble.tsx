import type { ChatMessage } from "@/lib/types";

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`wayber-message-in flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
          isUser
            ? "bg-wayber-forest text-white rounded-br-sm"
            : "bg-white text-wayber-ink rounded-bl-sm border border-black/5"
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded photo"
            className="mb-2 max-h-64 w-full rounded-xl object-cover"
          />
        )}
        {message.pending ? (
          <span className="flex items-center gap-1 py-1">
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0s]" />
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0.15s]" />
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0.3s]" />
          </span>
        ) : (
          message.text && <p className="whitespace-pre-wrap">{message.text}</p>
        )}
      </div>
    </div>
  );
}
