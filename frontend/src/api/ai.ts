import http from './http';
import { AI_CONFIG, AI_PROMPTS, isAIEnabled, getAIFeatureStatus } from '../config/ai';

export interface AIRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIMedicalAnalysis {
  patientId: string;
  symptoms: string[];
  testResults?: any;
  medicalHistory?: string;
  currentMedications?: string[];
}

export interface AIResponse<T = any> {
  success: boolean;
  data: T;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: string;
}

export interface DrugInteractionAnalysis {
  interactions: Array<{
    severity: 'low' | 'moderate' | 'high' | 'contraindicated';
    drugs: string[];
    description: string;
    recommendation: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: string;
    reaction: string;
  }>;
  contraindications: string[];
  recommendations: string[];
}

export interface DiagnosticSuggestion {
  condition: string;
  probability: number;
  reasoning: string;
  recommendedTests: string[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface PrescriptionValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  dosageRecommendations: string[];
  interactions: DrugInteractionAnalysis;
}

class AIService {
  private baseURL: string;
  private isEnabled: boolean;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.isEnabled = isAIEnabled();
  }

  async chat(request: AIRequest): Promise<AIResponse<string>> {
    if (!this.isEnabled) {
      throw new Error('AI features are not enabled');
    }

    const response = await http.post('/api/ai/chat', {
      ...request,
      model: request.model || AI_CONFIG.model,
      maxTokens: request.maxTokens || AI_CONFIG.limits.tokensPerRequest,
    });
    
    return response.data as AIResponse<string>;
  }

  async analyzeMedicalData(analysis: AIMedicalAnalysis): Promise<AIResponse<DiagnosticSuggestion[]>> {
    if (!getAIFeatureStatus('medicalInsights')) {
      throw new Error('Medical insights feature is not enabled');
    }

    const prompt = `${AI_PROMPTS.medicalInsight}
    
Patient Data:
- Symptoms: ${analysis.symptoms.join(', ')}
- Medical History: ${analysis.medicalHistory || 'None provided'}
- Current Medications: ${analysis.currentMedications?.join(', ') || 'None'}
- Test Results: ${JSON.stringify(analysis.testResults) || 'None available'}

Please provide diagnostic insights and recommendations.`;

    const response = await http.post('/api/ai/medical/analysis', {
      prompt,
      patientId: analysis.patientId,
      context: analysis,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<DiagnosticSuggestion[]>;
  }

  async checkDrugInteractions(medications: string[], allergies: string[] = []): Promise<AIResponse<DrugInteractionAnalysis>> {
    if (!getAIFeatureStatus('drugInteractions')) {
      throw new Error('Drug interaction feature is not enabled');
    }

    const prompt = `${AI_PROMPTS.drugInteraction}
    
Medications: ${medications.join(', ')}
Known Allergies: ${allergies.join(', ')}

Please analyze for interactions, contraindications, and safety concerns.`;

    const response = await http.post('/api/ai/medical/drug-interactions', {
      prompt,
      medications,
      allergies,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<DrugInteractionAnalysis>;
  }

  async validatePrescription(prescription: any): Promise<AIResponse<PrescriptionValidation>> {
    if (!getAIFeatureStatus('prescriptionValidation')) {
      throw new Error('Prescription validation feature is not enabled');
    }

    const prompt = `${AI_PROMPTS.prescriptionReview}
    
Prescription Details:
${JSON.stringify(prescription, null, 2)}

Please validate dosage, interactions, and patient safety.`;

    const response = await http.post('/api/ai/medical/prescription-review', {
      prompt,
      prescription,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<PrescriptionValidation>;
  }

  async generatePatientInsights(patientId: string): Promise<AIResponse<any>> {
    if (!getAIFeatureStatus('patientAnalytics')) {
      throw new Error('Patient analytics feature is not enabled');
    }

    const response = await http.post(`/api/ai/patient/insights`, {
      patientId,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<any>;
  }

  async generateDocument(type: string, data: any): Promise<AIResponse<string>> {
    if (!getAIFeatureStatus('documentGeneration')) {
      throw new Error('Document generation feature is not enabled');
    }

    const response = await http.post('/api/ai/documents/generate', {
      type,
      data,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<string>;
  }

  async getClinicalDecisionSupport(symptoms: string[], history: string): Promise<AIResponse<DiagnosticSuggestion[]>> {
    if (!getAIFeatureStatus('clinicalDecisionSupport')) {
      throw new Error('Clinical decision support feature is not enabled');
    }

    const prompt = `${AI_PROMPTS.diagnosticSupport}
    
Symptoms: ${symptoms.join(', ')}
Medical History: ${history}

Please provide clinical decision support and diagnostic suggestions.`;

    const response = await http.post('/api/ai/medical/diagnostics', {
      prompt,
      symptoms,
      history,
      model: AI_CONFIG.model,
    });

    return response.data as AIResponse<DiagnosticSuggestion[]>;
  }

  // Utility methods
  isFeatureEnabled(feature: keyof typeof AI_CONFIG.features): boolean {
    return getAIFeatureStatus(feature);
  }

  getModelInfo() {
    return {
      model: AI_CONFIG.model,
      version: AI_CONFIG.version,
      enabled: this.isEnabled,
      features: AI_CONFIG.features,
    };
  }

  getRateLimits() {
    return AI_CONFIG.limits;
  }
}

export const aiService = new AIService();
export default aiService;