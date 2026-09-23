export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text?: string;
  imageUrl?: string;
  pending?: boolean;
}

export interface EstimateResponse {
  low: number;
  high: number;
  conditionSummary: string;
  explanation: string;
  highlights: string[];
  subjectSqft: number;
  comps: {
    address: string;
    soldPrice: number;
    soldWeeksAgo: number;
    beds: number;
    baths: number;
    sqft: number;
    distanceMiles: number;
  }[];
}
