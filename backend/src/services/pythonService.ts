// src/services/pythonService.ts
import axios from "axios";
import { logger } from "../utils/logger.js";

const MODULAR_SEARCH_URL =
  process.env.MODULAR_SEARCH_URL || "http://localhost:8000/search";

const AERO_SERVER_URL =
  process.env.AERO_SERVER_URL || "http://localhost:8001/suggest";

export async function runModularSearch(query: string) {
  try {
    const resp = await axios.post(MODULAR_SEARCH_URL, { query });
    const data = resp.data || {};
    return data.results || [];
  } catch (error: any) {
    logger.warn(
      "[PythonService] Modular Search failed, returning empty results:",
      error.message || error
    );
    return [];
  }
}

export async function runAeroModelSuggestions(prompt: string) {
  try {
    const resp = await axios.post(AERO_SERVER_URL, { prompt });
    const data = resp.data || {};
    // Expecting shape: { success, model_suggestions: [...] } or { data: { model_suggestions: [...] } }
    return (
      data.model_suggestions ||
      data.data?.model_suggestions ||
      data.suggestions ||
      []
    );
  } catch (error: any) {
    logger.warn(
      "[PythonService] Aero suggestions failed, returning empty list:",
      error.message || error
    );
    return [];
  }
}
