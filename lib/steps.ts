export type PhotoStepId = "exterior" | "kitchen" | "bathroom" | "custom";

export interface PhotoStep {
  id: PhotoStepId;
  label: string;
  /** What gets sent to the vision model as context for this photo. */
  apiLabel: string;
  askText: string;
  helperText: string;
}

// Fixed sequence by design (see MVP brief) — dynamic "what's missing"
// detection is explicitly a v2 feature, not this one.
export const PHOTO_STEPS: PhotoStep[] = [
  {
    id: "exterior",
    label: "Front exterior",
    apiLabel: "the front exterior of the home",
    askText: "Let's start outside — snap a photo of the front of your home.",
    helperText: "Front exterior",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    apiLabel: "the kitchen",
    askText:
      "Nice! Now the kitchen — it's usually the room that moves value the most.",
    helperText: "Kitchen",
  },
  {
    id: "bathroom",
    label: "Primary bathroom",
    apiLabel: "the primary bathroom",
    askText: "Now let's see your primary bathroom.",
    helperText: "Primary bathroom",
  },
  {
    id: "custom",
    label: "Your choice",
    apiLabel:
      "a room or feature the homeowner chose to show off themselves — figure out what it is from the photo",
    askText:
      "Last photo — show me any other room or feature you're proud of. Backyard, primary bedroom, a view, a reno you did yourself — you pick.",
    helperText: "One more feature",
  },
];
