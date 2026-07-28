export interface SceneIntent {
  type: "opening" | "comparison" | "metric" | "list" | "quote" | "timeline" | "media" | "ending";
  importance: "high" | "medium" | "low";
  density: "dense" | "medium" | "sparse";
  emotion: "exciting" | "serious" | "informative" | "neutral";
}

export interface SceneDescriptors {
  pointCount: number;
  headingLength: number;   // chars
  hasImage: boolean;
  hasMetrics: boolean;     // có point type="metric" không
  hasTerminal: boolean;    // có point type="terminal" không
}

interface ScoredLayout {
  id: string;
  score: number;
}

export function scoreLayout(
  layoutId: string,
  layoutFamily: string,
  intent: SceneIntent,
  descriptors: SceneDescriptors
): number {
  let score = 0;

  // --- Type matching (base score)
  const familyMap: Record<string, string[]> = {
    opening:    ["opening"],
    comparison: ["comparison"],
    metric:     ["data"],
    list:       ["list"],
    quote:      ["quote"],
    timeline:   ["timeline"],
    media:      ["media"],
    ending:     ["ending"],
  };
  if (familyMap[intent.type]?.includes(layoutFamily)) score += 50;

  // --- Density penalties
  if (intent.density === "dense" && descriptors.pointCount > 4) score -= 30;
  if (intent.density === "sparse" && descriptors.pointCount < 2) score += 10;

  // --- Image presence
  if (descriptors.hasImage && layoutFamily === "media") score += 40;
  if (!descriptors.hasImage && layoutFamily === "media") score -= 40;

  // --- Heading length penalty for small title areas
  if (descriptors.headingLength > 40 && layoutFamily === "data") score -= 20;

  // --- Metric boost
  if (descriptors.hasMetrics && layoutFamily === "data") score += 30;

  // --- Importance boost for accent-heavy layouts
  if (intent.importance === "high") score += 15;

  return score;
}

export function selectBestLayout(
  intent: SceneIntent,
  descriptors: SceneDescriptors,
  registry: Record<string, { family: string }>
): string {
  const scored: ScoredLayout[] = Object.entries(registry).map(([id, meta]) => ({
    id,
    score: scoreLayout(id, meta.family, intent, descriptors)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.id ?? "IntroMediaHero"; // fallback
}
