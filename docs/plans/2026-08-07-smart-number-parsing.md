# Smart Number Parsing for Metric Layouts Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a smart number parsing utility that correctly parses English and Vietnamese formats of single values and range numbers, and refactor layout modes to use it.

**Architecture:**
1. Extract parsing logic from `MetricShowcaseHookMode.tsx` and `MetricFocusShowcaseMode.tsx` into a central `my-video/src/utils/numberParser.ts` utility file.
2. Upgrade the parser to handle commas and dots heuristically (checking if a comma/dot is followed by exactly 3 digits to identify thousands separator vs decimal separator).
3. Update regexes to support multi-digit commas (e.g. `58,000,000`).
4. Replace the inline parsers with the central utility and verify correctness.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Create shared numberParser utility

**Files:**
- Create: `my-video/src/utils/numberParser.ts`
- Test: `my-video/scratch_test_number_parser.ts`

**Step 1: Write the failing test / test suite**
Create `my-video/scratch_test_number_parser.ts` with test cases:
```typescript
import { parseNumbers } from './src/utils/numberParser';

const runTests = () => {
  const cases = [
    { input: "58,000$", expected: { prefix: "", n1: 58000, n2: null, suffix: "$" } },
    { input: "85,000 đô", expected: { prefix: "", n1: 85000, n2: null, suffix: "đô" } },
    { input: "58.000$", expected: { prefix: "", n1: 58000, n2: null, suffix: "$" } },
    { input: "12,5 triệu", expected: { prefix: "", n1: 12.5, n2: null, suffix: "triệu" } },
    { input: "12.5 triệu", expected: { prefix: "", n1: 12.5, n2: null, suffix: "triệu" } },
    { input: "15.000 - 20.000 usd", expected: { prefix: "", n1: 15000, n2: 20000, suffix: "usd" } },
    { input: "15,000 - 20,000 usd", expected: { prefix: "", n1: 15000, n2: 20000, suffix: "usd" } },
    { input: "15 - 20 triệu", expected: { prefix: "", n1: 15, n2: 20, suffix: "triệu" } }
  ];

  let failed = false;
  for (const c of cases) {
    const res = parseNumbers(c.input);
    const match = res.prefix === c.expected.prefix &&
                  res.n1 === c.expected.n1 &&
                  res.n2 === c.expected.n2 &&
                  res.suffix === c.expected.suffix;
    if (!match) {
      console.error(`❌ Test failed for: "${c.input}". Expected:`, c.expected, `Got:`, res);
      failed = true;
    } else {
      console.log(`✅ Test passed for: "${c.input}" -> n1: ${res.n1}, n2: ${res.n2}, suffix: "${res.suffix}"`);
    }
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log("🎉 All tests passed successfully!");
  }
};

runTests();
```

**Step 2: Run test to verify it fails**
Run: `npx tsx scratch_test_number_parser.ts` (Note: Run from `my-video` folder or workspace root as appropriate)
Expected: FAIL since `numberParser.ts` does not exist yet.

**Step 3: Write minimal implementation**
Create `my-video/src/utils/numberParser.ts`:
```typescript
export function parseNumbers(valueStr: any): { prefix: string; n1: number; n2: number | null; suffix: string } {
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
```

**Step 4: Run test to verify it passes**
Run: `npx tsx scratch_test_number_parser.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add my-video/src/utils/numberParser.ts my-video/scratch_test_number_parser.ts
git commit -m "feat: add smart number parser utility"
```

---

### Task 2: Integrate `numberParser` in MetricShowcaseHookMode

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx:6-45` (Delete inline `parseNumbers` and import from `../../../utils/numberParser`)

**Step 1: Write the test**
The test will verify that MetricShowcaseHookMode imports and compiles correctly.

**Step 2: Run test to verify**
Run: `npx tsc -p my-video/tsconfig.json --noEmit`
Expected: Compilation works or fails on import statement.

**Step 3: Modify the code**
Modify `my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx`:
Delete lines 6-45 (the inline `parseNumbers` helper).
Add import:
```typescript
import { parseNumbers } from "../../../utils/numberParser";
```

**Step 4: Run test to verify it compiles**
Run: `npx tsc -p my-video/tsconfig.json --noEmit`
Expected: PASS with no compilation errors.

**Step 5: Commit**
```bash
git add my-video/src/compositions/layouts/modes/MetricShowcaseHookMode.tsx
git commit -m "refactor: use shared parseNumbers in MetricShowcaseHookMode"
```

---

### Task 3: Integrate `numberParser` in MetricFocusShowcaseMode

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx:7-46` (Delete inline `parseNumbers` and import from `../../../utils/numberParser`)

**Step 1: Write the test**
Verification that MetricFocusShowcaseMode compiles correctly.

**Step 2: Run test to verify**
Run: `npx tsc -p my-video/tsconfig.json --noEmit`
Expected: Compiles with no errors.

**Step 3: Modify the code**
Modify `my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx`:
Delete lines 7-46 (the inline `parseNumbers` helper).
Add import:
```typescript
import { parseNumbers } from "../../../utils/numberParser";
```

**Step 4: Run test to verify it compiles**
Run: `npx tsc -p my-video/tsconfig.json --noEmit`
Expected: PASS with no compilation errors.

**Step 5: Commit & Clean up**
Delete `my-video/scratch_test_number_parser.ts`.
```bash
rm my-video/scratch_test_number_parser.ts
git add my-video/src/compositions/layouts/modes/MetricFocusShowcaseMode.tsx
git commit -m "refactor: use shared parseNumbers in MetricFocusShowcaseMode and clean up scratch test"
```
