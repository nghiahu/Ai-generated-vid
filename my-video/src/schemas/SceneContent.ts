// my-video/src/schemas/SceneContent.ts
// Rule: no logic, no functions, no defaults. Types only.

export interface SceneContent {
  heading: string;       // maps to 'title' slot
  primary: string;       // maps to 'hero'/'metric' slot
  supporting: string[];  // maps to 'caption'/'bullets' slots
  voiceover: string;
  voiceoverTts?: string;
}
