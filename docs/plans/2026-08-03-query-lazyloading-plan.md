# Query Optimization & Component Lazy Loading Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Optimize query performance and reduce initial load times using TanStack Query caching and React.lazy component loading.

**Architecture:** Wrap the React app in a QueryClientProvider. Extract all database queries and mutations into custom React Query hooks, then lazy-load heavy pages using Suspense and a glassmorphic shimmer skeleton screen fallback.

**Tech Stack:** React 19, `@tanstack/react-query` v5, Axios, Vite.

---

### Task 1: Package Dependencies

**Files:**
- Modify: `frontend/package.json`

**Step 1: Write the failing test / verification**
Verify current dependency list doesn't have `@tanstack/react-query`.
Run: `cat frontend/package.json`

**Step 2: Write minimal implementation**
Run npm installation in frontend:
`npm install @tanstack/react-query@5`

**Step 3: Run verification**
Verify installation success by checking if `@tanstack/react-query` is listed in package.json.

**Step 4: Commit**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: install @tanstack/react-query v5"
```

---

### Task 2: Core Query Provider Setup

**Files:**
- Modify: `frontend/src/main.jsx`

**Step 1: Write minimal implementation**
Import `QueryClient` and `QueryClientProvider`. Instantiate `QueryClient` and wrap the app in the provider.
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Step 2: Commit**
```bash
git add frontend/src/main.jsx
git commit -m "feat: set up TanStack QueryClientProvider in main.jsx"
```

---

### Task 3: Custom React Query Hooks

**Files:**
- Create: `frontend/src/hooks/useProjectQueries.js`

**Step 1: Write minimal implementation**
Write the complete query and mutation hooks using `useQuery` and `useMutation` from `@tanstack/react-query`.
```javascript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });
}

export function useProjectDetail(projectId) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => api.getProjectById(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProjectConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }) => api.updateProjectConfig(id, config),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
    },
  });
}

export function useUpdateScene() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sceneId, sceneData }) => api.updateScene(projectId, sceneId, sceneData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
    },
  });
}

export function useRegenerateTts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId) => api.regenerateTts(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

export function useRegenerateSceneTts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, sceneId }) => api.regenerateSceneTts(projectId, sceneId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
    },
  });
}

export function useGenerateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, scriptText, visualStyle, traits, selectedMedia }) =>
      api.generateStoryboard(projectId, scriptText, visualStyle, traits, selectedMedia),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
    },
  });
}
```

**Step 2: Commit**
```bash
git add frontend/src/hooks/useProjectQueries.js
git commit -m "feat: create useProjectQueries custom hooks file"
```

---

### Task 4: Shimmer Skeleton Loader

**Files:**
- Create: `frontend/src/components/SkeletonLoader.jsx`

**Step 1: Write minimal implementation**
Write the skeleton loaders with premium glassmorphism shimmer effect.
```javascript
import React from "react";

export function SkeletonLoader({ type = "dashboard" }) {
  const shimmerStyle = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(15, 23, 42, 0.08)",
  };

  const keyframes = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;

  const shimmerMask = {
    background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  if (type === "dashboard") {
    return (
      <div style={{ padding: "50px 40px", maxWidth: "1080px", margin: "0 auto" }}>
        <style>{keyframes}</style>
        <div style={{ height: "40px", width: "200px", borderRadius: "8px", ...shimmerStyle, marginBottom: "32px" }}>
          <div style={shimmerMask} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "340px", ...shimmerStyle }}>
              <div style={shimmerMask} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Workspace 3-column skeleton
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <style>{keyframes}</style>
      {/* Left Sidebar */}
      <div style={{ width: "260px", height: "100%", ...shimmerStyle, borderRadius: 0, borderRight: "1px solid rgba(15,23,42,0.08)" }}>
        <div style={shimmerMask} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Editor */}
        <div style={{ flex: 1, height: "100%", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ height: "80px", ...shimmerStyle }}>
            <div style={shimmerMask} />
          </div>
          <div style={{ flex: 1, ...shimmerStyle }}>
            <div style={shimmerMask} />
          </div>
        </div>
        {/* Preview Player */}
        <div style={{ width: "400px", height: "100%", ...shimmerStyle, borderRadius: 0 }}>
          <div style={shimmerMask} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add frontend/src/components/SkeletonLoader.jsx
git commit -m "feat: create glassmorphic SkeletonLoader component"
```

---

### Task 5: Lazy Load & Custom Hook Integration in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Write minimal implementation**
Convert named component imports into `React.lazy` wrappers. Wrap sub-components inside `<Suspense>` using the `SkeletonLoader`. Integrate custom hooks.
*(Detailed modifications to App.jsx will be applied in this task).*

**Step 2: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: refactor App.jsx with React.lazy, Suspense, and TanStack query hooks"
```

---

### Task 6: Custom Hook Integration in StudioAIGen.jsx

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Write minimal implementation**
Replace local `useEffect` fetching with `useProjectDetail(projectId)` and synchronize data.

**Step 2: Commit**
```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: refactor StudioAIGen.jsx to fetch via react query"
```

---

### Task 7: Build Validation & End-to-End Check

**Files:**
- Test: Build output validation

**Step 1: Run production build**
Run: `npm run build` inside `frontend/`
Expected: Build passes with chunk division logs.
