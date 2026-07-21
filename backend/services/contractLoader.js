const fs = require('fs');
const path = require('path');

/**
 * Master Layout Contracts Registry
 * Defines exact visual & character constraints for all 39 active layouts.
 */
const LAYOUT_CONTRACTS = {
  // =========================================================================
  // 1. OPENING / HEADLINE FAMILY (26 Layouts)
  // =========================================================================
  AppCardConcept: {
    layoutId: 'AppCardConcept',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Mô phỏng ứng dụng mobile với 2-3 tính năng nổi bật.'
  },
  AppShowcaseTitle: {
    layoutId: 'AppShowcaseTitle',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 1, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Tiêu đề giới thiệu ứng dụng kèm thẻ thông số ngắn.'
  },
  BeforeAfterPanel: {
    layoutId: 'BeforeAfterPanel',
    family: 'Opening / Headline',
    headingMaxChars: 35,
    pointsCount: { min: 2, max: 2, default: 2 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'So sánh Trước (Before) và Sau (After). Point 1 là Trước, Point 2 là Sau.'
  },
  BroadcastLowerThirdTitle: {
    layoutId: 'BroadcastLowerThirdTitle',
    family: 'Opening / Headline',
    headingMaxChars: 40,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 50,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Khung tin tức truyền hình dạng Lower Third nổi bật.'
  },
  CandlestickBreakoutHook: {
    layoutId: 'CandlestickBreakoutHook',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['card', 'metric'],
    aiHint: 'Màn hình hook phong cách biểu đồ tài chính bứt phá.'
  },
  CaseStudyEditorial: {
    layoutId: 'CaseStudyEditorial',
    family: 'Opening / Headline',
    headingMaxChars: 42,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 55,
    allowedPointTypes: ['card'],
    aiHint: 'Phong cách tạp chí biên tập báo chí, 2-3 điểm phân tích.'
  },
  DossierNotes: {
    layoutId: 'DossierNotes',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Ghi chú hồ sơ tài liệu chuyên án / nghiên cứu.'
  },
  EarningsSnapshotHook: {
    layoutId: 'EarningsSnapshotHook',
    family: 'Opening / Headline',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 3, default: 2 },
    pointMaxChars: 35,
    allowedPointTypes: ['metric', 'card'],
    aiHint: 'Báo cáo doanh thu / kết quả tài chính nổi bật.'
  },
  EvidenceBoardConcept: {
    layoutId: 'EvidenceBoardConcept',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Bảng chứng cứ kết nối các dữ kiện thông tin.'
  },
  FearGreedHook: {
    layoutId: 'FearGreedHook',
    family: 'Opening / Headline',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 2 },
    pointMaxChars: 40,
    allowedPointTypes: ['metric', 'card'],
    aiHint: 'Chỉ số tâm lý thị trường Sợ hãi / Tham lam.'
  },
  FeedScrollHook: {
    layoutId: 'FeedScrollHook',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Mô phỏng cuộn tin tức mạng xã hội.'
  },
  FlowchartTitle: {
    layoutId: 'FlowchartTitle',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 3 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Sơ đồ luồng quy trình mở đầu.'
  },
  IntroBriefingCard: {
    layoutId: 'IntroBriefingCard',
    family: 'Opening / Headline',
    headingMaxChars: 40,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Thẻ tóm tắt thông tin quan trọng. Dùng 3 câu ngắn gọn đại diện cho ý chính.'
  },
  IntroBubbleImage: {
    layoutId: 'IntroBubbleImage',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Hình ảnh dạng bong bóng và các điểm chính xung quanh.'
  },
  IntroChapterStack: {
    layoutId: 'IntroChapterStack',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 3 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Xếp chồng các chương nội dung.'
  },
  IntroCutoutHeadlineImage: {
    layoutId: 'IntroCutoutHeadlineImage',
    family: 'Opening / Headline',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 50,
    allowedPointTypes: ['card'],
    aiHint: 'Tiêu đề cắt nổi bật trên nền ảnh.'
  },
  IntroEvidenceReadlineImage: {
    layoutId: 'IntroEvidenceReadlineImage',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 1, max: 2, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Dạng tia đọc dữ kiện ảnh minh họa.'
  },
  IntroEvidenceScanlineImage: {
    layoutId: 'IntroEvidenceScanlineImage',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 1, max: 2, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Dạng quét dữ liệu máy quét.'
  },
  IntroEvidenceTimelineImage: {
    layoutId: 'IntroEvidenceTimelineImage',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 3 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Dòng thời gian chứng cứ nổi bật trên ảnh nền.'
  },
  IntroFullImage: {
    layoutId: 'IntroFullImage',
    family: 'Opening / Headline',
    headingMaxChars: 40,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 55,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Hình ảnh tràn toàn màn hình với tiêu đề ấn tượng.'
  },
  IntroMapPinsImage: {
    layoutId: 'IntroMapPinsImage',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Các ghim địa điểm trên bản đồ.'
  },
  IntroMetricPillImage: {
    layoutId: 'IntroMetricPillImage',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 1, max: 3, default: 2 },
    pointMaxChars: 35,
    allowedPointTypes: ['metric', 'card'],
    aiHint: 'Chỉ số dạng viên thuốc nổi trên ảnh.'
  },
  IntroRadarSignalImage: {
    layoutId: 'IntroRadarSignalImage',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 1, max: 2, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Tín hiệu rada quét phát hiện thông tin.'
  },
  IntroSignalStepsImages: {
    layoutId: 'IntroSignalStepsImages',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 3 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Các bước tín hiệu liên tiếp.'
  },
  MapPinsHook: {
    layoutId: 'MapPinsHook',
    family: 'Opening / Headline',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 40,
    allowedPointTypes: ['card'],
    aiHint: 'Màn hình hook vị trí địa lý.'
  },
  OpsMonitorHook: {
    layoutId: 'OpsMonitorHook',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 2 },
    pointMaxChars: 45,
    allowedPointTypes: ['card', 'terminal'],
    aiHint: 'Màn hình giám sát vận hành hệ thống.'
  },

  // =========================================================================
  // 2. LIST / STEPS FAMILY (4 Active Layouts)
  // =========================================================================
  AIHubGrid1: {
    layoutId: 'AIHubGrid1',
    family: 'List / Steps',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['card'],
    aiHint: 'Lưới thông tin AI Hub chuẩn phong cách Rikkei/AI. 3-4 ý chính.'
  },
  RankedImpactBullet: {
    layoutId: 'RankedImpactBullet',
    family: 'List / Steps',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 3, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['card'],
    aiHint: 'Danh sách 3 điểm xếp hạng tác động từ cao xuống thấp.'
  },
  SelectorWheelRadio: {
    layoutId: 'SelectorWheelRadio',
    family: 'List / Steps',
    headingMaxChars: 36,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Vòng quay chọn phương án / danh sách tùy chọn.'
  },
  SignalRailBullet: {
    layoutId: 'SignalRailBullet',
    family: 'List / Steps',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 45,
    allowedPointTypes: ['card'],
    aiHint: 'Thanh ray tín hiệu chạy dọc các điểm chính.'
  },

  // =========================================================================
  // 3. ENDING FAMILY (9 Active Layouts)
  // =========================================================================
  BottomAnchorOutro: {
    layoutId: 'BottomAnchorOutro',
    family: 'Ending',
    headingMaxChars: 36,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 45,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Màn hình kết thúc neo phía dưới màn hình.'
  },
  BrandOutro: {
    layoutId: 'BrandOutro',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Outro quảng bá thương hiệu.'
  },
  CenterLineOutro: {
    layoutId: 'CenterLineOutro',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Outro căn giữa đường kẻ định vị.'
  },
  HustXRikkei: {
    layoutId: 'HustXRikkei',
    family: 'Ending',
    headingMaxChars: 40,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 45,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Màn hình hợp tác HUST x Rikkei Education.'
  },
  ContactCardEnding: {
    layoutId: 'ContactCardEnding',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 45,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Thẻ thông tin liên hệ / Đăng ký khóa học.'
  },
  Ending: {
    layoutId: 'Ending',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Màn hình kết thúc / Kêu gọi hành động (CTA).'
  },
  Launch: {
    layoutId: 'Launch',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Màn hình ra mắt / Kích hoạt sản phẩm.'
  },
  Minimal: {
    layoutId: 'Minimal',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Outro tối giản gọn gàng.'
  },
  NextStepEnding: {
    layoutId: 'NextStepEnding',
    family: 'Ending',
    headingMaxChars: 36,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 45,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Hướng dẫn bước tiếp theo dành cho người xem.'
  }
};

// Generic family fallback contracts
const FAMILY_FALLBACKS = {
  opening: {
    layoutId: 'IntroBriefingCard',
    family: 'Opening / Headline',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Màn hình mở đầu hook người xem.'
  },
  list: {
    layoutId: 'AIHubGrid1',
    family: 'List / Steps',
    headingMaxChars: 38,
    pointsCount: { min: 2, max: 4, default: 3 },
    pointMaxChars: 50,
    allowedPointTypes: ['card', 'badge_row'],
    aiHint: 'Danh sách các ý chính hoặc tính năng.'
  },
  ending: {
    layoutId: 'Ending',
    family: 'Ending',
    headingMaxChars: 35,
    pointsCount: { min: 1, max: 2, default: 1 },
    pointMaxChars: 40,
    allowedPointTypes: ['button', 'card'],
    aiHint: 'Màn hình kết thúc.'
  }
};

function getContractForLayout(layoutId, family = 'opening') {
  if (layoutId && LAYOUT_CONTRACTS[layoutId]) {
    return LAYOUT_CONTRACTS[layoutId];
  }
  const cleanFamily = (family || 'opening').toLowerCase();
  return FAMILY_FALLBACKS[cleanFamily] || FAMILY_FALLBACKS.opening;
}

function validateAndFormatSceneContent(scene, contract) {
  const warnings = [];
  const maxHeadingChars = contract.headingMaxChars || 40;
  const maxPointChars = contract.pointMaxChars || 50;

  // 1. Heading Validation & Trimming
  if (scene.heading && scene.heading.length > maxHeadingChars) {
    console.warn(`[Contract Validator] Trimming heading for layout "${contract.layoutId}": "${scene.heading}" -> max ${maxHeadingChars} chars`);
    scene.heading = scene.heading.substring(0, maxHeadingChars).trim();
    warnings.push('heading_trimmed');
  }

  // 2. Points Cleaning & Deduplication & Validation
  if (!Array.isArray(scene.points)) {
    scene.points = [];
  }

  const defaultPointType = (contract.allowedPointTypes && contract.allowedPointTypes[0]) || 'card';

  // Filter out invalid, empty, or default placeholder points
  let cleanPoints = scene.points.filter((pt) => {
    if (!pt || typeof pt.text !== 'string') return false;
    const txt = pt.text.trim();
    if (!txt || txt === 'Nội dung hiển thị...' || txt === 'Point text...' || txt === 'Mô tả ngắn...') return false;
    return true;
  });

  // Deduplicate points with identical text
  const seenTexts = new Set();
  cleanPoints = cleanPoints.filter((pt) => {
    const key = pt.text.trim().toLowerCase();
    if (seenTexts.has(key)) return false;
    seenTexts.add(key);
    return true;
  });

  // Target points count based on contract min/default
  const minRequired = contract.pointsCount?.min || 1;
  const maxAllowed = contract.pointsCount?.max || 4;

  // Truncate if exceeding max
  if (cleanPoints.length > maxAllowed) {
    console.warn(`[Contract Validator] Reducing points count for layout "${contract.layoutId}": ${cleanPoints.length} -> max ${maxAllowed}`);
    cleanPoints = cleanPoints.slice(0, maxAllowed);
    warnings.push('points_truncated');
  }

  // Backfill if below minRequired
  if (cleanPoints.length < minRequired) {
    console.warn(`[Contract Validator] Auto-backfilling points for layout "${contract.layoutId}": current ${cleanPoints.length} < min ${minRequired}`);
    warnings.push('points_backfilled');

    // Extract potential sentences or phrases from voiceover
    const voiceover = scene.voiceover || '';
    const clauses = voiceover
      .split(/[\.,;\!\?\n]+/)
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false;
        const words = s.split(/\s+/).length;
        return words >= 2 && s.length <= maxPointChars && !seenTexts.has(s.toLowerCase());
      });

    while (cleanPoints.length < minRequired && clauses.length > 0) {
      const text = clauses.shift();
      seenTexts.add(text.toLowerCase());
      cleanPoints.push({
        type: defaultPointType,
        text: text.substring(0, maxPointChars).trim(),
        animation: 'slide-up'
      });
    }

    // Fallback if voiceover clauses run out
    while (cleanPoints.length < minRequired) {
      const idx = cleanPoints.length + 1;
      const text = scene.heading ? `${scene.heading} (${idx})` : `Ý chính ${idx}`;
      cleanPoints.push({
        type: defaultPointType,
        text: text.substring(0, maxPointChars).trim(),
        animation: 'slide-up'
      });
    }
  }

  // Semantic Layout Auto-Correction (e.g. Comparison scenes mis-assigned to single app card)
  const fullText = ((scene.heading || '') + ' ' + (scene.voiceover || '')).toLowerCase();
  const isComparisonText = fullText.includes('không phải là') || fullText.includes('so với') || fullText.includes('khác biệt') || fullText.includes('versus') || fullText.includes(' so sánh ');
  if (isComparisonText && (contract.layoutId === 'AppCardConcept' || contract.layoutId === 'IntroBriefingCard')) {
    console.warn(`[Contract Validator] Auto-correcting comparison scene layout: "${contract.layoutId}" -> "BeforeAfterPanel"`);
    scene.layoutId = 'BeforeAfterPanel';
    scene.visualLayout = 'BeforeAfterPanel';
    contract = LAYOUT_CONTRACTS['BeforeAfterPanel'] || contract;
    warnings.push('layout_auto_corrected');
  }

  // Trim texts and calculate delays (all elements appear within first 50% of scene duration)
  const sceneDuration = parseFloat(scene.duration) || 5.0;
  const maxLastDelay = Number((sceneDuration * 0.5).toFixed(1));
  const effectiveUsable = Math.max(0.4, maxLastDelay - 0.4);
  const step = cleanPoints.length > 1 ? effectiveUsable / (cleanPoints.length - 1) : 0;

  scene.points = cleanPoints.map((pt, idx) => {
    let text = (pt.text || '').trim();
    if (text.length > maxPointChars) {
      text = text.substring(0, maxPointChars).trim();
      warnings.push('point_text_trimmed');
    }

    const computedDelay = Number((0.4 + idx * step).toFixed(1));
    const rawDelay = pt.delay !== undefined ? pt.delay : computedDelay;
    const clampedDelay = Number(Math.min(rawDelay, maxLastDelay).toFixed(1));

    const updatedPoint = {
      ...pt,
      type: pt.type || defaultPointType,
      text: text,
      delay: clampedDelay,
      animation: pt.animation || 'slide-up'
    };

    if (updatedPoint.type === 'metric') {
      if (updatedPoint.value && updatedPoint.value.length > 15) updatedPoint.value = updatedPoint.value.substring(0, 15);
      if (updatedPoint.subtext && updatedPoint.subtext.length > 35) updatedPoint.subtext = updatedPoint.subtext.substring(0, 35);
    }

    return updatedPoint;
  });

  return { scene, warnings };
}

module.exports = {
  getContractForLayout,
  validateAndFormatSceneContent,
  LAYOUT_CONTRACTS
};
