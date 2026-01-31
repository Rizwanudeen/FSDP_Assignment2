import axios from 'axios';

const AERO_URL = process.env.AERO_SERVICE_URL || 'http://localhost:8001';

const client = axios.create({
  baseURL: AERO_URL,
  timeout: 120000,
});

export async function suggestModels(prompt: string) {
  const res = await client.post('/suggest_models', { prompt });
  return res.data;
}

export async function planResearch(prompt: string) {
  const res = await client.post('/plan_research', { prompt });
  return res.data;
}

export async function experimentSuggestions(prompt: string, experimental_results: any = {}) {
  const res = await client.post('/experiment_suggestions', { prompt, experimental_results });
  return res.data;
}

export async function writeReport(user_query: string, experimental_data: any = {}) {
  const res = await client.post('/write_report', { user_query, experimental_data });
  return res.data;
}
