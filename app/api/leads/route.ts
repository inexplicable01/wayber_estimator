import { query } from "@/lib/db";

interface CreateLeadRequest {
  address: string;
  lat: number | null;
  lng: number | null;
  uspsConfirmed: boolean;
}

export async function POST(req: Request) {
  const { address, lat, lng, uspsConfirmed } = (await req.json()) as CreateLeadRequest;

  if (!address) {
    return Response.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO estimator_leads (address, lat, lng, usps_confirmed) VALUES (?, ?, ?, ?)`,
      [address, lat, lng, uspsConfirmed ? 1 : 0],
    );
    return Response.json({ id: result.insertId });
  } catch (err) {
    console.error("[leads:create]", err);
    return Response.json({ error: "Failed to save lead" }, { status: 502 });
  }
}
