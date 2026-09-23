import { generateText, Output } from "ai";
import { z } from "zod";
import { VISION_MODEL } from "@/lib/ai";
import { getComps } from "@/lib/comps";

export const maxDuration = 30;

interface PhotoObservation {
  stepLabel: string;
  customLabel?: string;
  observation: string;
}

interface EstimateRequest {
  address: string;
  photos: PhotoObservation[];
  bedrooms: number;
  bathrooms: number;
  sqft: number;
}

const estimateSchema = z.object({
  conditionAdjustmentPercent: z
    .number()
    .min(-10)
    .max(15)
    .describe(
      "Percent adjustment vs. the raw comps-based value, based only on what the photos showed. 0 = right in line with comps. Positive = notably better condition/finishes. Negative = notably dated or needing work.",
    ),
  conditionSummary: z
    .string()
    .describe(
      'Very short phrase, e.g. "trending above average because of the renovated kitchen and updated primary bath". Lowercase start, no leading "condition is".',
    ),
  explanation: z
    .string()
    .describe(
      "2-4 plain-language sentences a homeowner would understand, mentioning the number of comps used and 1-2 specific things seen in the photos. No markdown.",
    ),
  highlights: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("Short bullet-point observations pulled from the photos, each under 8 words."),
});

function roundTo(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

export async function POST(req: Request) {
  const { address, photos, bedrooms, bathrooms, sqft } = (await req.json()) as EstimateRequest;

  if (!address || !photos || photos.length === 0) {
    return Response.json({ error: "Missing address or photos" }, { status: 400 });
  }
  if (!bedrooms || !bathrooms || !sqft) {
    return Response.json({ error: "Missing bedrooms, bathrooms, or sqft" }, { status: 400 });
  }

  const { subjectSqft, subjectBeds, subjectBaths, comps } = getComps(address, {
    beds: bedrooms,
    baths: bathrooms,
    sqft,
  });
  const avgPricePerSqft =
    comps.reduce((sum, c) => sum + c.soldPrice / c.sqft, 0) / comps.length;
  const baseValue = avgPricePerSqft * subjectSqft;

  const compsSummary = comps
    .map(
      (c, i) =>
        `${i + 1}. ${c.address} — sold $${c.soldPrice.toLocaleString()} (${c.sqft} sqft, ${c.beds}bd/${c.baths}ba, ${c.distanceMiles} mi away, ${c.soldWeeksAgo} weeks ago)`,
    )
    .join("\n");

  const photosSummary = photos
    .map((p, i) => {
      const label = p.customLabel ? `${p.stepLabel} (${p.customLabel})` : p.stepLabel;
      return `${i + 1}. ${label}: ${p.observation}`;
    })
    .join("\n");

  try {
    const { output } = await generateText({
      model: VISION_MODEL,
      instructions:
        "You are Wayber's home estimate assistant, writing the final summary for a homeowner. " +
        "You are given comps data and notes from photos already taken of the home. " +
        "Base your condition adjustment ONLY on the photo notes below, not on the comps. " +
        "Be specific and plain-spoken, never salesy or over-the-top. No markdown.",
      output: Output.object({ schema: estimateSchema }),
      prompt: `Subject property: ${address} (approx. ${subjectSqft} sqft, ${subjectBeds}bd/${subjectBaths}ba)

Recent comparable sales:
${compsSummary}

Photo notes from this walkthrough:
${photosSummary}`,
    });

    const adjusted = baseValue * (1 + output.conditionAdjustmentPercent / 100);
    const low = roundTo(adjusted * 0.95, 5000);
    const high = roundTo(adjusted * 1.05, 5000);

    return Response.json({
      low,
      high,
      conditionSummary: output.conditionSummary,
      explanation: output.explanation,
      highlights: output.highlights,
      comps,
      subjectSqft,
    });
  } catch (err) {
    console.error("[estimate]", err);
    const message = err instanceof Error ? err.message : "Unknown error generating the estimate";
    return Response.json({ error: message }, { status: 502 });
  }
}
