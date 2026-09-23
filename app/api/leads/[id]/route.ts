import { query } from "@/lib/db";

interface UpdateLeadRequest {
  status?: "in_progress" | "completed";
  estimateLow?: number;
  estimateHigh?: number;
  conditionSummary?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

// Each caller only touches the fields it knows about (property details vs.
// final estimate), so this uses COALESCE rather than a blind SET — an
// omitted field keeps its current value instead of getting clobbered to null.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as UpdateLeadRequest;

  try {
    await query(
      `UPDATE estimator_leads
       SET status = COALESCE(?, status),
           estimate_low = COALESCE(?, estimate_low),
           estimate_high = COALESCE(?, estimate_high),
           condition_summary = COALESCE(?, condition_summary),
           bedrooms = COALESCE(?, bedrooms),
           bathrooms = COALESCE(?, bathrooms),
           sqft = COALESCE(?, sqft)
       WHERE id = ?`,
      [
        body.status ?? null,
        body.estimateLow ?? null,
        body.estimateHigh ?? null,
        body.conditionSummary ?? null,
        body.bedrooms ?? null,
        body.bathrooms ?? null,
        body.sqft ?? null,
        id,
      ],
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[leads:update]", err);
    return Response.json({ error: "Failed to update lead" }, { status: 502 });
  }
}
