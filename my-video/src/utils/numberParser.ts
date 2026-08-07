export function parseNumbers(valueStr: unknown): { prefix: string; n1: number; n2: number | null; suffix: string } {
  const str = String(valueStr || "").trim();
  if (!str) return { prefix: "", n1: 0, n2: null, suffix: "" };

  const normalizeNumericString = (numStr: string): number => {
    // If contains both comma and dot (e.g. 1,234.56 or 1.234,56)
    if (numStr.includes(",") && numStr.includes(".")) {
      const firstComma = numStr.indexOf(",");
      const firstDot = numStr.indexOf(".");
      if (firstComma < firstDot) {
        // English format (comma thousands, dot decimal)
        return parseFloat(numStr.replace(/,/g, ""));
      } else {
        // Vietnamese format (dot thousands, comma decimal)
        return parseFloat(numStr.replace(/\./g, "").replace(/,/g, "."));
      }
    }

    // Only comma
    if (numStr.includes(",")) {
      const parts = numStr.split(",");
      if (parts[parts.length - 1].length === 3) {
        return parseFloat(numStr.replace(/,/g, ""));
      } else {
        return parseFloat(numStr.replace(/,/g, "."));
      }
    }

    // Only dot
    if (numStr.includes(".")) {
      const parts = numStr.split(".");
      if (parts[parts.length - 1].length === 3) {
        return parseFloat(numStr.replace(/\./g, ""));
      } else {
        return parseFloat(numStr);
      }
    }

    return parseFloat(numStr);
  };

  // Improved range regex to support multi-separated digits
  const rangeRegex = /(\d+(?:[.,]\d+)*)\s*(?:-|đến|to)\s*(\d+(?:[.,]\d+)*)/i;
  const match = str.match(rangeRegex);

  if (match) {
    const rawN1 = normalizeNumericString(match[1]);
    const rawN2 = normalizeNumericString(match[2]);
    const matchIndex = str.indexOf(match[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + match[0].length).trim();
    return {
      prefix,
      n1: isNaN(rawN1) ? 0 : rawN1,
      n2: isNaN(rawN2) ? 0 : rawN2,
      suffix
    };
  }

  // Improved single number regex to support multi-separated digits
  const singleRegex = /(\d+(?:[.,]\d+)*)/;
  const singleMatch = str.match(singleRegex);
  if (singleMatch) {
    const rawN = normalizeNumericString(singleMatch[1]);
    const matchIndex = str.indexOf(singleMatch[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + singleMatch[0].length).trim();
    return {
      prefix,
      n1: isNaN(rawN) ? 0 : rawN,
      n2: null,
      suffix
    };
  }

  return { prefix: "", n1: 0, n2: null, suffix: str };
}
