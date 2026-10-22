export type FsrsRating = 1 | 2 | 3 | 4;

export type FsrsCard = {
  dueAt: string;
  stability: number;
  difficulty: number;
  lastReviewedAt: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: "learning" | "review" | "relearning";
  lastRating: FsrsRating;
  priority: number;
};

const DAY = 86_400_000;

export function ratingFor(correct: boolean, confidence: string): FsrsRating {
  if (!correct) return 1;
  if (confidence === "guess") return 2;
  if (confidence === "confident") return 4;
  return 3;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

// FSRS-style concept scheduler. It keeps the FSRS state variables (stability,
// difficulty, retrievability, reps and lapses) and derives every interval from
// the previous card plus the observed rating. No calendar bucket is hard-coded.
export function scheduleFsrs(previous: FsrsCard | null, rating: FsrsRating, reviewedAt: Date): FsrsCard {
  const elapsedDays = previous ? Math.max(0, (reviewedAt.getTime() - new Date(previous.lastReviewedAt).getTime()) / DAY) : 0;
  const oldStability = previous?.stability ?? 0;
  const oldDifficulty = previous?.difficulty ?? 5;
  const retrievability = previous ? Math.pow(1 + elapsedDays / (9 * Math.max(.05, oldStability)), -1) : 0;
  const gradeDelta = 3 - rating;
  const difficulty = clamp(oldDifficulty + .72 * gradeDelta - .08 * (oldDifficulty - 5), 1, 10);

  let stability: number;
  let state: FsrsCard["state"];
  if (!previous) {
    stability = [.12, .55, 2.35, 5.8][rating - 1];
    state = rating === 1 ? "learning" : "review";
  } else if (rating === 1) {
    const lapsePenalty = .32 * Math.pow(difficulty / 5, -.25) * Math.pow(Math.max(.05, oldStability), .18);
    stability = clamp(oldStability * lapsePenalty, .08, oldStability);
    state = "relearning";
  } else {
    const ratingFactor = rating === 2 ? .58 : rating === 3 ? 1 : 1.52;
    const growth = 1 + ratingFactor * (11 - difficulty) / 8 * Math.pow(Math.max(.05, oldStability), -.23) * (Math.exp((1 - retrievability) * 1.55) - 1);
    stability = clamp(oldStability * Math.max(1.04, growth), .08, 36_500);
    state = "review";
  }

  // At 90% desired retention, the FSRS forgetting curve yields I = S.
  // Keeping fractional days preserves the model output instead of forcing bins.
  const scheduledDays = Math.max(.04, stability);
  const dueAt = new Date(reviewedAt.getTime() + scheduledDays * DAY).toISOString();
  const lapses = (previous?.lapses ?? 0) + (rating === 1 ? 1 : 0);
  const reps = (previous?.reps ?? 0) + 1;
  const priority = clamp((11 - difficulty) * -3 + (rating === 1 ? 95 : rating === 2 ? 72 : rating === 3 ? 38 : 18) + lapses * 4, 1, 100);
  return { dueAt, stability, difficulty, lastReviewedAt: reviewedAt.toISOString(), scheduledDays, reps, lapses, state, lastRating: rating, priority };
}

