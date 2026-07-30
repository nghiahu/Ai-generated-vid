import React from "react"; // trigger rebuild for circular_progress, ending layout, & metrics layout templates
import { LayoutProps } from "./LayoutTypes";
import { TemplateLayout } from "./TemplateLayout";

// Re-export type and helpers
export * from "./LayoutTypes";
export { BrowserMockup } from "./LayoutHelpers";
export { TemplateLayout } from "./TemplateLayout";

export interface LayoutMetadata {
  id: string;
  name: string;
  family: "opening" | "list" | "data" | "comparison" | "quote" | "timeline" | "media" | "ending" | "blank";
  component: React.FC<LayoutProps>;
  description: string;
  templateJson?: any;
}

export const LAYOUT_REGISTRY: Record<string, LayoutMetadata> = {};

// Direct overrides map for legacy naming compatibility
const KEY_OVERRIDES: Record<string, string> = {
  spliteditorial: "SplitScreen",
  swissgrid: "FeatureGrid",
  timelinechapters: "Timeline",
  versusarena: "VersusArena",
  metriccards: "Dashboard",
  mediacard: "Gallery",
  walkthroughphoneexample: "LaptopMockup",
  scoreboardmeticcards: "StatsBanner",
  splitbandchecklist: "SplitBandChecklist",
  introbubbleimage: "IntroBubbleImage",
  intrometricpillimage: "IntroMetricPillImage",
  mappinshook: "IntegrationCloud",
  vignelliquote: "Quote",
  quietlogomark: "Ending",
};

const formatPascalCase = (str: string): string => {
  return str
    .replace(/[-_]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
    .replace(/\s+/g, "");
};

// Auto-register layouts using Vite Glob Import or Webpack require.context fallback
let templates: Record<string, any> = {};

// 1. Literal for Vite static analyzer (must be written exactly as import.meta.glob)
try {
  // @ts-ignore
  templates = import.meta.glob("./templates/**/*.json", { eager: true });
} catch (e) {
  // Fail silently in non-Vite environments
}

// 2. Literal for Webpack static analyzer (must be written exactly as require.context)
if (!templates || Object.keys(templates).length === 0) {
  try {
    // @ts-ignore
    const requireContext = require.context("./templates", true, /\.json$/);
    requireContext.keys().forEach((key: string) => {
      templates[key] = requireContext(key);
    });
  } catch (e) {
    // Fail silently in non-webpack environments
  }
}

Object.entries(templates).forEach(([path, module]: [string, any]) => {
  const json = module.default || module;
  if (!json || !json.id) return;

  const normId = json.id.replace(/[-_\s]+/g, "").toLowerCase();
  const key = KEY_OVERRIDES[normId] || formatPascalCase(json.id);

  LAYOUT_REGISTRY[key] = {
    id: key,
    name: json.name || json.id,
    family: json.family || "opening",
    component: (props: LayoutProps) => React.createElement(TemplateLayout, { ...props, templateJson: json }),
    templateJson: json,
    description: json.description || `Khung xương layout cho phân cảnh ${json.family || "opening"} phong cách YupVid.`
  };
});

export const getLayoutById = (id: string): LayoutMetadata => {
  const cleanId = id.trim().replace(/\s+/g, "");
  // Find layout ignoring case and space formatting
  const match = Object.keys(LAYOUT_REGISTRY).find(
    (key) => key.toLowerCase() === cleanId.toLowerCase()
  );
  return match ? LAYOUT_REGISTRY[match] : LAYOUT_REGISTRY[Object.keys(LAYOUT_REGISTRY)[0]];
};
