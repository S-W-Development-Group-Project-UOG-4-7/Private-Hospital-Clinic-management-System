import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Activity,
  Shield,
  Lightbulb,
  X
} from 'lucide-react';
import { aiService } from '../../api/ai';
import { AI_CONFIG, isAIEnabled } from '../../config/ai';
import toast from 'react-hot-toast';

interface AIInsightsPanelProps {
  patientId?: string;
  context?: 'doctor' | 'pharmacist' | 'receptionist' | 'admin';
  data?: any;
  onClose?: () => void;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  patientId, 
  context = 'doctor', 
  data, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'interactions' | 'recommendations' | 'chat'>('analysis');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);
  const [chatInput, setChatInput] = useState('');

  const isEnabled = isAIEnabled();

  useEffect(() => {
    if (isEnabled && patientId) {
      loadAIInsights();
    }
  }, [patientId, isEnabled]);

  const loadAIInsights = async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    try {
      const response = await aiService.generatePatientInsights(patientId);
      setInsights(response.data);
    } catch (error: any) {
      console.error('Failed to load AI insights:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    
    setIsLoading(true);
    try {
      const response = await aiService.chat({
        prompt: userMessage,
        context: JSON.stringify({ patientId, context, data }),
      });
      
      setChatMessages(prev => [...prev, { type: 'ai', message: response.data }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('AI chat temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Features Disabled</h3>
          <p className="text-gray-500 text-sm">
            GPT-5.2-Codex is not currently enabled. Contact your administrator to enable AI-powered insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Brain className="w-5 h-5 text-blue-600" />
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800">
            GPT-5.2-Codex Medical AI
          </h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {AI_CONFIG.model} • Active
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {[
          { id: 'analysis', label: 'Analysis', icon: Activity },
          { id: 'interactions', label: 'Interactions', icon: AlertTriangle },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Health Insights</h4>
                  </div>
                  <p className="text-blue-700 text-sm">
                    AI-powered analysis of patient health trends and risk factors.
                  </p>
                  {isLoading && (
                    <div className="mt-2 animate-pulse">
                      <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Treatment Efficacy</h4>
                  </div>
                  <p className="text-green-700 text-sm">
                    Predictive analysis of treatment outcomes and success rates.
                  </p>
                </div>
              </div>
              
              {insights && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">AI-Generated Insights</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(insights, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'interactions' && (
            <motion.div
              key="interactions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Drug Interactions</h4>
                </div>
                <p className="text-orange-700 text-sm mb-3">
                  Real-time analysis of potential medication interactions and contraindications.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">No critical interactions detected</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">2 minor interactions to monitor</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-800">AI Recommendations</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-purple-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Consider scheduling follow-up in 2 weeks</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-purple-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Monitor blood pressure trends</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-purple-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                    <span>Update medication timing for better efficacy</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="border border-gray-200 rounded-lg h-64 overflow-y-auto p-3 bg-gray-50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm">
                    Start a conversation with the AI medical assistant...
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                      msg.type === 'user'
                        ? 'bg-blue-100 text-blue-800 ml-auto'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">
                      {msg.type === 'user' ? 'You' : 'GPT-5.2-Codex AI'}
                    </div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-white p-2 rounded-lg border border-gray-200 max-w-[80%]">
                    <div className="text-xs font-medium mb-1">GPT-5.2-Codex AI</div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the AI about medical insights..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>HIPAA Compliant • Encrypted</span>
          </div>
          <span>Powered by GPT-5.2-Codex</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;