import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import api from '../services/api';

/* ============================================================
   🔥 VALID OPENROUTER-FREE MODELS (UI ONLY)
   ============================================================ */
const FREE_MODELS = {
  GPT4O_MINI: "openai/gpt-4o-mini",
  GPT4O_MINI_CHAT: "openai/gpt-4o-mini-chat",
  MISTRAL_SMALL: "mistralai/mistral-small",
  MISTRAL_TINY: "mistralai/mistral-tiny",
  LLAMA_8B: "meta-llama/llama-3.1-8b-instruct:free",
  LLAMA_3B: "meta-llama/llama-3.2-3b-instruct:free"
};

/* ============================================================
   🔥 MODEL NORMALIZER (CRITICAL FIX)
   Converts OpenRouter models → valid OpenAI model names
   ============================================================ */
function normalizeModel(uiModel: string): string {
  if (!uiModel) return "gpt-4o-mini";

  // Removes prefixes like "openai/" or "mistralai/"
  let clean = uiModel.includes("/") ? uiModel.split("/")[1] : uiModel;

  // Remove ":free"
  clean = clean.replace(":free", "");

  // Default fallback
  if (!clean) return "gpt-4o-mini";
  return clean;
}

/* ============================================================
   🔥 TEMPLATES
   ============================================================ */
const templates = [
  {
    id: 'tpl_blank',
    name: 'Start from Scratch',
    category: 'Custom',
    desc: 'Build an agent from scratch',
    caps: [] as string[],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.7,
    type: 'CONVERSATIONAL',
  },
  {
    id: 'tpl_support',
    name: 'Customer Support Agent',
    category: 'Business',
    desc: 'Handles inquiries, resolves issues',
    caps: ['Customer Service', 'Product Knowledge', 'Ticket Management', 'Email Support'],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.6,
    type: 'CONVERSATIONAL',
  },
  {
    id: 'tpl_data',
    name: 'Data Analysis Agent',
    category: 'Analytics',
    desc: 'Analyzes data and generates insights',
    caps: ['Data Analysis', 'Visualization', 'Statistical Modeling'],
    model: FREE_MODELS.MISTRAL_SMALL,
    temp: 0.3,
    type: 'ANALYTICAL',
  },
  {
    id: 'tpl_content',
    name: 'Content Creator Agent',
    category: 'Marketing',
    desc: 'Generates engaging content',
    caps: ['Content Writing', 'Copywriting', 'Social Media'],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.9,
    type: 'CREATIVE',
  },
  {
    id: 'tpl_workflow',
    name: 'Workflow Automation Agent',
    category: 'Productivity',
    desc: 'Automates tasks and workflows',
    caps: ['Task Automation', 'Workflow Management', 'Integration'],
    model: FREE_MODELS.MISTRAL_SMALL,
    temp: 0.5,
    type: 'AUTOMATION',
  },
  {
    id: 'tpl_tutor',
    name: 'Educational Tutor Agent',
    category: 'Education',
    desc: 'Provides personalized learning assistance',
    caps: ['Teaching', 'Explanations', 'Quiz Generation'],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.5,
    type: 'CONVERSATIONAL',
  },
  {
    id: 'tpl_ecom',
    name: 'E-commerce Assistant',
    category: 'E-commerce',
    desc: 'Helps customers find and order products',
    caps: ['Product Search', 'Order Management', 'Recommendations'],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.6,
    type: 'CONVERSATIONAL',
  },
  {
    id: 'tpl_med',
    name: 'Medical Information Agent',
    category: 'Healthcare',
    desc: 'Provides general medical info',
    caps: ['Health Information', 'Symptom Assessment', 'Appointment Scheduling'],
    model: FREE_MODELS.GPT4O_MINI,
    temp: 0.4,
    type: 'CONVERSATIONAL',
  },
  {
    id: 'tpl_code',
    name: 'Code Review Agent',
    category: 'Development',
    desc: 'Reviews code and suggests improvements',
    caps: ['Code Review', 'Debugging', 'Documentation'],
    model: FREE_MODELS.LLAMA_3B,
    temp: 0.4,
    type: 'ANALYTICAL',
  },
];

const capabilityOptions = [
  'Text Generation',
  'Question Answering',
  'Sentiment Analysis',
  'Language Translation',
  'Code Generation',
  'Data Analysis',
  'Customer Service',
  'Product Knowledge',
  'Email Support',
  'Document Summarization',
];

type AgentType = 'CONVERSATIONAL' | 'ANALYTICAL' | 'CREATIVE' | 'AUTOMATION';
type AgentStatus = 'ACTIVE' | 'PAUSED' | 'TRAINING';

interface AgentFormState {
  name: string;
  description: string;
  type: AgentType;
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  status: AgentStatus;
}

/* ============================================================
   🔥 MAIN COMPONENT
   ============================================================ */
export default function AgentBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentFormState>({
    name: '',
    description: '',
    type: 'CONVERSATIONAL',
    capabilities: [],
    model: FREE_MODELS.GPT4O_MINI,
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    status: 'ACTIVE',
  });

  const createAgentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/agents', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      navigate('/dashboard');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || err.message || 'Failed to create agent');
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        name: template.name,
        description: template.desc,
        type: template.type as AgentType,
        capabilities: [...template.caps],
        model: template.model,
        temperature: template.temp,
      }));
    }
    setStep(2);
  };

  const handleNext = () => step < 6 && setStep(step + 1);
  const handleBack = () => step > 1 && setStep(step - 1);

  /* ============================================================
     🔥 FINISH — SEND TO BACKEND
     (with normalized model)
     ============================================================ */
  const handleFinish = () => {
    if (!formData.name.trim()) {
      alert('Please enter agent name');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      capabilities: formData.capabilities,
      configuration: {
        model: normalizeModel(formData.model),   // IMPORTANT FIX
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        systemPrompt: formData.systemPrompt,
        capabilities: formData.capabilities,
      },
    };

    createAgentMutation.mutate(payload);
  };

  const MODEL_OPTIONS = [
    { id: FREE_MODELS.GPT4O_MINI, label: "GPT-4o Mini (FREE)" },
    { id: FREE_MODELS.GPT4O_MINI_CHAT, label: "GPT-4o Mini Chat (FREE)" },
    { id: FREE_MODELS.MISTRAL_SMALL, label: "Mistral Small (FREE)" },
    { id: FREE_MODELS.MISTRAL_TINY, label: "Mistral Tiny (FREE)" },
    { id: FREE_MODELS.LLAMA_8B, label: "LLaMA 3.1 8B (FREE)" },
    { id: FREE_MODELS.LLAMA_3B, label: "LLaMA 3.2 3B (FREE)" },
  ];

  /* ============================================================
     🔥 UI BELOW (unchanged)
     ============================================================ */

  const stepTitles = [
    'Template',
    'Basic Info',
    'Type & Personality',
    'Capabilities',
    'Configuration',
    'Review',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Create New Agent</h1>
            <p className="text-gray-600">Follow the steps to build your custom AI agent</p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* PROGRESS STEPS */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {stepTitles.map((title, idx) => (
            <div key={idx}
              className={`px-4 py-2 rounded-full text-sm ${
                step === idx + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-600'
              }`}>
              {title}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-lg shadow p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Choose a Template</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`border rounded-lg p-4 cursor-pointer hover:border-blue-500 ${
                      selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Wand2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-500">{template.category}</span>
                    </div>

                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.desc}</p>

                    {template.caps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.caps.slice(0, 2).map((c, i) => (
                          <span key={i} className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {c}
                          </span>
                        ))}
                        {template.caps.length > 2 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            +{template.caps.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium">Agent Name *</span>
                  <input
                    type="text"
                    className="w-full border px-4 py-2 rounded"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    rows={3}
                    className="w-full border px-4 py-2 rounded"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="border px-4 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Agent Type & Personality</h2>

              <div className="space-y-6">
                {/* TYPE */}
                <label className="block">
                  <span className="text-sm font-medium">Agent Type</span>
                  <select
                    className="w-full border px-4 py-2 rounded"
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as AgentType }))}
                  >
                    <option value="CONVERSATIONAL">Conversational</option>
                    <option value="ANALYTICAL">Analytical</option>
                    <option value="CREATIVE">Creative</option>
                    <option value="AUTOMATION">Automation</option>
                  </select>
                </label>

                {/* PERSONALITY */}
                <label className="block">
                  <span className="text-sm font-medium">
                    Personality (Temperature: {formData.temperature.toFixed(2)})
                  </span>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, temperature: parseFloat(e.target.value) }))
                    }
                    className="w-full"
                  />

                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="border px-4 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Agent Capabilities</h2>

              <div className="flex flex-wrap gap-2">
                {capabilityOptions.map((cap) => {
                  const selected = formData.capabilities.includes(cap);
                  return (
                    <button
                      key={cap}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          capabilities: selected
                            ? prev.capabilities.filter((c) => c !== cap)
                            : [...prev.capabilities, cap],
                        }))
                      }
                      className={`px-3 py-2 rounded-lg text-sm ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="border px-4 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Model Configuration</h2>

              <div className="space-y-4">

                {/* MODEL SELECTION */}
                <label className="block">
                  <span className="text-sm font-medium">Model (FREE)</span>
                  <select
                    className="w-full border px-4 py-2 rounded"
                    value={formData.model}
                    onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* MAX TOKENS */}
                <label className="block">
                  <span className="text-sm font-medium">Max Tokens</span>
                  <input
                    type="number"
                    className="w-full border px-4 py-2 rounded"
                    value={formData.maxTokens}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        maxTokens: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </label>

                {/* SYSTEM PROMPT */}
                <label className="block">
                  <span className="text-sm font-medium">System Prompt</span>
                  <textarea
                    rows={3}
                    className="w-full border px-4 py-2 rounded"
                    value={formData.systemPrompt}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, systemPrompt: e.target.value }))
                    }
                  />
                </label>

                {/* STATUS */}
                <label className="block">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    className="w-full border px-4 py-2 rounded"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value as AgentStatus }))
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="TRAINING">Training</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="border px-4 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <button onClick={handleNext} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {step === 6 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Review & Launch</h2>

              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold">Basic Information</h3>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Description:</strong> {formData.description}</p>
                  <p><strong>Type:</strong> {formData.type}</p>
                </div>

                <div>
                  <h3 className="font-semibold">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.capabilities.map((cap, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Configuration</h3>
                  <p><strong>Model:</strong> {formData.model}</p>
                  <p><strong>Temp:</strong> {formData.temperature}</p>
                  <p><strong>Max Tokens:</strong> {formData.maxTokens}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={handleBack} className="border px-4 py-2 rounded flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
                  disabled={createAgentMutation.isPending}
                  onClick={handleFinish}
                >
                  {createAgentMutation.isPending ? 'Creating...' : 'Launch Agent'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
