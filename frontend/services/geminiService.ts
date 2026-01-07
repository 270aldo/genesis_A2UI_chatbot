import { GoogleGenAI } from "@google/genai";
import { Attachment, GeminiResponse } from '../types';
import { SYSTEM_PROMPT } from '../constants';

const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // remove data:image/jpeg;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const mockResponse = async (prompt: string): Promise<GeminiResponse> => {
  await new Promise(r => setTimeout(r, 1500));
  return {
    text: "Modo Simulación (Sin API Key). Configura la clave para usar la inteligencia real de Gemini.",
    agent: "GENESIS",
    payload: { 
      type: 'alert-banner', 
      props: { type: 'warning', message: "API Key no detectada. Usando respuestas predefinidas." } 
    }
  };
};

export const generateContent = async (prompt: string, attachments: Attachment[] = []): Promise<GeminiResponse> => {
  if (!process.env.API_KEY) {
    return mockResponse(prompt);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert attachments to inline data parts
    const imageParts = await Promise.all(attachments.map(async (att) => {
      const base64Data = att.data || await urlToBase64(att.url);
      return {
        inlineData: {
          mimeType: att.mimeType || "image/jpeg",
          data: base64Data
        }
      };
    }));

    // Construct content
    const contents = {
        parts: [
            ...imageParts,
            { text: prompt }
        ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const textResponse = response.text;
    
    if (!textResponse) throw new Error("Empty response from Gemini");

    try {
      // CLEANUP: Robust JSON extraction
      // Finds the first '{' and the last '}' to ignore any preamble/postscript text
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const cleanText = jsonMatch ? jsonMatch[0] : textResponse;

      return JSON.parse(cleanText) as GeminiResponse;
    } catch (e) {
      console.error("Failed to parse JSON response:", textResponse);
      // Fallback: return text as is if JSON parse fails
      return {
        text: textResponse,
        agent: "GENESIS"
      };
    }

  } catch (error: any) {
    console.error("Gemini API Fail:", error);
    return {
      text: "Lo siento, hubo un error de conexión con el núcleo Genesis. Intenta de nuevo.",
      agent: "GENESIS",
      payload: { type: 'alert-banner', props: { type: 'error', message: error.message || "Unknown error" } }
    };
  }
};