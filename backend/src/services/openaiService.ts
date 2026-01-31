// src/services/openaiService.ts
import dotenv from "dotenv";
import OpenAI from "openai";
import { logger } from "../utils/logger.js";

// Ensure environment variables are loaded
dotenv.config();

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return client;
}

// Valid models as of 2025
const VALID_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-preview",
];

// Map old or invalid models to new correct ones
function normalizeModel(model: string | undefined): string {
  if (!model) return "gpt-4o-mini";

  const lower = model.toLowerCase().trim();

  // Auto-map common deprecated names
  if (lower === "gpt-4" || lower === "gpt4") return "gpt-4.1";
  if (lower === "gpt-4-turbo") return "gpt-4.1";
  if (lower === "gpt-3.5" || lower.includes("3.5")) return "gpt-4o-mini";
  if (lower === "4o" || lower === "o4") return "gpt-4o";
  if (lower === "mini" || lower === "small") return "gpt-4o-mini";

  // If valid, return it
  if (VALID_MODELS.includes(model)) return model;

  logger.warn(`Invalid AI model "${model}", falling back to gpt-4o-mini`);
  return "gpt-4o-mini";
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

/**
 * STREAMING FUNCTION
 */
export async function* openaiStream(model: string, messages: AIMessage[]) {
  const safeModel = normalizeModel(model);
  const client = getClient();

  logger.info("[OpenAI] Using model:", safeModel);

  try {
    let stream;
    try {
      stream = await client.chat.completions.create({
        model: safeModel,
        messages: messages as any,
        stream: true,
      });
    } catch (error: any) {
      // Check if error is model-related
      const isModelError = error?.status === 404 || 
                          error?.code === 'model_not_found' ||
                          error?.message?.toLowerCase().includes('model') ||
                          error?.error?.code === 'model_not_found';
      
      if (isModelError && safeModel !== 'gpt-4o-mini') {
        logger.warn(`Model "${safeModel}" not found or unavailable, falling back to gpt-4o-mini`);
        // Retry with default model
        stream = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages as any,
          stream: true,
        });
      } else {
        // Re-throw if not a model error or already using default
        throw error;
      }
    }

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content || "";
      if (token) yield token;
    }
  } catch (err) {
    logger.error("[OpenAI] Streaming error:", err);
    throw err;
  }
}

/**
 * NON-STREAMING FUNCTION (For Testing & Quick Checks)
 */
export async function openaiChat(model: string, messages: AIMessage[], temperature: number = 0.7) {
  const safeModel = normalizeModel(model);
  const client = getClient();

  try {
    const response = await client.chat.completions.create({
      model: safeModel,
      messages: messages as any,
      temperature,
      stream: false, // No streaming here
    });

    return {
      content: response.choices[0].message.content || "",
      usage: response.usage,
    };
  } catch (err) {
    logger.error("[OpenAI] Chat error:", err);
    throw err;
  }
}