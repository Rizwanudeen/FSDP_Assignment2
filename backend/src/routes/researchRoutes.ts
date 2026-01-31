// src/routes/researchRoutes.ts
import express from "express";
import { authenticateToken } from "../middleware/auth";
import { runModularSearch, runAeroModelSuggestions } from "../services/pythonService";
import { openaiStream } from "../services/openaiService";

const router = express.Router();

// All research routes require auth
router.use(authenticateToken);

/**
 * POST /api/research/search
 * Body: { query }
 */
router.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res
      .status(400)
      .json({ success: false, error: "query is required" });
  }

  const results = await runModularSearch(query);
  return res.json({ success: true, data: results });
});

/**
 * POST /api/research/aero
 * Body: { prompt }
 */
router.post("/aero", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res
      .status(400)
      .json({ success: false, error: "prompt is required" });
  }

  const suggestions = await runAeroModelSuggestions(prompt);
  return res.json({ success: true, data: suggestions });
});

/**
 * POST /api/research/full
 * Full pipeline: Modular Search + Aero + OpenRouter summary
 * Body: { query }
 */
router.post("/full", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res
      .status(400)
      .json({ success: false, error: "query is required" });
  }

  const searchResults = await runModularSearch(query);
  const aeroSuggestions = await runAeroModelSuggestions(query);

  const prompt = `
You are an AI research assistant.

User query:
${query}

Modular Search results:
${JSON.stringify(searchResults, null, 2)}

Aero model suggestions:
${JSON.stringify(aeroSuggestions, null, 2)}

Summarise the above into:
- Clear research direction
- Suggested ML models / methods
- Short reasoning.
`;

  const summary = await (async () => {
    try {
      let summaryText = "";
      for await (const token of openaiStream("gpt-4o-mini", [
        { role: "system", content: "You are a research analyst. Summarize concisely." },
        { role: "user", content: prompt }
      ])) {
        summaryText += token;
      }
      return summaryText;
    } catch (err) {
      return "Summary generation failed";
    }
  })();

  return res.json({
    success: true,
    data: {
      searchResults,
      aeroSuggestions,
      summary,
    },
  });
});

export const researchRoutes = router;
