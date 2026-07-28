import { fontOutfit, fontMontserrat, fontJetBrainsMono } from "./fonts";

export const VDE_SPACING = {
  containerPaddingLandscape: "86px",
  containerPaddingPortrait: "40px",
  cardPadding: "32px 40px",
  gapDense: 15,
  gapMedium: 30,
  gapSparse: 50,
};

export const VDE_FONTS = {
  title: fontOutfit,
  body: fontMontserrat,
  code: fontJetBrainsMono,
};

export const VDE_THEMES = {
  japan: {
    background: "#080609",
    accentColor: "#FFB7C5",
  },
  tech: {
    background: "#090d1a",
    accentColor: "#00E5FF",
  },
  finance: {
    background: "#050B14",
    accentColor: "#FFB300",
  },
  nature: {
    background: "#060D0B",
    accentColor: "#00E676",
  },
  rikkei: {
    background: "#ffffff",
    accentColor: "#A8232A",
  },
  default: {
    background: "#090d1a",
    accentColor: "#FFB7C5",
  }
};
