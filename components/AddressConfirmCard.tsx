export interface AddressValidationResult {
  formattedAddress: string;
  standardizedLine1: string | null;
  standardizedLine2: string | null;
  uspsConfirmed: boolean;
  isComplete: boolean;
  lat: number;
  lng: number;
}

interface Props {
  status: "loading" | "ready" | "error";
  pendingAddress: string;
  result: AddressValidationResult | null;
  onConfirm: () => void;
  onEdit: () => void;
  onUseAnyway: () => void;
}

export default function AddressConfirmCard({
  status,
  pendingAddress,
  result,
  onConfirm,
  onEdit,
  onUseAnyway,
}: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="wayber-message-in w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-sm sm:rounded-3xl">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="flex items-center gap-1">
              <span className="wayber-typing-dot h-2 w-2 rounded-full bg-wayber-forest/50 [animation-delay:0s]" />
              <span className="wayber-typing-dot h-2 w-2 rounded-full bg-wayber-forest/50 [animation-delay:0.15s]" />
              <span className="wayber-typing-dot h-2 w-2 rounded-full bg-wayber-forest/50 [animation-delay:0.3s]" />
            </span>
            <p className="text-sm text-wayber-ink/70">Looking up {pendingAddress}...</p>
          </div>
        )}

        {status === "ready" && result && (
          <>
            <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-wayber-ink">
              Is this your home?
            </h3>
            <img
              src={`/api/static-map?lat=${result.lat}&lng=${result.lng}`}
              alt="Map showing the address location"
              className="mt-3 h-36 w-full rounded-xl object-cover"
            />
            <div className="mt-3 rounded-xl bg-wayber-lime/40 px-3 py-2.5">
              <p className="text-sm font-semibold text-wayber-ink">
                {result.standardizedLine1 ?? result.formattedAddress}
              </p>
              {result.standardizedLine2 && (
                <p className="text-sm text-wayber-ink/70">{result.standardizedLine2}</p>
              )}
              {result.uspsConfirmed && (
                <p className="mt-1 text-xs font-medium text-wayber-moss">
                  ✓ USPS-recognized address
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onEdit}
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-wayber-ink shadow-sm transition hover:bg-black/5"
              >
                Edit
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-wayber-forest px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-wayber-forest-hover"
              >
                Yes, that&apos;s it
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-wayber-ink">
              Couldn&apos;t verify that address
            </h3>
            <p className="mt-2 text-sm text-wayber-ink/70">
              We couldn&apos;t look up &ldquo;{pendingAddress}&rdquo;. You can fix it or continue anyway.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={onEdit}
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-wayber-ink shadow-sm transition hover:bg-black/5"
              >
                Edit
              </button>
              <button
                onClick={onUseAnyway}
                className="flex-1 rounded-xl bg-wayber-forest px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-wayber-forest-hover"
              >
                Use anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
