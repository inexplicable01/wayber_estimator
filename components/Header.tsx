import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-sm">
      <a href="https://www.wayber.ai" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Wayber" width={28} height={28} priority />
        <span className="font-[family-name:var(--font-heading)] text-base font-semibold text-wayber-forest">
          Wayber <span className="font-medium text-wayber-moss">Estimate</span>
        </span>
      </a>
      <a
        href="https://www.wayber.ai"
        className="text-xs font-medium text-wayber-forest/70 hover:text-wayber-forest"
      >
        wayber.ai
      </a>
    </header>
  );
}
