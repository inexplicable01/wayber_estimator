export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text?: string;
  imageUrl?: string;
  pending?: boolean;
}

export interface HomeReport {
  summary: string;
  positives: string[];
  improvements: string[];
}
