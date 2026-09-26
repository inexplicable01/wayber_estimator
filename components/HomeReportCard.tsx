import type { HomeReport } from "@/lib/types";

const WAYBER_SELL_URL = "https://www.wayber.ai/sell-a-home";

export default function HomeReportCard({ report }: { report: HomeReport }) {
  return (
    <div className="wayber-message-in overflow-hidden rounded-2xl border border-black/5 bg-white shadow-md">
      <div className="bg-gradient-to-br from-wayber-forest to-wayber-moss px-6 py-6 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">
          Your home walkthrough
        </p>
        <p className="mt-2 font-[family-name:var(--font-heading)] text-xl font-semibold">
          Here&apos;s what stood out
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <p className="text-[15px] leading-relaxed text-wayber-ink">{report.summary}</p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wayber-moss">
            ✓ Already looking good
          </p>
          <ul className="space-y-2">
            {report.positives.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-wayber-lime/60 px-3 py-2 text-sm text-wayber-forest-dark"
              >
                <span className="mt-0.5 text-wayber-moss">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">
            Worth a look
          </p>
          <ul className="space-y-2">
            {report.improvements.map((imp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <span className="mt-0.5 text-amber-600">•</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-black/40">
          This is a condition snapshot from your photos, not a valuation — pricing coming in a future
          update.
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
