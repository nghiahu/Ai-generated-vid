/**
 * fonts.ts
 * Tải Google Fonts đúng chuẩn Remotion với subset Vietnamese đầy đủ.
 * PHẢI import file này trong Root.tsx hoặc bất kỳ composition nào cần font.
 * 
 * Lý do không dùng @import url() trong CSS:
 * Remotion render trong Headless Chrome sandbox, không fetch được external CSS từ Google Fonts.
 * @remotion/google-fonts bundle font metadata trực tiếp vào JS — không cần network request.
 * 
 * Lưu ý subset support:
 * - Outfit: CHỈ latin/latin-ext — KHÔNG hỗ trợ Vietnamese!
 * - Be Vietnam Pro: latin + Vietnamese ✓ (dùng cho heading tiếng Việt)
 * - Inter: latin + Vietnamese ✓
 * - Montserrat: latin + Vietnamese ✓
 * - JetBrains Mono: latin ✓
 */

import { loadFont as loadBeVietnamPro } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";


// Be Vietnam Pro – heading chính cho nội dung tiếng Việt (thay Outfit vì Outfit không có Vietnamese subset)
export const { fontFamily: rawBeVietnamPro } = loadBeVietnamPro("normal", {
    weights: ["400", "500", "600", "700", "800"],
    subsets: ["latin", "vietnamese"],
});
export const fontBeVietnamPro = `${rawBeVietnamPro}, "Be Vietnam Pro", sans-serif`;

// Alias fontOutfit => fontBeVietnamPro để không phải đổi code ở các file khác
export const fontOutfit = fontBeVietnamPro;

// Inter – dùng cho body text, bullet points
export const { fontFamily: rawInter } = loadInter("normal", {
    weights: ["400", "500", "600"],
    subsets: ["latin", "vietnamese"],
});
export const fontInter = `${rawInter}, "Inter", sans-serif`;

// Montserrat – dùng cho Brutalist theme heading
export const { fontFamily: rawMontserrat } = loadMontserrat("normal", {
    weights: ["400", "500", "600", "700", "800", "900"],
    subsets: ["latin", "vietnamese"],
});
export const fontMontserrat = `${rawMontserrat}, "Montserrat", sans-serif`;

// JetBrains Mono – dùng cho Cyberpunk theme & code blocks (latin only)
export const { fontFamily: rawJetBrainsMono } = loadJetBrainsMono("normal", {
    weights: ["400", "700"],
    subsets: ["latin"],
});
export const fontJetBrainsMono = `${rawJetBrainsMono}, "JetBrains Mono", monospace`;

// Space Grotesk – dùng cho Minimal, Light, Anime themes
export const { fontFamily: rawSpaceGrotesk } = loadSpaceGrotesk("normal", {
    weights: ["400", "500", "600", "700"],
    subsets: ["latin", "vietnamese"],
});
export const fontSpaceGrotesk = `${rawSpaceGrotesk}, "Space Grotesk", sans-serif`;

import { loadFont as loadLora } from "@remotion/google-fonts/Lora";

// Lora - Serif font for Claude Editorial theme with 100% perfect Vietnamese diacritics support
export const { fontFamily: rawLora } = loadLora("normal", {
    weights: ["400", "500", "600", "700"],
    subsets: ["latin", "vietnamese"],
});
export const fontPlayfairDisplay = `${rawLora}, "Lora", serif`;

import { loadFont as loadChakraPetch } from "@remotion/google-fonts/ChakraPetch";

// Chakra Petch - Futuristic square-angled font with Vietnamese support for HUST X RIKKEI ending layout
export const { fontFamily: rawChakraPetch } = loadChakraPetch("normal", {
    weights: ["400", "500", "600", "700"],
    subsets: ["latin", "vietnamese"],
});
export const fontChakraPetch = `${rawChakraPetch}, "Chakra Petch", sans-serif`;


