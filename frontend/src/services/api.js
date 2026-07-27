import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export const api = {
  getProjects: async () => {
    const response = await axios.get(`${API_BASE}/projects`);
    return response.data;
  },
  createProject: async (title) => {
    const response = await axios.post(`${API_BASE}/projects`, { title });
    return response.data;
  },
  deleteProject: async (id) => {
    const response = await axios.delete(`${API_BASE}/projects/${id}`);
    return response.data;
  },
  getProjectById: async (id) => {
    const response = await axios.get(`${API_BASE}/projects/${id}`);
    return response.data;
  },
  updateProjectConfig: async (id, config) => {
    const response = await axios.put(`${API_BASE}/projects/${id}/config`, config);
    return response.data;
  },
  updateScene: async (projectId, sceneId, sceneData) => {
    const response = await axios.put(`${API_BASE}/projects/${projectId}/scenes/${sceneId}`, sceneData);
    return response.data;
  },
  generateStoryboard: async (projectId, scriptText, visualStyle, traits = [], selectedMedia = []) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/generate-storyboard`, { scriptText, visualStyle, traits, selectedMedia });
    return response.data;
  },
  triggerRender: async (projectId) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/render`);
    return response.data;
  },
  getRenderStatus: async (projectId, renderId) => {
    const response = await axios.get(`${API_BASE}/projects/${projectId}/render/status/${renderId}`);
    return response.data;
  },
  regenerateTts: async (projectId) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/regenerate-tts`);
    return response.data;
  },
  regenerateSceneTts: async (projectId, sceneId) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/scenes/${sceneId}/regenerate-tts`);
    return response.data;
  },
  generateStudioAiGen: async (script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId = null) => {
    const response = await axios.post(`${API_BASE}/studio-ai-gen/generate`, { script, targetLength, theme, voiceKey, bgImage, refImages, projectId });
    return response.data;
  },
  planStudioAiGen: async (script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId = null) => {
    const response = await axios.post(`${API_BASE}/studio-ai-gen/plan`, { script, targetLength, theme, voiceKey, bgImage, refImages, projectId });
    return response.data;
  },
  generateStudioAiGenScene: async (projectId, scene, voiceKey = "duythanh", theme = "ai_hub_grid", bgImage = "", refImages = [], script = "", bypassCache = true, userNote = "") => {
    const response = await axios.post(`${API_BASE}/studio-ai-gen/generate-scene`, { projectId, scene, voiceKey, theme, bgImage, refImages, script, bypassCache, userNote });
    return response.data;
  },
  saveStudioAiGenConfig: async (projectId, title, config) => {
    const response = await axios.post(`${API_BASE}/studio-ai-gen/save-config`, { projectId, title, config });
    return response.data;
  }
};
