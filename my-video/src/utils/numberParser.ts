export function parseNumbers(valueStr: unknown): { 
  prefix: string; 
  n1: number; 
  n2: number | null; 
  suffix: string;
  decimals1: number;
  decimals2: number | null;
} {
  const str = String(valueStr || "").trim();
  if (!str) return { prefix: "", n1: 0, n2: null, suffix: "", decimals1: 0, decimals2: null };

  const normalizeNumericString = (numStr: string): { val: number; decimals: number } => {
    if (!numStr) return { val: 0, decimals: 0 };

    // If contains both comma and dot (e.g. 1,234.56 or 1.234,56)
    if (numStr.includes(",") && numStr.includes(".")) {
      const firstComma = numStr.indexOf(",");
      const firstDot = numStr.indexOf(".");
      if (firstComma < firstDot) {
        // English format (comma thousands, dot decimal)
        const decStr = numStr.split(".")[1] || "";
        return { val: parseFloat(numStr.replace(/,/g, "")), decimals: decStr.length };
      } else {
        // Vietnamese format (dot thousands, comma decimal)
        const decStr = numStr.split(",")[1] || "";
        return { val: parseFloat(numStr.replace(/\./g, "").replace(/,/g, ".")), decimals: decStr.length };
      }
    }

    // Only comma
    if (numStr.includes(",")) {
      const parts = numStr.split(",");
      if (parts[parts.length - 1].length === 3 && parts.length > 1 && parts[0].length <= 3) {
        return { val: parseFloat(numStr.replace(/,/g, "")), decimals: 0 };
      } else {
        const decStr = parts[parts.length - 1] || "";
        return { val: parseFloat(numStr.replace(/,/g, ".")), decimals: decStr.length };
      }
    }

    // Only dot
    if (numStr.includes(".")) {
      const parts = numStr.split(".");
      if (parts[parts.length - 1].length === 3 && parts.length > 2) {
        return { val: parseFloat(numStr.replace(/\./g, "")), decimals: 0 };
      } else {
        const decStr = parts[parts.length - 1] || "";
        return { val: parseFloat(numStr), decimals: decStr.length };
      }
    }

    return { val: parseFloat(numStr), decimals: 0 };
  };

  // Improved range regex to support multi-separated digits
  const rangeRegex = /(\d+(?:[.,]\d+)*)\s*(?:-|đến|to)\s*(\d+(?:[.,]\d+)*)/i;
  const match = str.match(rangeRegex);

  if (match) {
    const r1 = normalizeNumericString(match[1]);
    const r2 = normalizeNumericString(match[2]);
    const matchIndex = str.indexOf(match[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + match[0].length).trim();
    return {
      prefix,
      n1: isNaN(r1.val) ? 0 : r1.val,
      n2: isNaN(r2.val) ? 0 : r2.val,
      suffix,
      decimals1: isNaN(r1.val) ? 0 : r1.decimals,
      decimals2: isNaN(r2.val) ? 0 : r2.decimals
    };
  }

  // Improved single number regex to support multi-separated digits
  const singleRegex = /(\d+(?:[.,]\d+)*)/;
  const singleMatch = str.match(singleRegex);
  if (singleMatch) {
    const r = normalizeNumericString(singleMatch[1]);
    const matchIndex = str.indexOf(singleMatch[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + singleMatch[0].length).trim();
    return {
      prefix,
      n1: isNaN(r.val) ? 0 : r.val,
      n2: null,
      suffix,
      decimals1: isNaN(r.val) ? 0 : r.decimals,
      decimals2: null
    };
  }

  return { prefix: "", n1: 0, n2: null, suffix: str, decimals1: 0, decimals2: null };
}
