import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

interface GenerateOptions {
  modelId: string;
  prompt: string;
  history: Message[];
  enableThinking: boolean;
  enableSearch: boolean;
  apiKey?: string;
  searchApiKey?: string;
  apiEndpoint?: string;
  image?: string;
  signal?: AbortSignal;
  systemInstruction?: string;
  sessionId?: string;
}

export const generateResponseStream = async ({
  modelId,
  prompt,
  history,
  enableThinking,
  enableSearch,
  apiKey,
  searchApiKey,
  apiEndpoint,
  image,
  signal,
  systemInstruction,
  sessionId
}: GenerateOptions) => {
  try {
    // Use provided key or fallback to env
    const key = apiKey || process.env.API_KEY;
    
    if (!key) {
      throw new Error("API Key is missing. Please provide it in the settings.");
    }

    // 1. Check if we should use a Custom Backend (FastAPI / "Any AI")
    if (apiEndpoint && !apiEndpoint.includes('googleapis.com')) {
      console.log("Using Custom Backend for:", modelId, "at", apiEndpoint);
      
      const baseUrl = apiEndpoint.replace(/\/$/, '');
      const backendUrl = `${baseUrl}/api/chat`;

      try {
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key 
          },
          body: JSON.stringify({
            message: prompt,
            image: image,
            model: modelId,
            apiKey: key, 
            providerUrl: apiEndpoint, 
            history: history,
            deepThink: enableThinking,
            enableSearch: enableSearch,
            searchApiKey: searchApiKey,
            systemInstruction: systemInstruction,
            sessionId: sessionId
          }),
          signal: signal
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Backend Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        
        async function* mockStream() {
           // Yield text response
           yield { text: data.response };

           // Yield sources if present
           if (data.sources && data.sources.length > 0) {
               const groundingChunks = data.sources.map((source: string) => ({
                   web: {
                       title: `Source: ${source}`,
                       uri: source
                   }
               }));

               yield {
                   candidates: [{
                       groundingMetadata: {
                           groundingChunks: groundingChunks
                       }
                   }]
               };
           }
        }
        
        return mockStream();
      } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error('Aborted');
        }
        console.error("Backend Connection Error:", err);
        throw new Error(`Failed to connect to backend: ${err.message}`);
      }
    }

    // 2. Default: Use Google GenAI SDK
    console.log("Using Google GenAI SDK for:", modelId);
    const clientOptions: any = { apiKey: key };
    if (apiEndpoint) clientOptions.baseUrl = apiEndpoint;
    
    const ai = new GoogleGenAI(clientOptions);

    const chat = ai.chats.create({
      model: modelId,
      config: systemInstruction ? { systemInstruction: systemInstruction } : undefined,
      history: history
        .filter(msg => msg.role !== 'model' || !msg.thinking) 
        .map(msg => {
            const parts: any[] = [{ text: msg.content }];
            return {
                role: msg.role,
                parts: parts,
            };
        }),
    });

    const config: any = {
      ...(enableThinking && modelId.includes('gemini-3') ? {
         thinkingConfig: { thinkingBudget: 2048 } 
      } : {}),
      tools: enableSearch ? [{ googleSearch: {} }] : [],
    };

    if (enableSearch && config.thinkingConfig) delete config.thinkingConfig;

    const currentParts: any[] = [{ text: prompt }];
    if (image) {
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        currentParts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    const result = await chat.sendMessageStream({
      message: { role: 'user', parts: currentParts },
      config
    });

    // Wrap the stream to handle abort signal for SDK (by manually checking)
    async function* wrappedStream() {
        for await (const chunk of result.stream) {
            if (signal?.aborted) {
                throw new Error('Aborted');
            }
            yield chunk;
        }
    }

    return wrappedStream();

  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Aborted') {
        throw error;
    }
    console.error("API Error:", error);
    throw error;
  }
};