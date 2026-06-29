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
  generateStoryboard: async (projectId, scriptText) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/generate-storyboard`, { scriptText });
    return response.data.scenes;
  },
  triggerRender: async (projectId) => {
    const response = await axios.post(`${API_BASE}/projects/${projectId}/render`);
    return response.data;
  },
  getRenderStatus: async (projectId, renderId) => {
    const response = await axios.get(`${API_BASE}/projects/${projectId}/render/status/${renderId}`);
    return response.data;
  }
};
