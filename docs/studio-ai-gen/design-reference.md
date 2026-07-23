# Studio AI Gen — Design Reference (Phân Tích Ảnh Mẫu)

> **Mục đích:** File này là tài liệu tham chiếu thiết kế cho AI đọc khi sinh code Remotion/React.  
> Mọi thành phần, màu sắc, animation đều phải bám theo 3 ảnh mẫu phân tích bên dưới.  
> **Màu sắc** lấy từ theme `ai_hub_grid` trong `vde_themes.json`. Không tự đặt màu mới.

> 🚨 **QUY TẮC TỐI CAO DÀNH CHO AI (DO NOT VIOLATE):**  
> Các đoạn chữ/văn bản minh họa trong file này (ví dụ: "Chỉ ~6% tổ chức", "AI giờ là mặc định", "900tr", "$2.590 TỶ ĐÔ", "Engineered for Scale") CHỈ LÀ MINH HỌA BỐ CỤC KHUNG HÌNH (LAYOUT SCHEMATICS).  
> **TUYỆT ĐỐI CẤM SAO CHÉP HOẶC DÙNG LẠI CHỮ MẪU TRONG FILE NÀY VÀO CODE TSX.**  
> 100% Nội dung Chữ, Tiêu đề, Thẻ Card, Số liệu và Lời thoại trong TSX bắt buộc phải đọc ĐỘNG từ object \`scene\` được truyền trong prompt (\`scene.heading\`, \`scene.points\`, \`scene.voiceover\`).

---

## Quy Chuẩn Vùng An Toàn (Safe Zone) Cho Video Dọc 9:16 (TikTok/Shorts)

Để tránh bị che khuất bởi các nút tương tác (thả tim, bình luận), mô tả video (caption), logo ứng dụng hoặc tai thỏ điện thoại, toàn bộ layout sinh code TSX phải tuân thủ nghiêm ngặt các quy tắc khoảng cách sau:

- **Mép Trên (Top Padding)**: Chừa ít nhất **220px** từ đỉnh màn hình. Không đặt tiêu đề, chữ quan trọng sát mép trên.
- **Mép Dưới (Bottom Padding)**: Chừa ít nhất **280px** từ đáy màn hình. Không đặt thẻ phụ đề (subtitle card) quá sát đáy. Thẻ phụ đề nên đặt ở khoảng `bottom: 300px` (hoặc `bottom: 16%`).
- **Mép Hai Bên (Left/Right Padding)**: Chừa ít nhất **80px** ở cả bên trái và bên phải để tránh việc chữ hoặc badge bị cắt mất (clipping) ở viền màn hình.
- **Góc Dưới Cùng Bên Phải**: Tuyệt đối không đặt bất kỳ thông tin số liệu hay sticker nào ở góc này để tránh đè lên hệ thống nút tương tác.
- **Vùng Hiển Thị Cốt Lõi (Core Safe Area)**: Chỉ bố trí thông tin trong khung trung tâm **920px × 1380px** (nằm chính giữa màn hình 1080px × 1920px, đảm bảo khoảng cách an toàn hai bên mép).

---

## Theme Tokens (từ `ai_hub_grid`)

```
background:       #030712           (nền chàm tối gần đen)
cardBg:           linear-gradient(135deg, rgba(8,17,37,0.7), rgba(3,7,18,0.4))
border:           1px solid rgba(59,130,246,0.35)   (viền xanh dương mờ)
accent:           #3b82f6           (xanh dương chủ đạo)
text:             #ffffff
textSecondary:    rgba(255,255,255,0.65)
radius:           16px
shadow:           0 0 25px rgba(59,130,246,0.15)
font:             "Be Vietnam Pro", sans-serif
```

**Màu accent đặc biệt — xuất hiện trong 3 ảnh mẫu:**
- Orange glow:    `#f97316` (accent số % donut, highlight từ khóa)
- Cyan/Blue hero: `#60a5fa` hoặc `#93c5fd` (số liệu hero lớn)
- Cam nổi bật:    `#fb923c` (màu cam nhạn — dùng cho animated counter glow)

---

## Ảnh Mẫu 1 — Pattern: `DONUT_GAUGE` (Phân Cảnh Phần Trăm)

**Ảnh tham chiếu:** Phân cảnh "Nhưng ít ai nói... 6% khai thác giá trị lớn"

### Cấu Trúc Layout (từ trên xuống dưới, 9:16 dọc)

```
┌──────────────────────────────────────────┐  1080 × 1920
│                                          │
│  [TITLE ZONE — center top]               │  top: ~22%
│   "Nhưng ít ai nói..."                   │
│   font-size: ~48px, weight: 700          │
│   color: #ffffff, text-align: center     │
│                                          │
│  [DONUT GAUGE — center]                  │  center: ~40%
│   diameter: ~280px                       │
│   track: rgba(255,255,255,0.08) 16px     │
│   fill: #f97316 16px  → arc từ top      │
│   gap: rounded caps (strokeLinecap=round)│
│   glow: drop-shadow(0 0 18px #f97316)   │
│                                          │
│   [CENTER TEXT — inside donut]           │
│     "6%"  font-size: 72px, bold          │
│     color: #f97316, glow matching        │
│     "khai thác   " font-size: 18px      │
│     "giá trị lớn" color: #fff opacity.8 │
│                                          │
│  [STAT ROW — below donut]                │  top: ~62%
│   "94% có công cụ & ngân sách"          │
│   " — không ra kết quả"                 │
│   "không ra kết quả" → color: #f97316   │
│   font-size: 22px, text-align: center   │
│                                          │
│  [HIGHLIGHT PILL — below stat]           │  top: ~72%
│   Rounded rect, border: #f97316         │
│   bg: rgba(249,115,22,0.12)             │
│   "Khoảng trống đó = " + "VIỆC LÀM"    │
│   "VIỆC LÀM" color: #f97316 bold        │
│   padding: 14px 28px, radius: 12px      │
│                                          │
│  [SUBTITLE CARD — bottom]               │  bottom: ~10%
│   Glass card, full-width near bottom    │
│   bg: rgba(255,255,255,0.06)            │
│   border: rgba(255,255,255,0.12)        │
│   "Chỉ ~6% tổ chức khai thác được..."  │
│   font-size: 20px, padding: 18px 24px  │
│                                          │
└──────────────────────────────────────────┘
```

### Animation Spec (Remotion)

| Element | Animation | Timing |
|---|---|---|
| Title | `spring` fade+translateY từ +40px → 0 | frame 0–18 |
| Donut track | xuất hiện ngay (opacity 0→1) | frame 6–18 |
| Donut fill arc | `spring` strokeDashoffset từ circumference → `(1 - 0.06) * circumference` | frame 18–60 |
| Center counter "6" | `interpolate(spring, [0,1], [0, 6])` đếm lên | frame 18–60 |
| Stat row | `spring` translateY từ +30px, delay | frame 50–70 |
| Highlight pill | `spring` scale 0.8→1, delay | frame 65–80 |
| Subtitle card | `spring` translateY từ +40px, delay | frame 75–90 |

### Code Pattern (SVG Donut)

```tsx
// Donut Gauge SVG pattern
const r = 110; // radius
const circ = 2 * Math.PI * r;
const pct = 0.06; // 6%
const offset = circ * (1 - pct); // animated từ circ → offset

<svg width="280" height="280" style={{ filter: "drop-shadow(0 0 18px #f97316)" }}>
  {/* Track */}
  <circle cx="140" cy="140" r={r}
    fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" />
  {/* Fill arc */}
  <circle cx="140" cy="140" r={r}
    fill="none" stroke="#f97316" strokeWidth="16"
    strokeDasharray={circ} strokeDashoffset={animatedOffset}
    strokeLinecap="round"
    transform="rotate(-90 140 140)" />
</svg>
```

---

## Ảnh Mẫu 2 — Pattern: `DUAL_METRIC_CARDS` (Phân Cảnh 2 Số Liệu)

**Ảnh tham chiếu:** Phân cảnh "AI giờ là mặc định — 900tr | 88%"

### Cấu Trúc Layout

```
┌──────────────────────────────────────────┐  1080 × 1920
│                                          │
│                                          │  [khoảng trống trên ~30%]
│                                          │
│  [TITLE ZONE — center, 2 dòng]          │  top: ~32%
│   "AI giờ là " + "mặc định"            │
│   "mặc định" → italic + accent blue     │
│   font-size: ~52px, weight: 700         │
│   text-align: center                    │
│                                          │
│  [METRIC CARDS ROW — 2 cột ngang]       │  top: ~48%
│  ┌────────────┐  ┌────────────┐         │
│  │ 900tr      │  │ 88%        │         │
│  │ font: 72px │  │ font: 72px │         │
│  │ color:     │  │ color:     │         │
│  │ #60a5fa    │  │ #60a5fa    │         │
│  │ suffix     │  │ suffix:    │         │
│  │ "tr" 28px  │  │ "%" 28px  │         │
│  ├────────────┤  ├────────────┤         │
│  │người dùng  │  │doanh nghiệp│         │
│  │ChatGPT mỗi │  │đã dùng AI  │         │
│  │tuần        │  │            │         │
│  │font: 18px  │  │font: 18px  │         │
│  │color: .65  │  │color: .65  │         │
│  └────────────┘  └────────────┘         │
│   card: bg rgba(8,17,37,0.8)           │
│   border: rgba(59,130,246,0.3)         │
│   radius: 20px, padding: 24px 20px     │
│   gap giữa 2 card: 16px               │
│                                          │
│  [INFRASTRUCTURE PILL — 1 dòng]         │  top: ~68%
│   "⚡ điện · 🌐 internet · AI là hạ tầng mới"
│   bg: rgba(255,255,255,0.06)           │
│   border: rgba(255,255,255,0.15)       │
│   font-size: 18px, padding: 12px 20px  │
│   radius: 999px (pill đầy đủ)          │
│                                          │
│                                          │  [khoảng trống giữa ~25%]
│                                          │
│  [SUBTITLE CARD — bottom]               │  bottom: ~10%
│   "Vài con số: AI không còn là tương lai"
│   glass card full-width, giống mẫu 1   │
│                                          │
└──────────────────────────────────────────┘
```

### Animation Spec (Remotion)

| Element | Animation | Timing |
|---|---|---|
| Title | `spring` fade+translateY +40→0 | frame 0–18 |
| Card 1 | `spring` translateY +80→0 | frame 14–40 |
| Card 2 | `spring` translateY +80→0, delay +6 | frame 20–46 |
| Counter "900" | `interpolate(spring, [0,1], [0, 900])` | frame 18–70 |
| Counter "88" | `interpolate(spring, [0,1], [0, 88])` | frame 24–70 |
| Infra pill | `spring` opacity+translateY, delay | frame 60–80 |
| Subtitle card | `spring` translateY +40→0, delay | frame 72–90 |

### Number Formatting

```ts
// 900tr → hiển thị: "900" + suffix "tr"
// Không format thêm comma cho số này
// 88 → hiển thị "88" + suffix "%"
// 2590 → hiển thị "2.590" (dấu chấm kiểu Việt Nam)
const formatNumber = (val: number, useVietnameseDot = false) => {
  if (useVietnameseDot) return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return Math.round(val).toString();
};
```

---

## Ảnh Mẫu 3 — Pattern: `HERO_METRIC_GLOW` (Phân Cảnh 1 Số Liệu Khổng Lồ)

**Ảnh tham chiếu:** Phân cảnh "$2.590 TỶ ĐÔ — CHI TIÊU AI TOÀN CẦU 2026"

### Cấu Trúc Layout

```
┌──────────────────────────────────────────┐  1080 × 1920
│                                          │
│                                          │  [khoảng trống trên ~30%]
│                                          │
│  [EYEBROW LABEL — nhỏ trên số]          │  top: ~30%
│   "CHI TIÊU AI TOÀN CẦU · 2026"        │
│   font-size: 15px, weight: 600          │
│   letter-spacing: 0.2em (tracking rộng)│
│   color: rgba(255,255,255,0.5)          │
│   text-align: center, UPPERCASE         │
│                                          │
│  [HERO NUMBER ZONE — chiếm nhiều nhất] │  top: ~35%–52%
│  ┌──────────────────────────────────┐   │
│  │  prefix "$"  │  "2.590"  │ suffix│   │
│  │  font: 52px  │  font:    │ "TỶ ĐÔ"│ │
│  │  weight:600  │  ~120px   │ 40px  │   │
│  │  color: #93c5fd│ bold   │ 600   │   │
│  │  align: top  │  color:   │ color:│   │
│  │              │  #93c5fd  │ #fff  │   │
│  └──────────────────────────────────┘   │
│   Toàn bộ zone: text-shadow glow        │
│   text-shadow: 0 0 40px rgba(96,165,250,0.6)
│   display: flex, alignItems: baseline   │
│                                          │
│  [SUBTITLE LINE — ngay dưới số]         │  top: ~54%
│   "Lớn hơn GDP của phần lớn quốc gia"  │
│   "trên thế giới"                       │
│   font-size: 20px, color: .65          │
│   text-align: center                   │
│                                          │
│  [ALERT PILL — 1 dòng highlight]        │  top: ~62%
│   "Nhưng số tiền đó đang " + "KẸT"    │
│   "KẸT" → color: #f97316, font-weight: 900
│   border: rgba(255,255,255,0.2)        │
│   bg: rgba(255,255,255,0.06)           │
│   radius: 12px, padding: 14px 28px     │
│                                          │
│                                          │  [khoảng trống ~20%]
│                                          │
│  [SUBTITLE CARD — bottom]               │  bottom: ~10%
│   "Lớn hơn GDP của phần lớn quốc gia" │
│   glass card giống mẫu 1 & 2           │
│                                          │
└──────────────────────────────────────────┘
```

### Animation Spec (Remotion)

| Element | Animation | Timing |
|---|---|---|
| Eyebrow label | `spring` fade+translateY +20→0 | frame 0–15 |
| Hero prefix "$" | `spring` translateX -20→0 | frame 12–30 |
| Hero counter | `spring` đếm từ 0→2590 | frame 12–70 |
| Hero suffix "TỶ ĐÔ" | `spring` translateX +20→0 | frame 12–30 |
| Glow pulse | `Math.sin(frame/25) * 0.3 + 0.7` opacity oscillation | liên tục |
| Subtitle line | `spring` translateY +30→0, delay | frame 55–72 |
| Alert pill | `spring` scale 0.85→1, delay | frame 68–85 |
| Subtitle card | `spring` translateY +40→0, delay | frame 78–95 |

### Highlight Word Pattern

```tsx
// Tô màu từ khóa trong câu
const renderHighlighted = (text: string, words: string[], color: string) => {
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'g'));
  return parts.map((part, i) =>
    words.includes(part)
      ? <span key={i} style={{ color, fontWeight: 900 }}>{part}</span>
      : <span key={i}>{part}</span>
  );
};
// Ví dụ: renderHighlighted("KẸT", ["KẸT"], "#f97316")
```

---

## Universal Components (Tái Sử Dụng Ở Cả 3 Pattern)

### 1. Subtitle Line (Bottom Transparent Subtitle - Displayed 1 Line At A Time)

```tsx
// Position: absolute, bottom: 8%, left: 5%, right: 5%, zIndex: 5
// bg:        transparent
// text-shadow: 0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.95)

// Implement Sentence-by-Sentence Karaoke Highlight dynamically:
const config = useVideoConfig();
const durationInFrames = config.durationInFrames;

// 1. Group words into lines/sentences (split by punctuation . ? ! , : OR max 7 words)
const lines = React.useMemo(() => {
  const words = subtitlesJson || [];
  if (words.length === 0) {
    // Fallback: split raw voiceover text linearly
    const rawWords = (scene.voiceover || "").split(" ").filter(Boolean);
    const res = [];
    let currentLine = [];
    rawWords.forEach((word) => {
      currentLine.push({ word });
      if (/[.?!,:]$/.test(word.trim()) || currentLine.length >= 7) {
        res.push(currentLine);
        currentLine = [];
      }
    });
    if (currentLine.length > 0) res.push(currentLine);
    return res;
  }
  const res = [];
  let currentLine = [];
  words.forEach((w) => {
    currentLine.push(w);
    if (/[.?!,:]$/.test((w.word || "").trim()) || currentLine.length >= 7) {
      res.push(currentLine);
      currentLine = [];
    }
  });
  if (currentLine.length > 0) res.push(currentLine);
  return res;
}, [subtitlesJson]);

// 2. Find active line index based on frame/time
const currentSeconds = frame / fps;
const activeLineIdx = React.useMemo(() => {
  if (lines.length === 0) return 0;
  if (subtitlesJson && subtitlesJson.length > 0) {
    const idx = lines.findIndex((line) => {
      const start = line[0].start || 0;
      const end = line[line.length - 1].end || 0;
      return currentSeconds >= start && currentSeconds < end;
    });
    if (idx !== -1) return idx;
    for (let i = lines.length - 1; i >= 0; i--) {
      const start = lines[i][0].start || 0;
      if (currentSeconds >= start) return i;
    }
    return 0;
  }
  const speakingFrames = Math.max(30, durationInFrames - 30);
  const framesPerLine = speakingFrames / lines.length;
  return Math.min(lines.length - 1, Math.floor(Math.max(0, frame - 15) / framesPerLine));
}, [lines, currentSeconds, frame, fps]);

const activeLine = lines[activeLineIdx] || [];

return (
  <div style={{
    position: "absolute", bottom: "8%", left: "5%", right: "5%",
    background: "transparent",
    textAlign: "center", fontSize: "36px", lineHeight: 1.5, zIndex: 5
  }}>
    {activeLine.map((w, i) => {
      // Check if word is active
      const isWordActive = w.start ? (currentSeconds >= w.start && currentSeconds <= w.end) : true;
      return (
        <span
          key={i}
          style={{
            color: isWordActive ? THEME.orange : "rgba(255, 255, 255, 0.4)",
            transform: `scale(${isWordActive ? 1.05 : 1.0})`,
            transition: "all 0.1s ease",
            display: "inline-block",
            marginRight: "10px",
            fontWeight: isWordActive ? 800 : 500,
            textShadow: "0 2px 8px rgba(0,0,0,0.95)"
          }}
        >
          {w.word}
        </span>
      );
    })}
  </div>
);
```

### 2. AnimatedCounter Pattern

```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const progress = spring({ frame: Math.max(0, frame - delay), fps,
  config: { damping: 14, stiffness: 55, mass: 1.1 } });
const value = interpolate(progress, [0, 1], [0, target], { extrapolateRight: "clamp" });
const display = useViDot
  ? Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  : Math.round(value).toString();
```

### 3. Background Pattern

```
Nền: #030712 solid (không có grid pattern nếu không chắc)
Tùy chọn: radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)
→ tạo halo xanh nhẹ từ đỉnh màn hình xuống
```

---

## Quy Tắc Tổng Quát Cho AI (MANDATORY GENERAL RULES)

1. **Màu sắc**: Chỉ dùng từ `ai_hub_grid` tokens + orange `#f97316` + cyan `#60a5fa`/`#93c5fd`. Không tự đặt màu khác.
2. **Font**: `"Be Vietnam Pro", sans-serif` cho toàn bộ.
3. **Background**: `#030712`, không dùng màu nền khác.
4. **Animation & Drift (Khung hình chuyển động liên tục)**:
   - Dùng Remotion `spring()` + `interpolate()`. Không dùng CSS transition hay keyframe thông thường.
   - Luôn áp dụng hiệu ứng camera zoom/pan nhẹ ở nền: `transform: scale(zoom) rotate(rotateDeg)` với zoom tăng dần từ `1.0` đến `1.08`.
5. **Glassmorphism & Shimmer (Hiệu ứng ánh sáng quét)**:
   - Tất cả các thẻ card phải có viền thủy tinh phản quang, bo góc và bóng đổ.
   - Thêm hiệu ứng shimmer lướt qua (glass sweep) bằng cách nội suy `backgroundPosition` từ `-150%` đến `150%` với linear-gradient mờ đè lên card.
6. **Chữ Xuất Hiện Từng Từ (Word-by-Word Animation)**:
   - Chia câu heading bằng `.split(" ")` và ánh xạ qua các từ. Áp dụng hiệu ứng `translateY` và `rotate` trễ dần (`wordIndex * 6` frames) cho mỗi từ để tạo cảm giác xuất hiện cực kỳ mượt mà.
7. **Thành phần phụ (Sub-badges) & Khung Code Terminal**:
   - Cấm tuyệt đối việc định vị absolute các thẻ sub-badges (capsules như `[★ 25K sao]`, `[MIT]`, `[Anti-Slop]`) nằm sang hai bên tiêu đề, gây ra hiện tượng đè chữ khi tiêu đề xuống dòng hoặc bị cắt ở biên. Toàn bộ tiêu đề chính và badges phải nằm trong một Flexbox dọc (`display: "flex", flexDirection: "column", alignItems: "center"`). Các badges phải xếp hàng ngang (`display: "flex", flexDirection: "row", gap: "8px"`) trực tiếp phía TRÊN hoặc DƯỚI tiêu đề.
   - Nếu kịch bản nhắc đến code, dòng lệnh, CLI hoặc Git Repo, bắt buộc vẽ thêm một khung **Terminal giả lập** màu tối có 3 nút tròn đỏ, vàng, xanh và chữ hiển thị dòng lệnh nhập dần.
     * **CẤM LẠM DỤNG (DO NOT ABUSE)**: Chỉ vẽ khung Terminal khi kịch bản đề cập trực tiếp đến các từ khóa kỹ thuật rõ ràng: `npm`, `npx`, `git`, `docker`, `github`, `repository`, `code`, `terminal`, `command line`, `api`, `database`, `developer`, `programming`, `cli`.
     * Tuyệt đối không tự ý vẽ khung code cho các phân cảnh sử dụng từ ngữ mang tính ẩn dụ, ví von (ví dụ: "chạy hệ thống", "sửa máy", "vận hành", "bấm nút").
8. **Phân bổ Layout theo nội dung**:
   - Câu chứa `%` đơn lẻ → `DONUT_GAUGE`
   - Câu chứa 2+ số liệu so sánh → `DUAL_METRIC_CARDS`
   - Câu chứa 1 số liệu rất lớn (tỷ, triệu, nghìn) → `HERO_METRIC_GLOW`
   - Câu mở đầu / hook → title + body text đơn giản (TITLE_HOOK)
   - Câu danh sách → bullet points glass cards (BULLET_GLASS)
   - Câu kết thúc → Outro có nút bấm kêu gọi hành động (ENDING_CTA)

9. **Cấm tuyệt đối chồng lấn và căn giữa dọc nội dung (No Overlaps & Vertical Centering)**:
   - Mọi phần tử giao diện (chữ, bảng, card, terminal, donut gauge) phải có vị trí bố cục riêng biệt, không được đè lên nhau. Không dùng absolute positioning tùy tiện gây va chạm phần tử.
   - Toàn bộ container hiển thị chính phải cách lề trái/phải tối thiểu 80px để đảm bảo an toàn tuyệt đối.
   - **Bắt buộc căn dọc giữa màn hình (Vertical Centering)**: Bọc toàn bộ các thành phần hiển thị chính (badge, title, cards, terminal, gauge) vào một container Flexbox cột dọc có:
     `display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", paddingBottom: "18%", boxSizing: "border-box", zIndex: 10`
     Điều này giúp kéo nội dung xuống giữa màn hình dọc 9:16, tránh dồn lên trên cùng, đồng thời chừa lại 18% chiều cao ở đáy cho phụ đề.
   - **Khoảng giãn cách đều (Proportional Spacing Gaps)**: Sử dụng thuộc tính `gap` có giá trị từ `40px` đến `60px` cho container Flexbox này để các thành phần phân bố đều đặn và thoáng đãng theo chiều dọc.

10. **Tham khảo thiết kế từ ảnh Reference (Layout-only Reference Image Adaptation)**:
    - Nếu người dùng tải lên ảnh thiết kế tham khảo, AI bắt buộc phải phân tích cấu trúc bố cục của ảnh đó: cách sắp xếp các phần tử, kích thước và lề bo cong (`borderRadius`), khoảng cách giãn cách (`gap` và `padding`), độ đổ bóng (`boxShadow`), lề căn chỉnh (trái/phải/giữa).
    - **CẤM CHÉP MÀU (PRESERVE THEME COLORS)**: Tuyệt đối không chép hệ màu (palette) hoặc gradient nền từ ảnh mẫu. Toàn bộ màu sắc và hình nền bắt buộc phải dùng các biến màu của `THEME` đang chọn (ví dụ: `THEME.bg`, `THEME.accent`, `THEME.orange`, `THEME.cyan`) để giữ vững nhận diện thương hiệu của video.

