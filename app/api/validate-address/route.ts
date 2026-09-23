export const maxDuration = 15;

interface ValidateRequest {
  address: string;
}

interface GoogleValidationResponse {
  result?: {
    verdict?: {
      addressComplete?: boolean;
      hasUnconfirmedComponents?: boolean;
    };
    address?: {
      formattedAddress?: string;
    };
    geocode?: {
      location?: {
        latitude: number;
        longitude: number;
      };
    };
    uspsData?: {
      standardizedAddress?: {
        firstAddressLine?: string;
        secondAddressLine?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        zipCodeExtension?: string;
      };
      dpvConfirmation?: string;
    };
  };
}

export async function POST(req: Request) {
  const { address } = (await req.json()) as ValidateRequest;

  if (!address?.trim()) {
    return Response.json({ error: "Missing address" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Address validation is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            regionCode: "US",
            addressLines: [address],
          },
          enableUspsCass: true,
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Address validation failed", res.status, errText);
      return Response.json({ error: "Address lookup failed" }, { status: 502 });
    }

    const data: GoogleValidationResponse = await res.json();
    const result = data.result;
    const usps = result?.uspsData?.standardizedAddress;
    const location = result?.geocode?.location;

    if (!location) {
      return Response.json({ error: "Couldn't locate that address" }, { status: 404 });
    }

    const standardizedLine1 = usps?.firstAddressLine;
    const standardizedCityStateZip = usps
      ? [usps.city, usps.state].filter(Boolean).join(", ") +
        (usps.zipCode ? ` ${usps.zipCode}${usps.zipCodeExtension ? `-${usps.zipCodeExtension}` : ""}` : "")
      : undefined;

    return Response.json({
      formattedAddress: result?.address?.formattedAddress ?? address,
      standardizedLine1: standardizedLine1 ?? null,
      standardizedLine2: standardizedCityStateZip ?? null,
      uspsConfirmed: result?.uspsData?.dpvConfirmation === "Y",
      isComplete: Boolean(result?.verdict?.addressComplete),
      lat: location.latitude,
      lng: location.longitude,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Address lookup failed" }, { status: 500 });
  }
}
