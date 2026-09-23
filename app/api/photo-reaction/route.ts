import { generateText, Output } from "ai";
import { z } from "zod";
import { BRAND_VOICE, VISION_MODEL } from "@/lib/ai";

export const maxDuration = 30;

interface ReactionRequest {
  address: string;
  stepLabel: string;
  imageDataUrl: string;
}

const reactionSchema = z.object({
  reaction: z
    .string()
    .describe("The 1-2 sentence reaction to show the homeowner, per the brand voice rules."),
  valueImpact: z
    .enum(["up", "down", "neutral"])
    .describe(
      "Compared to a typical home, does this room/feature's condition likely add value (up), " +
        "subtract value (down, e.g. dated or needing work), or is it roughly average (neutral)?",
    ),
});

export async function POST(req: Request) {
  const { address, stepLabel, imageDataUrl } = (await req.json()) as ReactionRequest;

  if (!imageDataUrl) {
    return Response.json({ error: "Missing imageDataUrl" }, { status: 400 });
  }

  try {
    const { output } = await generateText({
      model: VISION_MODEL,
      instructions: BRAND_VOICE,
      output: Output.object({ schema: reactionSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Home address: ${address}\nPhoto: ${stepLabel}\n\nReact to this photo now.`,
            },
            {
              type: "file",
              mediaType: "image",
              data: imageDataUrl,
            },
          ],
        },
      ],
    });

    if (!output.reaction.trim()) {
      return Response.json({ error: "Model returned an empty reaction" }, { status: 502 });
    }

    return Response.json({ text: output.reaction.trim(), valueImpact: output.valueImpact });
  } catch (err) {
    console.error("[photo-reaction]", err);
    const message = err instanceof Error ? err.message : "Unknown error calling the vision model";
    return Response.json({ error: message }, { status: 502 });
  }
}
