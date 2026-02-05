<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for GPT-5.2-Codex and AI-powered features
    |
    */

    'enabled' => env('AI_ENABLED', false),
    'model' => env('AI_MODEL', 'gpt-5.2-codex'),
    'version' => env('AI_VERSION', '5.2'),

    /*
    |--------------------------------------------------------------------------
    | API Configuration
    |--------------------------------------------------------------------------
    */

    'api' => [
        'key' => env('AI_API_KEY'),
        'url' => env('AI_API_URL', 'https://api.openai.com/v1'),
        'timeout' => env('AI_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Model Configuration
    |--------------------------------------------------------------------------
    */

    'parameters' => [
        'max_tokens' => env('AI_MAX_TOKENS', 4096),
        'temperature' => env('AI_TEMPERATURE', 0.1),
        'top_p' => 1,
        'frequency_penalty' => 0,
        'presence_penalty' => 0,
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable or disable specific AI features
    |
    */

    'features' => [
        'medical_insights' => env('AI_MEDICAL_INSIGHTS', true),
        'drug_interactions' => env('AI_DRUG_INTERACTIONS', true),
        'clinical_decision_support' => env('AI_CLINICAL_DECISION_SUPPORT', true),
        'patient_analytics' => env('AI_PATIENT_ANALYTICS', true),
        'document_generation' => env('AI_DOCUMENT_GENERATION', true),
        'prescription_validation' => env('AI_PRESCRIPTION_VALIDATION', true),
        'coding_assistance' => env('AI_CODING_ASSISTANCE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Security & Compliance
    |--------------------------------------------------------------------------
    */

    'security' => [
        'hipaa_compliance' => env('AI_HIPAA_COMPLIANCE', true),
        'audit_logging' => env('AI_AUDIT_LOGGING', true),
        'data_encryption' => env('AI_DATA_ENCRYPTION', true),
        'data_retention_days' => env('AI_DATA_RETENTION_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */

    'limits' => [
        'requests_per_minute' => 60,
        'requests_per_hour' => 1000,
        'requests_per_day' => 10000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Prompts & Templates
    |--------------------------------------------------------------------------
    */

    'prompts' => [
        'medical_analysis' => 'As a GPT-5.2-Codex medical assistant, analyze the provided patient data and provide insights while maintaining HIPAA compliance. Always recommend consulting with healthcare professionals.',
        
        'drug_interaction' => 'Analyze potential drug interactions and contraindications for the given medications. Consider patient allergies and medical history. Provide severity levels and recommendations.',
        
        'diagnostic_support' => 'Review the symptoms, test results, and patient history to suggest possible diagnoses and recommended tests. Include probability assessments and reasoning.',
        
        'prescription_review' => 'Validate the prescription for dosage accuracy, drug interactions, and patient safety considerations. Provide detailed feedback and recommendations.',
        
        'patient_insights' => 'Generate comprehensive patient health insights based on medical history, current conditions, and treatment responses. Focus on trends and predictive analytics.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Model Capabilities
    |--------------------------------------------------------------------------
    */

    'capabilities' => [
        'context_window' => 32768,
        'supported_languages' => ['en', 'es', 'fr', 'de'],
        'medical_specialties' => [
            'general_medicine',
            'cardiology',
            'oncology',
            'neurology',
            'psychiatry',
            'pediatrics',
            'geriatrics',
            'emergency_medicine',
            'radiology',
            'pathology',
            'pharmacy',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring & Analytics
    |--------------------------------------------------------------------------
    */

    'monitoring' => [
        'track_usage' => true,
        'track_performance' => true,
        'track_errors' => true,
        'alert_on_failures' => true,
    ],
];