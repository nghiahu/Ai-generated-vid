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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    mutationFn: ({ projectId, scriptText, visualStyle, traits, selectedMedia, selectedBgMedia, selectedCtaMedia, options }) =>
      api.generateStoryboard(projectId, scriptText, visualStyle, traits, selectedMedia, selectedBgMedia, selectedCtaMedia, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId] });
    },
  });
}
