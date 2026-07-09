/**
 * Subtitle Timeline Optimizer
 * Converts raw Whisper Speech Timeline → optimized Visual Timeline
 *
 * Input:  [{word, start, end}, ...]          (from align.py)
 * Output: [{word, speechStart, speechEnd, displayStart, displayEnd,
 *           highlightStart, highlightPeak, highlightEnd}, ...]
 */

/**
 * Merge Whisper punctuation tokens into adjacent words.
 * Handles: "Hello", ",", "world" → "Hello,", "world"
 * Handles: "Node", ".", "js" → "Node.js"
 * Handles: "GPT", "-", "5", ".", "5" → "GPT-5.5"
 */
function mergePunctuation(words) {
  if (!words || words.length === 0) return words;

  const ATTACH_LEFT = /^[.,!?;:'"»)\]}/]$/;    // attach to left neighbour
  const ATTACH_RIGHT = /^['"«(\[{]$/;           // attach to right neighbour
  const CONNECTOR = /^[-_./@#&]$/;              // connector: merge left+right

  const merged = [];
  let i = 0;

  while (i < words.length) {
    const cur = words[i];

    // Connector token (-, _, .) — merge left + right into one token
    if (CONNECTOR.test(cur.word.trim()) && merged.length > 0 && i + 1 < words.length) {
      const left = merged.pop();
      const right = words[i + 1];
      merged.push({
        word: left.word + cur.word + right.word,
        start: left.start,
        end: right.end
      });
      i += 2;
      continue;
    }

    // Left-attach punctuation (comma, period, etc.)
    if (ATTACH_LEFT.test(cur.word.trim()) && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.word = prev.word + cur.word;
      prev.end = cur.end;
      i++;
      continue;
    }

    // Right-attach punctuation (opening bracket, quote)
    if (ATTACH_RIGHT.test(cur.word.trim()) && i + 1 < words.length) {
      const next = words[i + 1];
      merged.push({
        word: cur.word + next.word,
        start: cur.start,
        end: next.end
      });
      i += 2;
      continue;
    }

    merged.push({ ...cur });
    i++;
  }

  return merged;
}

/**
 * Calculate dynamic gap threshold based on average speaking speed.
 * Faster speakers → smaller threshold; slower speakers → larger threshold.
 */
function computeDynamicThreshold(words) {
  if (words.length === 0) return 0.35;
  const totalDuration = words.reduce((sum, w) => sum + Math.max(0, w.end - w.start), 0);
  const avgDuration = totalDuration / words.length;
  return Math.max(avgDuration * 1.2, 0.35);
}

/**
 * Three-tier gap policy:
 *   gap <= SHORT_FILL_THRESHOLD (~250ms)       → extend displayEnd to next word's speechStart
 *   SHORT_FILL_THRESHOLD < gap <= dynamicThreshold → extend displayEnd by max 250ms then hide
 *   gap > dynamicThreshold                     → hide immediately after speechEnd + 50ms
 */
const SHORT_FILL_THRESHOLD = 0.25; // 250ms absolute
const SOFT_EXTEND_MS = 0.25;       // 250ms maximum soft extension

function computeDisplayWindow(speechEnd, nextSpeechStart, dynamicThreshold) {
  const gap = nextSpeechStart - speechEnd;

  if (gap <= SHORT_FILL_THRESHOLD) {
    // Seamlessly extend to the next word
    return { displayEnd: nextSpeechStart, hidden: false };
  }

  if (gap <= dynamicThreshold) {
    // Soft extend then hide (YouTube-style)
    return { displayEnd: speechEnd + SOFT_EXTEND_MS, hidden: false };
  }

  // Long pause → hide shortly after speech ends
  return { displayEnd: speechEnd + 0.05, hidden: true };
}

/**
 * Main optimizer function.
 *
 * @param {Array<{word, start, end}>} rawWords  Output from align.py
 * @param {number} audioDuration                Total audio duration in seconds
 * @returns {Array<SubtitleWord>}               Optimized visual timeline
 */
function optimizeTimeline(rawWords, audioDuration) {
  if (!rawWords || rawWords.length === 0) return [];

  // Step 1: Merge punctuation tokens
  const words = mergePunctuation(rawWords);

  // Step 2: Compute dynamic threshold
  const dynamicThreshold = computeDynamicThreshold(words);

  // Step 3: Build visual timeline
  const result = [];

  for (let i = 0; i < words.length; i++) {
    const cur = words[i];
    const next = words[i + 1] ?? null;

    const speechStart = cur.start;
    const speechEnd = cur.end;

    // displayStart: enter slightly before speech for pre-highlight effect
    const displayStart = Math.max(0, speechStart - 0.04);

    // displayEnd: computed by gap policy
    let displayEnd;

    if (next !== null) {
      const { displayEnd: de } = computeDisplayWindow(speechEnd, next.start, dynamicThreshold);
      displayEnd = de;
    } else {
      // Last word: extend slightly until end of audio
      displayEnd = Math.min(speechEnd + 0.35, audioDuration);
    }

    // Animation metadata
    // highlightStart = when the word becomes "most visible" (at speech start)
    // highlightPeak  = peak of the highlight animation (~60ms into speaking)
    // highlightEnd   = fade-out begins (at displayEnd)
    const highlightStart = speechStart;
    const highlightPeak  = Math.min(speechStart + 0.06, speechEnd);
    const highlightEnd   = displayEnd;

    result.push({
      word: cur.word,
      speechStart: parseFloat(speechStart.toFixed(3)),
      speechEnd:   parseFloat(speechEnd.toFixed(3)),
      displayStart: parseFloat(displayStart.toFixed(3)),
      displayEnd:  parseFloat(Math.max(displayStart + 0.05, displayEnd).toFixed(3)),
      highlightStart: parseFloat(highlightStart.toFixed(3)),
      highlightPeak:  parseFloat(highlightPeak.toFixed(3)),
      highlightEnd:  parseFloat(highlightEnd.toFixed(3))
    });
  }

  return result;
}

module.exports = { optimizeTimeline };
