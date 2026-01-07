import { Attachment, GeminiResponse } from '../types';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const generateContent = async (prompt: string, attachments: Attachment[] = []): Promise<GeminiResponse> => {
  try {
    const sanitizedAttachments = attachments
      .filter((att) => att.type === 'image' && att.data && att.mimeType)
      .map((att) => ({
        type: att.type,
        data: att.data,
        mimeType: att.mimeType,
        name: att.name,
        size: att.size
      }));

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        session_id: 'default-session',
        attachments: sanitizedAttachments
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      text: data.text,
      agent: data.agent,
      payload: data.payload,
    } as GeminiResponse;

  } catch (error: any) {
    console.error("Backend API Fail:", error);
    return {
      text: "Error de conexión con el backend. Verifica que el servidor esté corriendo en localhost:8000",
      agent: "GENESIS",
      payload: {
        type: 'alert-banner',
        props: { type: 'error', message: error.message || "Connection error" }
      }
    };
  }
};
