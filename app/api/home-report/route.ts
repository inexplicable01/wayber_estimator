import { generateText, Output } from "ai";
import { z } from "zod";
import { VISION_MODEL } from "@/lib/ai";

export const maxDuration = 30;

interface PhotoObservation {
  stepLabel: string;
  observation: string;
}

interface HomeReportRequest {
  address: string;
  photos: PhotoObservation[];
}

const reportSchema = z.object({
  summary: z
    .string()
    .describe(
      "2-4 warm, plain-language sentences summing up the walkthrough for the homeowner. " +
        "No price, value, or dollar amounts. No markdown.",
    ),
  positives: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe(
      "Specific things already working in the home's favor, pulled from the photos. Each under 12 words.",
    ),
  improvements: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe(
      "Specific, actionable things worth addressing or updating, pulled from the photos. Each under 12 " +
        "words. If nothing notable stands out, say the space looks well-maintained instead of inventing an issue.",
    ),
});

export async function POST(req: Request) {
  const { address, photos } = (await req.json()) as HomeReportRequest;

  if (!address || !photos || photos.length === 0) {
    return Response.json({ error: "Missing address or photos" }, { status: 400 });
  }

  const photosSummary = photos.map((p, i) => `${i + 1}. ${p.stepLabel}: ${p.observation}`).join("\n");

  try {
    const { output } = await generateText({
      model: VISION_MODEL,
      instructions:
        "You are Wayber's home walkthrough assistant, writing a wrap-up for a homeowner who just " +
        "did a guided photo walkthrough of their own home. You're given your own earlier notes on each " +
        "photo. Do not mention price, value, or dollar amounts anywhere — this is a condition and " +
        "presentation snapshot, not an appraisal. Be specific and plain-spoken, never salesy. No markdown.",
      output: Output.object({ schema: reportSchema }),
      prompt: `Address: ${address}\n\nPhoto notes from this walkthrough:\n${photosSummary}`,
    });

    return Response.json(output);
  } catch (err) {
    console.error("[home-report]", err);
    const message = err instanceof Error ? err.message : "Unknown error generating the report";
    return Response.json({ error: message }, { status: 502 });
  }
}
