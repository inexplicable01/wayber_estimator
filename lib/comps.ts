export interface Comp {
  address: string;
  soldPrice: number;
  soldWeeksAgo: number;
  beds: number;
  baths: number;
  sqft: number;
  distanceMiles: number;
}

export interface PropertyComps {
  subjectSqft: number;
  subjectBeds: number;
  subjectBaths: number;
  comps: Comp[];
}

// Hand-curated comps for known demo addresses (see MVP brief: real comps
// data/licensing is out of scope for this pass — fake it for the ~100
// people who'll actually try this). Add real addresses here before the
// demo; anything not listed falls back to generateFallbackComps() below.
// Match key = normalizeAddress(address).
const CURATED_COMPS: Record<string, PropertyComps> = {};

export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[.,#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function parseStreet(address: string): { number: number; street: string; rest: string } {
  const match = address.match(/^\s*(\d+)\s+(.+?)(,.*)?$/);
  if (!match) {
    return { number: 100, street: "Main St", rest: "" };
  }
  const [, num, street, rest] = match;
  return { number: parseInt(num, 10), street: street.trim(), rest: (rest ?? "").trim() };
}

export interface SubjectPropertyDetails {
  beds: number;
  baths: number;
  sqft: number;
}

// Comps themselves are still simulated (a real comps feed/MLS integration is
// out of scope for this pass — see MVP brief), but the subject property's own
// beds/baths/sqft come from the homeowner now instead of being guessed from
// the address string, since a fabricated subject sqft makes the whole
// $/sqft calculation meaningless.
export function generateFallbackComps(
  address: string,
  subject?: SubjectPropertyDetails,
): PropertyComps {
  const rand = seededRandom(normalizeAddress(address));
  const { number, street, rest } = parseStreet(address);

  const subjectSqft = subject?.sqft ?? Math.round(1250 + rand() * 1750);
  const subjectBeds = subject?.beds ?? 2 + Math.floor(rand() * 3);
  const subjectBaths = subject?.baths ?? 1 + Math.floor(rand() * 3);
  const basePricePerSqft = 260 + rand() * 260;

  const comps: Comp[] = Array.from({ length: 3 }).map((_, i) => {
    const offset = Math.round((rand() - 0.5) * 40) + (i + 1) * 6;
    const compSqft = Math.max(700, subjectSqft + Math.round((rand() - 0.5) * 500));
    const pricePerSqft = basePricePerSqft * (0.9 + rand() * 0.2);
    return {
      address: `${number + offset} ${street}${rest ? " " + rest : ""}`,
      soldPrice: Math.round((compSqft * pricePerSqft) / 1000) * 1000,
      soldWeeksAgo: 2 + Math.floor(rand() * 10),
      beds: Math.max(1, subjectBeds + Math.round((rand() - 0.5) * 2)),
      baths: Math.max(1, subjectBaths + Math.round((rand() - 0.5) * 2)),
      sqft: compSqft,
      distanceMiles: Math.round((0.2 + rand() * 0.9) * 10) / 10,
    };
  });

  return { subjectSqft, subjectBeds, subjectBaths, comps };
}

export function getComps(address: string, subject?: SubjectPropertyDetails): PropertyComps {
  const curated = CURATED_COMPS[normalizeAddress(address)];
  if (curated) {
    return subject
      ? { ...curated, subjectBeds: subject.beds, subjectBaths: subject.baths, subjectSqft: subject.sqft }
      : curated;
  }
  return generateFallbackComps(address, subject);
}
