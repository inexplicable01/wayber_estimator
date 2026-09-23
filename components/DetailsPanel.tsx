import type { PhotoStep } from "@/lib/steps";
import type { EstimateResponse } from "@/lib/types";

export interface ConfirmedAddress {
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
}

type ValueImpact = "up" | "down" | "neutral";

interface PhotoObservation {
  stepLabel: string;
  observation: string;
  imageUrl: string;
  valueImpact: ValueImpact;
}

function ValueImpactBadge({ valueImpact }: { valueImpact: ValueImpact }) {
  if (valueImpact === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-wayber-moss/15 px-1.5 py-0.5 text-xs font-semibold text-wayber-moss">
        ▲ Adds value
      </span>
    );
  }
  if (valueImpact === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-600">
        ▼ Subtracts value
      </span>
    );
  }
  return null;
}

interface PropertyDetails {
  bedrooms: number;
  bathrooms: number;
  sqft: number;
}

interface Props {
  confirmedAddress: ConfirmedAddress;
  propertyDetails: PropertyDetails | null;
  steps: PhotoStep[];
  observations: PhotoObservation[];
  phase: "details" | "photo" | "estimating" | "done";
  estimate: EstimateResponse | null;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function DetailsPanel({
  confirmedAddress,
  propertyDetails,
  steps,
  observations,
  phase,
  estimate,
}: Props) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {confirmedAddress.lat != null && confirmedAddress.lng != null && (
          <img
            src={`/api/static-map?lat=${confirmedAddress.lat}&lng=${confirmedAddress.lng}`}
            alt="Map showing the property location"
            className="h-32 w-full object-cover"
          />
        )}
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Property</p>
          <p className="mt-1 text-sm font-semibold text-wayber-ink">{confirmedAddress.formattedAddress}</p>
          <p className="mt-1 text-xs font-medium text-wayber-moss">✓ Address confirmed</p>
          {propertyDetails ? (
            <p className="mt-2 text-sm text-wayber-ink/70">
              {propertyDetails.bedrooms} bed · {propertyDetails.bathrooms} bath ·{" "}
              {propertyDetails.sqft.toLocaleString()} sqft
            </p>
          ) : (
            <p className="mt-2 text-xs text-black/40">Bed/bath/sqft — not yet, coming up in the chat</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <p className="border-b border-black/5 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-black/40">
          Photos & notes
        </p>
        <div className="divide-y divide-black/5">
          {steps.map((step) => {
            const done = observations.find((o) => o.stepLabel === step.label);
            return (
              <div key={step.id} className="flex gap-3 px-4 py-3">
                {done ? (
                  <img
                    src={done.imageUrl}
                    alt={step.label}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/5 text-lg">
                    📷
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p
                      className={`text-sm font-semibold ${done ? "text-wayber-ink" : "text-black/40"}`}
                    >
                      {done ? "✓ " : ""}
                      {step.label}
                    </p>
                    {done && <ValueImpactBadge valueImpact={done.valueImpact} />}
                  </div>
                  <p className="mt-0.5 text-sm text-wayber-ink/70">
                    {done ? done.observation : "Not yet — coming up in the chat"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {phase === "estimating" && (
        <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-wayber-ink shadow-sm">
          <span className="flex items-center gap-1">
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0s]" />
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0.15s]" />
            <span className="wayber-typing-dot h-1.5 w-1.5 rounded-full bg-wayber-forest/50 [animation-delay:0.3s]" />
          </span>
          Crunching your estimate...
        </div>
      )}

      {phase === "done" && estimate && (
        <div className="rounded-2xl bg-gradient-to-br from-wayber-forest to-wayber-moss px-4 py-4 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">Estimate ready</p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold">
            {formatMoney(estimate.low)} – {formatMoney(estimate.high)}
          </p>
          <p className="mt-1 text-xs text-white/80">See the full breakdown in the Chat tab.</p>
        </div>
      )}
    </div>
  );
}
