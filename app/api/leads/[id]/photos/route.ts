import { query } from "@/lib/db";

interface AddLeadPhotoRequest {
  stepLabel: string;
  observation: string;
  valueImpact: "up" | "down" | "neutral";
  imageDataUrl: string;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stepLabel, observation, valueImpact, imageDataUrl } =
    (await req.json()) as AddLeadPhotoRequest;

  if (!imageDataUrl) {
    return Response.json({ error: "Missing imageDataUrl" }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO estimator_lead_photos (lead_id, step_label, observation, value_impact, photo_data_url)
       VALUES (?, ?, ?, ?, ?)`,
      [id, stepLabel, observation, valueImpact, imageDataUrl],
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[leads:photo]", err);
    return Response.json({ error: "Failed to save photo" }, { status: 502 });
  }
}
