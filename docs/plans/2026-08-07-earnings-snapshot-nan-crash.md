# Earnings Snapshot NaN Crash Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify EarningsSnapshotMode.tsx to sanitize the progress bar values and prevent the Remotion player from crashing due to `NaN` values in `interpolate`.

**Architecture:**
1. Update parsing logic in `EarningsSnapshotMode.tsx` to filter out non-numeric characters using `replace(/[^\d]/g, "")` and check with `isNaN` before assigning `pct` to `interpolate`.

**Tech Stack:** React, TypeScript, Remotion

---

### Task 1: Sanitize percentage value parsing in EarningsSnapshotMode

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/EarningsSnapshotMode.tsx`

**Step 1: Inspect code**
Check lines 170-180 in `EarningsSnapshotMode.tsx`.

**Step 2: Modify code**
Update `EarningsSnapshotMode.tsx` to safely parse percentage:
```typescript
            const rawVal = comp?.data?.value;
            let pct = defaultPercentages[idx] ?? 50;
            if (rawVal) {
              const parsed = parseInt(String(rawVal).replace(/[^\d]/g, ""), 10);
              if (!isNaN(parsed)) {
                pct = Math.min(100, Math.max(0, parsed));
              }
            }
```

**Step 3: Run verify compilation**
Run: `npx eslint src/compositions/layouts/modes/EarningsSnapshotMode.tsx`
Expected: PASS

**Step 4: Commit**
```bash
git add my-video/src/compositions/layouts/modes/EarningsSnapshotMode.tsx
git commit -m "fix: sanitize progress bar value parsing to prevent NaN render crash in EarningsSnapshotMode"
```
