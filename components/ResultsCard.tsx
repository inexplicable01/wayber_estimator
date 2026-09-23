import type { EstimateResponse } from "@/lib/types";

const WAYBER_SELL_URL = "https://www.wayber.ai/sell-a-home";

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function ResultsCard({ estimate }: { estimate: EstimateResponse }) {
  return (
    <div className="wayber-message-in overflow-hidden rounded-2xl border border-black/5 bg-white shadow-md">
      <div className="bg-gradient-to-br from-wayber-forest to-wayber-moss px-6 py-8 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">
          Your estimate
        </p>
        <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-4xl">
          {formatMoney(estimate.low)} – {formatMoney(estimate.high)}
        </p>
        <p className="mt-3 text-sm text-white/85">
          Condition {estimate.conditionSummary}
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <p className="text-[15px] leading-relaxed text-wayber-ink">
          {estimate.explanation}
        </p>

        {estimate.highlights.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {estimate.highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-wayber-lime/60 px-3 py-2 text-sm text-wayber-forest-dark"
              >
                <span className="mt-0.5 text-wayber-moss">✓</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">
            Based on {estimate.comps.length} nearby comparable sales
          </p>
          <div className="divide-y divide-black/5 rounded-lg border border-black/5">
            {estimate.comps.map((c) => (
              <div
                key={c.address}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-wayber-ink">{c.address}</p>
                  <p className="text-xs text-black/50">
                    {c.beds}bd / {c.baths}ba · {c.sqft.toLocaleString()} sqft ·{" "}
                    {c.distanceMiles} mi · {c.soldWeeksAgo}w ago
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-wayber-forest">
                  {formatMoney(c.soldPrice)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-black/40">
          Zestimate/Redfin cross-referencing coming soon. This estimate is a
          conversational starting point, not an appraisal.
        </p>

        <a
          href={WAYBER_SELL_URL}
          className="block rounded-xl bg-wayber-forest px-4 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-wayber-forest-hover"
        >
          See what Wayber can do for your sale →
        </a>
      </div>
    </div>
  );
}
