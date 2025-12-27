
export enum AspectRatio {
  SQUARE = "1:1",
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16"
}

export enum Resolution {
  RES_1K = "1K",
  RES_2K = "2K",
  RES_4K = "4K"
}

export enum Engine {
  NANO_BANANA = "gemini-2.5-flash-image",
  NANO_BANANA_PRO = "gemini-3-pro-image-preview"
}

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  engine: Engine;
  targetSceneCount: number;
  totalParts: number;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  prompt: string;
  createdAt: number;
  videoUrl?: string;
  videoStatus?: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface Character {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  history: GeneratedAsset[];
  error?: string;
}

export interface VideoSettings {
  model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
  resolution: '720p' | '1080p';
}

export interface Scene {
  id: string;
  sceneNumber: number;
  originalText: string;
  imagePrompt: string;
  videoPrompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  history: GeneratedAsset[];
  error?: string;
  videoStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface AnalysisResult {
  scenes: Scene[];
  characters: Character[];
}
