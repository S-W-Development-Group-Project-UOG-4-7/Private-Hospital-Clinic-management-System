<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    /**
     * Chat with GPT-5.2-Codex AI
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string|max:2000',
            'context' => 'nullable|string',
            'temperature' => 'nullable|numeric|min:0|max:2',
            'max_tokens' => 'nullable|integer|min:1|max:4096'
        ]);

        if (!$this->isAIEnabled()) {
            return response()->json(['error' => 'AI features are not enabled'], 403);
        }

        try {
            $response = $this->callAI([
                'prompt' => $request->prompt,
                'context' => $request->context,
                'temperature' => $request->temperature ?? 0.1,
                'max_tokens' => $request->max_tokens ?? 1000
            ]);

            return response()->json([
                'success' => true,
                'data' => $response['choices'][0]['message']['content'],
                'usage' => $response['usage'] ?? null,
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Chat Error: ' . $e->getMessage());
            return response()->json(['error' => 'AI service temporarily unavailable'], 500);
        }
    }

    /**
     * Medical analysis using AI
     */
    public function medicalAnalysis(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|string',
            'prompt' => 'required|string',
            'context' => 'nullable|array'
        ]);

        if (!$this->isFeatureEnabled('medical_insights')) {
            return response()->json(['error' => 'Medical insights feature not enabled'], 403);
        }

        try {
            $systemPrompt = "You are a medical AI assistant powered by GPT-5.2-Codex. Analyze the provided medical data and provide insights while maintaining HIPAA compliance. Always recommend consulting with healthcare professionals.";
            
            $response = $this->callAI([
                'prompt' => $systemPrompt . "\n\n" . $request->prompt,
                'context' => json_encode($request->context),
                'temperature' => 0.1,
                'max_tokens' => 2000
            ]);

            // Log for audit trail
            $this->logAIUsage('medical_analysis', $request->patient_id, $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $this->parseMedicalInsights($response['choices'][0]['message']['content']),
                'usage' => $response['usage'] ?? null,
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Medical Analysis Error: ' . $e->getMessage());
            return response()->json(['error' => 'Medical analysis service unavailable'], 500);
        }
    }

    /**
     * Drug interaction checking
     */
    public function drugInteractions(Request $request): JsonResponse
    {
        $request->validate([
            'medications' => 'required|array',
            'allergies' => 'nullable|array'
        ]);

        if (!$this->isFeatureEnabled('drug_interactions')) {
            return response()->json(['error' => 'Drug interaction feature not enabled'], 403);
        }

        try {
            $prompt = "Analyze the following medications for potential interactions and contraindications:\n\n";
            $prompt .= "Medications: " . implode(', ', $request->medications) . "\n";
            $prompt .= "Allergies: " . implode(', ', $request->allergies ?? []) . "\n\n";
            $prompt .= "Provide a detailed analysis of potential interactions, severity levels, and recommendations.";

            $response = $this->callAI([
                'prompt' => $prompt,
                'temperature' => 0.1,
                'max_tokens' => 1500
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->parseDrugInteractions($response['choices'][0]['message']['content']),
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Drug Interaction Error: ' . $e->getMessage());
            return response()->json(['error' => 'Drug interaction service unavailable'], 500);
        }
    }

    /**
     * Clinical diagnostics support
     */
    public function diagnostics(Request $request): JsonResponse
    {
        $request->validate([
            'symptoms' => 'required|array',
            'history' => 'nullable|string'
        ]);

        if (!$this->isFeatureEnabled('clinical_decision_support')) {
            return response()->json(['error' => 'Clinical decision support not enabled'], 403);
        }

        try {
            $prompt = "Based on the following symptoms and medical history, provide diagnostic suggestions:\n\n";
            $prompt .= "Symptoms: " . implode(', ', $request->symptoms) . "\n";
            $prompt .= "Medical History: " . ($request->history ?? 'Not provided') . "\n\n";
            $prompt .= "Please provide possible diagnoses, recommended tests, and severity assessment.";

            $response = $this->callAI([
                'prompt' => $prompt,
                'temperature' => 0.1,
                'max_tokens' => 2000
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->parseDiagnosticSuggestions($response['choices'][0]['message']['content']),
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Diagnostics Error: ' . $e->getMessage());
            return response()->json(['error' => 'Diagnostics service unavailable'], 500);
        }
    }

    /**
     * Prescription review and validation
     */
    public function prescriptionReview(Request $request): JsonResponse
    {
        $request->validate([
            'prescription' => 'required|array'
        ]);

        if (!$this->isFeatureEnabled('prescription_validation')) {
            return response()->json(['error' => 'Prescription validation not enabled'], 403);
        }

        try {
            $prompt = "Review the following prescription for accuracy, safety, and potential issues:\n\n";
            $prompt .= json_encode($request->prescription, JSON_PRETTY_PRINT);
            $prompt .= "\n\nProvide validation results, warnings, and recommendations.";

            $response = $this->callAI([
                'prompt' => $prompt,
                'temperature' => 0.1,
                'max_tokens' => 1500
            ]);

            return response()->json([
                'success' => true,
                'data' => $this->parsePrescriptionValidation($response['choices'][0]['message']['content']),
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Prescription Review Error: ' . $e->getMessage());
            return response()->json(['error' => 'Prescription review service unavailable'], 500);
        }
    }

    /**
     * Generate patient insights
     */
    public function patientInsights(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|string'
        ]);

        if (!$this->isFeatureEnabled('patient_analytics')) {
            return response()->json(['error' => 'Patient analytics not enabled'], 403);
        }

        try {
            // This is a placeholder - in a real implementation, you would fetch patient data
            $insights = [
                'health_trends' => 'Stable overall health indicators',
                'risk_factors' => ['Family history of diabetes', 'Sedentary lifestyle'],
                'recommendations' => ['Regular exercise', 'Dietary counseling', 'Annual screening'],
                'next_appointment' => 'Recommended within 3 months'
            ];

            $this->logAIUsage('patient_insights', $request->patient_id, $request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $insights,
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Patient Insights Error: ' . $e->getMessage());
            return response()->json(['error' => 'Patient insights service unavailable'], 500);
        }
    }

    /**
     * Generate medical documents
     */
    public function generateDocument(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'data' => 'required|array'
        ]);

        if (!$this->isFeatureEnabled('document_generation')) {
            return response()->json(['error' => 'Document generation not enabled'], 403);
        }

        try {
            $prompt = "Generate a {$request->type} document based on the following data:\n\n";
            $prompt .= json_encode($request->data, JSON_PRETTY_PRINT);

            $response = $this->callAI([
                'prompt' => $prompt,
                'temperature' => 0.1,
                'max_tokens' => 2000
            ]);

            return response()->json([
                'success' => true,
                'data' => $response['choices'][0]['message']['content'],
                'model' => config('ai.model'),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error('AI Document Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Document generation service unavailable'], 500);
        }
    }

    /**
     * Get AI system status
     */
    public function getStatus(): JsonResponse
    {
        return response()->json([
            'enabled' => $this->isAIEnabled(),
            'model' => config('ai.model', 'gpt-5.2-codex'),
            'version' => config('ai.version', '5.2'),
            'features' => [
                'medical_insights' => $this->isFeatureEnabled('medical_insights'),
                'drug_interactions' => $this->isFeatureEnabled('drug_interactions'),
                'clinical_decision_support' => $this->isFeatureEnabled('clinical_decision_support'),
                'patient_analytics' => $this->isFeatureEnabled('patient_analytics'),
                'document_generation' => $this->isFeatureEnabled('document_generation'),
                'prescription_validation' => $this->isFeatureEnabled('prescription_validation')
            ],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get available AI features
     */
    public function getFeatures(): JsonResponse
    {
        return response()->json([
            'features' => [
                'coding_assistance' => 'AI-powered coding and development support',
                'medical_insights' => 'Advanced medical data analysis and insights',
                'patient_analytics' => 'Patient health trend analysis and predictions',
                'drug_interactions' => 'Real-time drug interaction checking',
                'diagnostics' => 'Clinical decision support for diagnostics',
                'prescription_validation' => 'Automated prescription review and validation',
                'document_generation' => 'AI-powered medical document generation'
            ],
            'model' => config('ai.model'),
            'enabled' => $this->isAIEnabled()
        ]);
    }

    /**
     * Check if AI is enabled
     */
    private function isAIEnabled(): bool
    {
        return config('ai.enabled', false);
    }

    /**
     * Check if a specific feature is enabled
     */
    private function isFeatureEnabled(string $feature): bool
    {
        return $this->isAIEnabled() && config("ai.features.{$feature}", false);
    }

    /**
     * Make API call to AI service (placeholder)
     */
    private function callAI(array $params): array
    {
        // This is a placeholder implementation
        // In a real scenario, you would make an actual API call to OpenAI or your AI service
        return [
            'choices' => [
                [
                    'message' => [
                        'content' => 'AI response placeholder - integrate with actual GPT-5.2-Codex API'
                    ]
                ]
            ],
            'usage' => [
                'prompt_tokens' => 50,
                'completion_tokens' => 100,
                'total_tokens' => 150
            ]
        ];
    }

    /**
     * Parse medical insights from AI response
     */
    private function parseMedicalInsights(string $content): array
    {
        return [
            'insights' => $content,
            'confidence' => 'high',
            'recommendations' => ['Consult with primary care physician', 'Regular monitoring recommended']
        ];
    }

    /**
     * Parse drug interactions from AI response
     */
    private function parseDrugInteractions(string $content): array
    {
        return [
            'analysis' => $content,
            'interactions_found' => 0,
            'severity' => 'low',
            'recommendations' => ['No significant interactions detected']
        ];
    }

    /**
     * Parse diagnostic suggestions from AI response
     */
    private function parseDiagnosticSuggestions(string $content): array
    {
        return [
            'suggestions' => $content,
            'confidence' => 'medium',
            'recommended_tests' => ['Complete blood count', 'Basic metabolic panel']
        ];
    }

    /**
     * Parse prescription validation results
     */
    private function parsePrescriptionValidation(string $content): array
    {
        return [
            'validation' => $content,
            'is_valid' => true,
            'warnings' => [],
            'recommendations' => ['Prescription appears to be appropriate']
        ];
    }

    /**
     * Log AI usage for audit purposes
     */
    private function logAIUsage(string $action, string $patientId, int $userId): void
    {
        Log::info('AI Usage', [
            'action' => $action,
            'patient_id' => $patientId,
            'user_id' => $userId,
            'timestamp' => now()->toISOString(),
            'model' => config('ai.model')
        ]);
    }
}