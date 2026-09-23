"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import ChatBubble from "@/components/ChatBubble";
import ResultsCard from "@/components/ResultsCard";
import AddressConfirmCard, { type AddressValidationResult } from "@/components/AddressConfirmCard";
import DetailsPanel, { type ConfirmedAddress } from "@/components/DetailsPanel";
import { PHOTO_STEPS } from "@/lib/steps";
import { fileToResizedDataUrl } from "@/lib/image";
import type { ChatMessage, EstimateResponse } from "@/lib/types";

type Phase = "intro" | "address" | "details" | "photo" | "estimating" | "done";
type ConfirmStatus = "closed" | "loading" | "ready" | "error";
type Tab = "chat" | "details";
type ValueImpact = "up" | "down" | "neutral";

interface PhotoObservation {
  stepLabel: string;
  observation: string;
  imageUrl: string;
  valueImpact: ValueImpact;
}

const ADDRESS_PROMPT = "Great — what's the property address?";
const DETAILS_PROMPT = "Got it. Now the basics — how many bedrooms, bathrooms, and roughly how many square feet?";

function initialMessages(): ChatMessage[] {
  return [];
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [phase, setPhase] = useState<Phase>("intro");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [address, setAddress] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [observations, setObservations] = useState<PhotoObservation[]>([]);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingAddress, setPendingAddress] = useState("");
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>("closed");
  const [confirmResult, setConfirmResult] = useState<AddressValidationResult | null>(null);
  const [confirmedAddress, setConfirmedAddress] = useState<ConfirmedAddress | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const [bedroomsInput, setBedroomsInput] = useState("");
  const [bathroomsInput, setBathroomsInput] = useState("");
  const [sqftInput, setSqftInput] = useState("");
  const [propertyDetails, setPropertyDetails] = useState<{
    bedrooms: number;
    bathrooms: number;
    sqft: number;
  } | null>(null);

  const idCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  // Lead capture is best-effort and silent — never blocks or surfaces
  // errors to the visitor if the backend is unreachable.
  const leadIdRef = useRef<number | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, estimate]);

  function nextId() {
    idCounter.current += 1;
    return `m${idCounter.current}`;
  }

  function addMessage(msg: Omit<ChatMessage, "id">): string {
    const id = nextId();
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  }

  function updateMessage(id: string, patch: Partial<ChatMessage>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function handleStart() {
    setPhase("address");
    addMessage({ role: "assistant", text: ADDRESS_PROMPT });
  }

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = addressInput.trim();
    if (!trimmed) return;

    addMessage({ role: "user", text: trimmed });
    setAddressInput("");
    setPendingAddress(trimmed);
    setConfirmResult(null);
    setConfirmStatus("loading");

    fetch("/api/validate-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: trimmed }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Address lookup failed");
        setConfirmResult(data);
        setConfirmStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setConfirmStatus("error");
      });
  }

  function beginPhotoPhase(finalAddress: string, lat: number | null, lng: number | null) {
    setAddress(finalAddress);
    setConfirmedAddress({ formattedAddress: finalAddress, lat, lng });
    setConfirmStatus("closed");
    setConfirmResult(null);
    setPhase("details");
    addMessage({ role: "assistant", text: DETAILS_PROMPT });

    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: finalAddress, lat, lng, uspsConfirmed: confirmResult?.uspsConfirmed ?? false }),
    })
      .then((res) => res.json())
      .then((data: { id?: number }) => {
        if (data.id) leadIdRef.current = data.id;
      })
      .catch((err) => console.error("[lead:create]", err));
  }

  function handleConfirmAddress() {
    beginPhotoPhase(
      confirmResult?.formattedAddress ?? pendingAddress,
      confirmResult?.lat ?? null,
      confirmResult?.lng ?? null,
    );
  }

  function handleUseAddressAnyway() {
    beginPhotoPhase(pendingAddress, null, null);
  }

  function handleEditAddress() {
    setAddressInput(pendingAddress);
    setConfirmStatus("closed");
    setConfirmResult(null);
  }

  function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bedrooms = parseInt(bedroomsInput, 10);
    const bathrooms = parseFloat(bathroomsInput);
    const sqft = parseInt(sqftInput, 10);
    if (!bedrooms || !bathrooms || !sqft) return;

    addMessage({
      role: "user",
      text: `${bedrooms} bed · ${bathrooms} bath · ${sqft.toLocaleString()} sqft`,
    });
    setPropertyDetails({ bedrooms, bathrooms, sqft });
    setPhase("photo");
    setPhotoIndex(0);
    addMessage({ role: "assistant", text: PHOTO_STEPS[0].askText });

    if (leadIdRef.current) {
      fetch(`/api/leads/${leadIdRef.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedrooms, bathrooms, sqft }),
      }).catch((err) => console.error("[lead:details]", err));
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;

    const step = PHOTO_STEPS[photoIndex];
    setBusy(true);
    setErrorMsg(null);
    let pendingId: string | null = null;

    try {
      const dataUrl = await fileToResizedDataUrl(file);
      addMessage({ role: "user", imageUrl: dataUrl });
      pendingId = addMessage({ role: "assistant", pending: true });

      const res = await fetch("/api/photo-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          stepLabel: step.apiLabel,
          imageDataUrl: dataUrl,
        }),
      });

      const data: { text?: string; valueImpact?: ValueImpact; error?: string } = await res.json();

      if (!res.ok || !data.text) {
        throw new Error(data.error || "Photo reaction request failed");
      }

      const full = data.text;
      updateMessage(pendingId, { pending: false, text: full });

      const newObservations = [
        ...observations,
        {
          stepLabel: step.label,
          observation: full.trim(),
          imageUrl: dataUrl,
          valueImpact: data.valueImpact ?? "neutral",
        },
      ];
      setObservations(newObservations);

      if (leadIdRef.current) {
        fetch(`/api/leads/${leadIdRef.current}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepLabel: step.label,
            observation: full.trim(),
            valueImpact: data.valueImpact ?? "neutral",
            imageDataUrl: dataUrl,
          }),
        }).catch((err) => console.error("[lead:photo]", err));
      }

      const nextIndex = photoIndex + 1;
      if (nextIndex < PHOTO_STEPS.length) {
        setPhotoIndex(nextIndex);
        addMessage({ role: "assistant", text: PHOTO_STEPS[nextIndex].askText });
        setBusy(false);
      } else {
        setPhase("estimating");
        addMessage({
          role: "assistant",
          text: "That's everything I need — crunching your estimate against nearby sales now...",
        });

        const estRes = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            photos: newObservations,
            bedrooms: propertyDetails?.bedrooms,
            bathrooms: propertyDetails?.bathrooms,
            sqft: propertyDetails?.sqft,
          }),
        });

        const estData: EstimateResponse & { error?: string } = await estRes.json();
        if (!estRes.ok) throw new Error(estData.error || "Estimate request failed");
        setEstimate(estData);
        setPhase("done");
        setBusy(false);

        if (leadIdRef.current) {
          fetch(`/api/leads/${leadIdRef.current}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "completed",
              estimateLow: estData.low,
              estimateHigh: estData.high,
              conditionSummary: estData.conditionSummary,
            }),
          }).catch((err) => console.error("[lead:complete]", err));
        }
      }
    } catch (err) {
      console.error(err);
      if (pendingId) {
        setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      }
      const message = err instanceof Error ? err.message : "Something went wrong on that last step — mind trying again?";
      setErrorMsg(message);
      setBusy(false);
    }
  }

  function handleStartOver() {
    setMessages(initialMessages());
    setPhase("intro");
    setPhotoIndex(0);
    setAddress("");
    setAddressInput("");
    setObservations([]);
    setEstimate(null);
    setBusy(false);
    setErrorMsg(null);
    setPendingAddress("");
    setConfirmStatus("closed");
    setConfirmResult(null);
    setConfirmedAddress(null);
    setActiveTab("chat");
    setBedroomsInput("");
    setBathroomsInput("");
    setSqftInput("");
    setPropertyDetails(null);
    leadIdRef.current = null;
  }

  const currentStep = PHOTO_STEPS[photoIndex];

  if (phase === "intro") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-wayber-ink">
            Get your home&apos;s value in minutes
          </h1>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-wayber-ink/70">
            Share your address and snap a few quick photos, and I&apos;ll put together a
            comp-based estimate — takes about 3 minutes.
          </p>
          <button
            onClick={handleStart}
            className="mt-6 rounded-xl bg-wayber-forest px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-wayber-forest-hover"
          >
            Start
          </button>
        </main>
      </div>
    );
  }

  const showTabs = confirmedAddress !== null;
  const showChatContent = activeTab === "chat" || !showTabs;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <Header />

      {showTabs && confirmedAddress && (
        <div className="flex items-center gap-1.5 border-b border-black/5 bg-white/60 px-4 py-2 text-xs font-medium text-wayber-ink">
          <span className="text-wayber-moss">📍</span>
          <span className="truncate">{confirmedAddress.formattedAddress}</span>
          <span className="ml-auto shrink-0 text-wayber-moss">✓</span>
        </div>
      )}

      {showTabs && (
        <div className="flex border-b border-black/5 bg-white/60 px-4">
          {(["chat", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-3 py-2.5 text-sm font-semibold capitalize transition ${
                activeTab === tab ? "text-wayber-forest" : "text-wayber-ink/40"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-wayber-forest" />
              )}
            </button>
          ))}
        </div>
      )}

      <main className="mx-auto flex w-full flex-1 flex-col px-4 pb-4 min-h-0">
        {!showChatContent && confirmedAddress ? (
          <DetailsPanel
            confirmedAddress={confirmedAddress}
            propertyDetails={propertyDetails}
            steps={PHOTO_STEPS}
            observations={observations}
            phase={phase as "details" | "photo" | "estimating" | "done"}
            estimate={estimate}
          />
        ) : (
          <>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {phase === "done" && estimate && <ResultsCard estimate={estimate} />}

          <div ref={scrollAnchorRef} />
        </div>

        {confirmStatus !== "closed" && (
          <AddressConfirmCard
            status={confirmStatus}
            pendingAddress={pendingAddress}
            result={confirmResult}
            onConfirm={handleConfirmAddress}
            onEdit={handleEditAddress}
            onUseAnyway={handleUseAddressAnyway}
          />
        )}

        {errorMsg && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        <div className="sticky bottom-0 border-t border-black/5 bg-wayber-lime/40 pt-3">
          {phase === "address" && (
            <form onSubmit={handleAddressSubmit} className="flex gap-2">
              <input
                autoFocus
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="123 Main St, Springfield, IL"
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-wayber-ink shadow-sm outline-none focus:border-wayber-forest"
              />
              <button
                type="submit"
                disabled={!addressInput.trim()}
                className="rounded-xl bg-wayber-forest px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
              >
                Next
              </button>
            </form>
          )}

          {phase === "details" && (
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={bedroomsInput}
                  onChange={(e) => setBedroomsInput(e.target.value)}
                  placeholder="Beds"
                  className="w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-[15px] text-wayber-ink shadow-sm outline-none focus:border-wayber-forest"
                />
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  inputMode="decimal"
                  value={bathroomsInput}
                  onChange={(e) => setBathroomsInput(e.target.value)}
                  placeholder="Baths"
                  className="w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-[15px] text-wayber-ink shadow-sm outline-none focus:border-wayber-forest"
                />
                <input
                  type="number"
                  min={100}
                  inputMode="numeric"
                  value={sqftInput}
                  onChange={(e) => setSqftInput(e.target.value)}
                  placeholder="Sqft"
                  className="w-full min-w-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-[15px] text-wayber-ink shadow-sm outline-none focus:border-wayber-forest"
                />
              </div>
              <button
                type="submit"
                disabled={!bedroomsInput.trim() || !bathroomsInput.trim() || !sqftInput.trim()}
                className="w-full rounded-xl bg-wayber-forest px-4 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
              >
                Next
              </button>
            </form>
          )}

          {phase === "photo" && currentStep && (
            <label
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition ${
                busy ? "bg-wayber-forest/50" : "bg-wayber-forest hover:bg-wayber-forest-hover"
              }`}
            >
              {busy ? "One sec..." : `📷 Take photo: ${currentStep.helperText}`}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={busy}
                onChange={handlePhotoSelected}
              />
            </label>
          )}

          {phase === "estimating" && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-wayber-forest/50 px-4 py-3.5 text-sm font-semibold text-white">
              Building your estimate...
            </div>
          )}

          {phase === "done" && (
            <button
              onClick={handleStartOver}
              className="w-full rounded-xl border border-wayber-forest/30 bg-white px-4 py-3 text-sm font-semibold text-wayber-forest shadow-sm transition hover:bg-wayber-lime/60"
            >
              Try another address
            </button>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}
