export interface UIComponentDescriptor {
  id: string;
  type: "title" | "hero_metric" | "terminal" | "feature_card" | "badge_row" | "media" | "subheader" | "logo_row" | "button";
  height: number;
  priority: number;
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Helper to inspect points and convert to components
export const parseSceneToComponents = (
  heading: string,
  points: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  imageUrl: string,
  layoutType: string
): UIComponentDescriptor[] => {
  const list: UIComponentDescriptor[] = [];

  // 1. Title is always required
  list.push({
    id: "title",
    type: "title",
    height: 280,
    priority: 100,
    data: { text: heading }
  });

  // 2. Parse points into specific UI elements
  if (points && points.length > 0) {
    points.forEach((pt, idx) => {
      let text = "";
      let animation = "slide-up";
      let delay = Number((idx * 1.5).toFixed(1));

      if (typeof pt === "string") {
        text = pt.trim();
      } else if (pt && typeof pt === "object") {
        animation = pt.animation || "slide-up";
        if (typeof pt.delay === "number") {
          delay = pt.delay;
        }
        text = (pt.text || "").trim();

        // Direct dynamic block mapping if type is provided by Gemini
        if (pt.type) {
          let type: "title" | "hero_metric" | "terminal" | "feature_card" | "badge_row" | "media" | "subheader" | "logo_row" | "button" = "feature_card";
          const rawType = pt.type;
          if (rawType === "text" || rawType === "card") {
            type = "feature_card";
          } else if (rawType === "metric") {
            type = "hero_metric";
          } else {
            type = rawType as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          }

          let height = 150;
          let priority = 70;

          if (type === "subheader") {
            height = 100;
            priority = 95;
          } else if (type === "logo_row") {
            height = 200;
            priority = 88;
          } else if (type === "button") {
            height = 130;
            priority = 65;
          } else if (type === "terminal") {
            height = 220;
            priority = 85;
          } else if (type === "hero_metric") {
            height = 260;
            priority = 90;
          } else if (type === "badge_row") {
            height = 130;
            priority = 50;
          }

          list.push({
            id: `${type}_${idx}`,
            type,
            height,
            priority,
            data: {
              text,
              code: text,
              value: pt.value || "",
              subtext: pt.subtext || "",
              badges: pt.badges || [],
              logos: pt.logos || [],
              animation,
              delay
            }
          });
          return;
        }
      }

      if (!text) return;

      // A. Terminal Command
      const isCommandLine = text.startsWith("$") || text.includes("curl ") || text.includes("npm install") || text.includes("pip install") || text.includes("git clone");
      if (isCommandLine) {
        list.push({
          id: `term_${idx}`,
          type: "terminal",
          height: 220,
          priority: 85,
          data: { code: text, animation, delay }
        });
        return;
      }

      // B. Badges Row
      const isBadges = text.includes(",") && (
        text.includes("⭐") || 
        text.includes("🔥") || 
        text.includes("sao") || 
        text.includes("MIT") || 
        text.split(",").every(part => part.trim().length > 0 && part.trim().length < 15)
      );
      if (isBadges) {
        list.push({
          id: `badges_${idx}`,
          type: "badge_row",
          height: 130,
          priority: 50,
          data: { badges: text.split(",").map(b => b.trim()).filter(b => b.length > 0), animation, delay }
        });
        return;
      }

      // C. Hero Metric
      const isHeroMetric = text.startsWith("-") || text.startsWith("+") || text.match(/^[+-]?\d+%/i);
      if (isHeroMetric) {
        const parenStart = text.indexOf("(");
        const parenEnd = text.indexOf(")");
        let value = text;
        let subtext = "";
        
        if (parenStart !== -1 && parenEnd !== -1) {
          value = text.substring(0, parenStart).trim();
          subtext = text.substring(parenStart + 1, parenEnd).trim();
        } else {
          const dashIdx = text.indexOf("—");
          if (dashIdx !== -1) {
            value = text.substring(0, dashIdx).trim();
            subtext = text.substring(dashIdx + 1).trim();
          }
        }
        list.push({
          id: `metric_${idx}`,
          type: "hero_metric",
          height: 260,
          priority: 90,
          data: { value, subtext, animation, delay }
        });
        return;
      }

      // D. Default Feature Card
      list.push({
        id: `card_${idx}`,
        type: "feature_card",
        height: 150,
        priority: 70,
        data: { text, animation, delay }
      });
    });
  }

  // 3. Media block if we are in SplitScreen layout
  if (imageUrl && layoutType === "Split Screen") {
    list.push({
      id: "media",
      type: "media",
      height: 450,
      priority: 60,
      data: { url: imageUrl }
    });
  }

  return list;
};

export interface AdaptiveLayoutResult {
  components: UIComponentDescriptor[];
  fontScale: number;      // 0.75 – 1.0
  paddingScale: number;   // 0.5 – 1.0
  gap: number;            // 15 – 50px
  pages: UIComponentDescriptor[][];
}

export function estimateComponentHeight(
  comp: UIComponentDescriptor,
  fontScale: number = 1.0
): number {
  switch (comp.type) {
    case "title": {
      const chars = (comp.data.text || "").length;
      const lines = Math.ceil(chars / 20);
      return Math.max(120, lines * 80 * fontScale);
    }
    case "feature_card": {
      const chars = (comp.data.text || "").length;
      const lines = Math.ceil(chars / 35);
      return Math.max(80, lines * 52 * fontScale);
    }
    case "hero_metric": return Math.round(240 * fontScale);
    case "terminal":    return Math.round(200 * fontScale);
    case "subheader":   return Math.round(90 * fontScale);
    case "badge_row":   return Math.round(110 * fontScale);
    case "button":      return Math.round(110 * fontScale);
    default:            return Math.round(150 * fontScale);
  }
}

export const adaptiveLayoutEngine = (
  components: UIComponentDescriptor[],
  maxHeight: number = 1550,
): AdaptiveLayoutResult => {
  let fontScale = 1.0;
  let paddingScale = 1.0;
  let gap = 50;
  let active = [...components];
  
  const calculateTotalHeight = (comps: UIComponentDescriptor[], fs: number, g: number) => {
    return comps.reduce((sum, item) => sum + estimateComponentHeight(item, fs), 0) + (comps.length - 1) * g;
  };

  // Stage 1: Font scale reduction (1.0 -> 0.75, step 0.05)
  for (let fs = 1.0; fs >= 0.75; fs -= 0.05) {
    if (calculateTotalHeight(active, fs, gap) <= maxHeight) {
      fontScale = parseFloat(fs.toFixed(2));
      return { components: active, fontScale, paddingScale, gap, pages: [active] };
    }
  }
  
  // Font scale is locked at 0.75 at this point
  fontScale = 0.75;

  // Stage 2: Padding scale reduction (1.0 -> 0.5, step 0.1)
  for (let ps = 1.0; ps >= 0.5; ps -= 0.1) {
    const totalHeight = active.reduce((sum, item) => {
      const baseHeight = estimateComponentHeight(item, fontScale);
      if (item.type !== "title") {
        return sum + Math.max(50, baseHeight - (1 - ps) * 30);
      }
      return sum + baseHeight;
    }, 0) + (active.length - 1) * gap;

    if (totalHeight <= maxHeight) {
      paddingScale = parseFloat(ps.toFixed(2));
      return { components: active, fontScale, paddingScale, gap, pages: [active] };
    }
  }

  paddingScale = 0.5;

  // Stage 3: Gap reduction (50px -> 30px -> 15px)
  const gaps = [50, 40, 30, 20, 15];
  for (const g of gaps) {
    const totalHeight = active.reduce((sum, item) => {
      const baseHeight = estimateComponentHeight(item, fontScale);
      if (item.type !== "title") {
        return sum + Math.max(50, baseHeight - 15); // locked at paddingScale 0.5
      }
      return sum + baseHeight;
    }, 0) + (active.length - 1) * g;

    if (totalHeight <= maxHeight) {
      gap = g;
      return { components: active, fontScale, paddingScale, gap, pages: [active] };
    }
  }

  gap = 15;

  // Stage 4: Paginate (Split into pages/slides if there's still too much content)
  const title = active.find(c => c.type === "title");
  const others = active.filter(c => c.type !== "title");
  
  if (others.length > 4) {
    const pageSize = 4;
    const pages: UIComponentDescriptor[][] = [];
    for (let i = 0; i < others.length; i += pageSize) {
      const pageComps: UIComponentDescriptor[] = [];
      if (title) pageComps.push(title);
      pageComps.push(...others.slice(i, i + pageSize));
      pages.push(pageComps);
    }
    return { components: pages[0], fontScale: 1.0, paddingScale: 1.0, gap: 40, pages };
  }

  // Stage 5: Drop lowest priority (same as V1, last resort only)
  while (active.length > 0) {
    const totalHeight = active.reduce((sum, item) => {
      const baseHeight = estimateComponentHeight(item, fontScale);
      if (item.type !== "title") {
        return sum + Math.max(50, baseHeight - 15);
      }
      return sum + baseHeight;
    }, 0) + (active.length - 1) * gap;

    if (totalHeight <= maxHeight) {
      break;
    }

    let lowestIdx = -1;
    for (let i = 0; i < active.length; i++) {
      if (active[i].type === "title") continue;
      if (lowestIdx === -1 || active[i].priority < active[lowestIdx].priority) {
        lowestIdx = i;
      }
    }

    if (lowestIdx === -1) break; // only title left
    active.splice(lowestIdx, 1);
  }

  return { components: active, fontScale, paddingScale, gap, pages: [active] };
};

// Collision resolver algorithm (backward compat wrapper)
export const resolveLayoutConstraints = (
  components: UIComponentDescriptor[],
  maxHeight: number = 1550,
  gap: number = 30
): UIComponentDescriptor[] => {
  return adaptiveLayoutEngine(components, maxHeight).components;
};
