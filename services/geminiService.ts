
import { GoogleGenAI, Type } from "@google/genai";
import { Engine, Resolution, AspectRatio, AnalysisResult, VideoSettings } from "./types";

const getAI = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found. Please set your Gemini API key first.");
  return new GoogleGenAI({ apiKey });
};

export const analyzeScript = async (scriptParts: string[], targetSceneCount: number): Promise<AnalysisResult> => {
  const ai = getAI();
  const formattedScript = scriptParts.map((part, i) => `[PART ${i}]\n${part}`).join("\n\n");

  const systemInstruction = `당신은 전문 K-드라마 감독입니다. 제공된 대본을 분석하여 총 ${targetSceneCount}개의 스토리보드 장면(scenes)과 주요 등장인물(characters)을 추출하세요. 
  imagePrompt는 AI 이미지 생성을 위한 상세한 영문 프롬프트여야 하며, 인물의 외양 묘사를 항상 포함하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: formattedScript,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING, description: "인물 외양 묘사 (한국어)" }
                },
                required: ["name", "description"]
              }
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  originalText: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING, description: "상세 영문 이미지 프롬프트" },
                  videoPrompt: { type: Type.STRING, description: "영상 움직임 묘사 (한국어)" }
                },
                required: ["sceneNumber", "originalText", "imagePrompt", "videoPrompt"]
              }
            }
          },
          required: ["characters", "scenes"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      characters: (parsed.characters || []).map((c: any) => ({
        id: crypto.randomUUID(), ...c, status: 'pending', history: []
      })),
      scenes: (parsed.scenes || []).map((s: any) => ({
        id: crypto.randomUUID(), ...s, status: 'pending', history: []
      }))
    };
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, engine: Engine, aspectRatio: AspectRatio, resolution: Resolution): Promise<string> => {
  const ai = getAI();
  const config: any = { imageConfig: { aspectRatio } };
  if (engine === Engine.NANO_BANANA_PRO) config.imageConfig.imageSize = resolution;

  const response = await ai.models.generateContent({
    model: engine,
    contents: { parts: [{ text: `${prompt} --Cinematic K-Drama style` }] },
    config
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part) throw new Error("No image generated");
  return `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`;
};

export const generateVideo = async (imageBase64: string, prompt: string, settings: VideoSettings): Promise<string> => {
  const ai = getAI();
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  let operation = await ai.models.generateVideos({
    model: settings.model,
    prompt,
    image: { imageBytes: base64Data, mimeType: 'image/png' },
    config: { numberOfVideos: 1, resolution: settings.resolution }
  });

  while (!operation.done) {
    await new Promise(r => setTimeout(r, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY;
  const res = await fetch(`${uri}&key=${apiKey}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};
