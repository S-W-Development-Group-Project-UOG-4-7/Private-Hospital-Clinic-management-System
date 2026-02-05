// AI Configuration for GPT-5.2-Codex Integration
declare const process: {
  env: {
    REACT_APP_AI_ENABLED?: string;
    REACT_APP_GPT_CODEX_VERSION?: string;
    REACT_APP_GPT_CODEX_ENABLED?: string;
    REACT_APP_AI_MODEL?: string;
    REACT_APP_AI_FEATURES?: string;
  };
};

export const AI_CONFIG = {
  enabled: process.env.REACT_APP_AI_ENABLED === 'true',
  model: process.env.REACT_APP_AI_MODEL || 'gpt-5.2-codex',
  version: process.env.REACT_APP_GPT_CODEX_VERSION || '5.2',
  codexEnabled: process.env.REACT_APP_GPT_CODEX_ENABLED === 'true',
  features: {
    codingAssistance: true,
    medicalInsights: true,
    patientAnalytics: true,
    drugInteractions: true,
    diagnosticSupport: true,
    prescriptionValidation: true,
    clinicalDecisionSupport: true,
    documentGeneration: true,
  },
  endpoints: {
    chat: '/api/ai/chat',
    medicalAnalysis: '/api/ai/medical/analysis',
    drugInteractions: '/api/ai/medical/drug-interactions',
    diagnostics: '/api/ai/medical/diagnostics',
    prescriptionReview: '/api/ai/medical/prescription-review',
    patientInsights: '/api/ai/patient/insights',
    documentGeneration: '/api/ai/documents/generate',
  },
  limits: {
    requestsPerMinute: 60,
    tokensPerRequest: 4096,
    contextWindow: 32768,
  },
  security: {
    encryptPatientData: true,
    auditLogging: true,
    complianceMode: 'HIPAA',
    dataRetention: '30days',
  }
};

export const AI_PROMPTS = {
  medicalInsight: `As GPT-5.2-Codex medical assistant, analyze the provided patient data and provide insights while maintaining HIPAA compliance.`,
  drugInteraction: `Analyze potential drug interactions and contraindications for the given medications. Consider patient allergies and medical history.`,
  diagnosticSupport: `Review the symptoms, test results, and patient history to suggest possible diagnoses and recommended tests.`,
  prescriptionReview: `Validate the prescription for dosage accuracy, drug interactions, and patient safety considerations.`,
};

export const isAIEnabled = () => AI_CONFIG.enabled && AI_CONFIG.codexEnabled;

export const getAIFeatureStatus = (feature: keyof typeof AI_CONFIG.features) => {
  return AI_CONFIG.enabled && AI_CONFIG.features[feature];
};

export const getAIEndpoint = (endpoint: keyof typeof AI_CONFIG.endpoints) => {
  return AI_CONFIG.endpoints[endpoint];
};

export default AI_CONFIG;