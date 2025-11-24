import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle, Plus, Menu, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function CompanyChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [apiUrl] = useState('https://shubham9905.pythonanywhere.com/api');
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistoryFromCookie();
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          text: 'Hi! 👋 I can help you research companies. Ask me about any company and I can provide detailed information about their operations, goals, and more.'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveToCookie = (sessionData) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
      const sessionExists = existingHistory.findIndex(s => s.session_id === sessionData.session_id);
      
      if (sessionExists === -1) {
        existingHistory.push(sessionData);
      } else {
        existingHistory[sessionExists] = sessionData;
      }
      
      localStorage.setItem('chatHistory', JSON.stringify(existingHistory));
      setChatHistory(existingHistory);
    } catch (err) {
      console.error('Error saving to cookie:', err);
    }
  };

  const loadChatHistoryFromCookie = () => {
    try {
      const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
      setChatHistory(history);
    } catch (err) {
      console.error('Error loading from cookie:', err);
    }
  };

  const loadSessionFromAPI = async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/session/${sessionId}/`);
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }
      
      const sessionData = await response.json();
      setSessionId(sessionData.id);
      setCurrentCompany(sessionData.company);
      
      const reconstructedMessages = [];
      sessionData.history.forEach((item, idx) => {
        reconstructedMessages.push({
          id: idx * 2,
          type: 'user',
          text: item.question
        });
        
        const answerData = typeof item.answer_json === 'string' 
          ? JSON.parse(item.answer_json) 
          : item.answer_json;
        
        reconstructedMessages.push({
          id: idx * 2 + 1,
          type: 'bot',
          data: {
            session_id: sessionData.id,
            topic: item.topic,
            company: item.company,
            answer: answerData,
            options: []
          }
        });
      });
      
      setMessages(reconstructedMessages);
      setSuggestedOptions([]);
    } catch (err) {
      setError(err.message);
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialQuery = async (query) => {
    if (!query.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: query
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSuggestedOptions([]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          clarifiers: ''
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
        setCurrentCompany(data.company);
        
        saveToCookie({
          session_id: data.session_id,
          company: data.company,
          created_at: new Date().toISOString()
        });
      }

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        data: data
      };
      setMessages(prev => [...prev, botMessage]);
      setSuggestedOptions(data.options || []);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: `Sorry, I encountered an error: ${err.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupOption = async (optionIndex) => {
    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    const optionText = suggestedOptions[optionIndex];
    
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: optionText
    };
    setMessages(prev => [...prev, userMessage]);
    setSuggestedOptions([]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/followup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          option_index: optionIndex + 1
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        data: data
      };
      setMessages(prev => [...prev, botMessage]);
      setSuggestedOptions(data.options || []);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: `Sorry, I encountered an error: ${err.message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFollowup = async (customQuery) => {
    if (!sessionId) {
      setError('Session not initialized');
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: customQuery
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSuggestedOptions([]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/followup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          custom: customQuery
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        data: data
      };
      setMessages(prev => [...prev, botMessage]);
      setSuggestedOptions(data.options || []);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: `Sorry, I encountered an error: ${err.message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (sessionId) {
      await handleCustomFollowup(input);
    } else {
      await handleInitialQuery(input);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const startNewSession = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        text: 'Hi! 👋 I can help you research companies. Ask me about any company and I can provide detailed information about their operations, goals, and more.'
      }
    ]);
    setSessionId(null);
    setInput('');
    setSuggestedOptions([]);
    setError(null);
    setCurrentCompany(null);
  };

  const deleteSession = (sessionIdToDelete) => {
    const updatedHistory = chatHistory.filter(s => s.session_id !== sessionIdToDelete);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    setChatHistory(updatedHistory);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const ExpandableSection = ({ title, icon, content, sectionKey, msgId }) => {
    const key = `${msgId}-${sectionKey}`;
    const isExpanded = expandedSections[key];

    return (
      <div className="mb-4 pb-4 border-b border-gray-800">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between text-gray-100 hover:text-cyan-400 transition-colors font-semibold text-sm mb-3"
        >
          <span>{icon} {title}</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isExpanded && <div className="text-gray-300 text-sm space-y-2">{content}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-3 rounded-lg transition-colors text-sm font-medium text-gray-100 border border-gray-700 hover:border-gray-600"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-gray-500 px-3 py-2 font-semibold uppercase tracking-wide flex items-center gap-2">
            <Clock size={14} />
            History
          </div>
          <div className="space-y-2">
            {chatHistory.map((session) => (
              <div
                key={session.session_id}
                className="group relative"
              >
                <button
                  onClick={() => loadSessionFromAPI(session.session_id)}
                  className={`w-full text-left p-3 rounded-lg transition-all text-sm ${
                    sessionId === session.session_id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100'
                  } border border-gray-700 hover:border-gray-600 truncate`}
                >
                  <div className="font-medium truncate">{session.company}</div>
                  <div className={`text-xs ${sessionId === session.session_id ? 'text-cyan-100' : 'text-gray-500'}`}>
                    {formatDate(session.created_at)}
                  </div>
                </button>
                <button
                  onClick={() => deleteSession(session.session_id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {/* Top Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-300"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-100">Company Research</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentCompany && (
              <div className="text-sm text-cyan-400 font-semibold px-3 py-1 bg-cyan-950 rounded-lg">
                {currentCompany}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-950 border-b border-red-900 text-red-300 px-4 py-2 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'bot' && msg.data ? (
                  <div className="w-full max-w-3xl">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-semibold">A</span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800">
                          <h3 className="font-bold text-lg mb-4 text-cyan-400">
                            {msg.data.company || 'Research Summary'}
                          </h3>

                          {/* Summary */}
                          {msg.data.answer.summary && (
                            <ExpandableSection
                              title="Summary"
                              icon="📋"
                              sectionKey="summary"
                              msgId={msg.id}
                              content={
                                <p className="text-gray-300 leading-relaxed">
                                  {msg.data.answer.summary}
                                </p>
                              }
                            />
                          )}

                          {/* Details */}
                          {msg.data.answer.details && (
                            <ExpandableSection
                              title="Details"
                              icon="📝"
                              sectionKey="details"
                              msgId={msg.id}
                              content={
                                <p className="text-gray-300 leading-relaxed">
                                  {msg.data.answer.details}
                                </p>
                              }
                            />
                          )}

                          {/* Domain Specific Analysis */}
                          {msg.data.answer.expanded_context?.domain_specific_analysis && (
                            <ExpandableSection
                              title="Domain Analysis"
                              icon="🔬"
                              sectionKey="domain"
                              msgId={msg.id}
                              content={
                                <p className="text-gray-300 leading-relaxed">
                                  {msg.data.answer.expanded_context.domain_specific_analysis}
                                </p>
                              }
                            />
                          )}

                          {/* Relevant Metrics */}
                          {msg.data.answer.expanded_context?.relevant_metrics && (
                            <ExpandableSection
                              title="Key Metrics"
                              icon="📊"
                              sectionKey="metrics"
                              msgId={msg.id}
                              content={
                                <ul className="space-y-1">
                                  {msg.data.answer.expanded_context.relevant_metrics.map((metric, idx) => (
                                    <li key={idx} className="text-gray-300 ml-3">• {metric}</li>
                                  ))}
                                </ul>
                              }
                            />
                          )}

                          {/* Risk Factors */}
                          {msg.data.answer.expanded_context?.risk_factors && (
                            <ExpandableSection
                              title="Risk Factors"
                              icon="⚠️"
                              sectionKey="risks"
                              msgId={msg.id}
                              content={
                                <ul className="space-y-1">
                                  {msg.data.answer.expanded_context.risk_factors.map((risk, idx) => (
                                    <li key={idx} className="text-gray-300 ml-3">• {risk}</li>
                                  ))}
                                </ul>
                              }
                            />
                          )}

                          {/* Opportunities */}
                          {msg.data.answer.expanded_context?.opportunities && (
                            <ExpandableSection
                              title="Opportunities"
                              icon="🚀"
                              sectionKey="opportunities"
                              msgId={msg.id}
                              content={
                                <ul className="space-y-1">
                                  {msg.data.answer.expanded_context.opportunities.map((opp, idx) => (
                                    <li key={idx} className="text-gray-300 ml-3">• {opp}</li>
                                  ))}
                                </ul>
                              }
                            />
                          )}

                          {/* Timeline */}
                          {msg.data.answer.expanded_context?.timeline_estimation && (
                            <ExpandableSection
                              title="Timeline"
                              icon="⏱️"
                              sectionKey="timeline"
                              msgId={msg.id}
                              content={
                                <p className="text-gray-300 leading-relaxed">
                                  {msg.data.answer.expanded_context.timeline_estimation}
                                </p>
                              }
                            />
                          )}

                          {/* Next Steps */}
                          {msg.data.answer.next_steps && (
                            <ExpandableSection
                              title="Next Steps"
                              icon="✅"
                              sectionKey="steps"
                              msgId={msg.id}
                              content={
                                <ul className="space-y-1">
                                  {msg.data.answer.next_steps.map((step, idx) => (
                                    <li key={idx} className="text-gray-300 ml-3">• {step}</li>
                                  ))}
                                </ul>
                              }
                            />
                          )}

                          {/* Resource Recommendations */}
                          {msg.data.answer.resource_recommendations && (
                            <ExpandableSection
                              title="Resources"
                              icon="🔗"
                              sectionKey="resources"
                              msgId={msg.id}
                              content={
                                <div className="space-y-3">
                                  {msg.data.answer.resource_recommendations.tools && (
                                    <div>
                                      <p className="font-semibold text-gray-200 text-xs uppercase tracking-wide mb-1">Tools</p>
                                      <ul className="space-y-1">
                                        {msg.data.answer.resource_recommendations.tools.map((tool, idx) => (
                                          <li key={idx} className="text-gray-300 ml-3 text-sm">• {tool}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {msg.data.answer.resource_recommendations.learning_paths && (
                                    <div>
                                      <p className="font-semibold text-gray-200 text-xs uppercase tracking-wide mb-1">Learning Paths</p>
                                      <ul className="space-y-1">
                                        {msg.data.answer.resource_recommendations.learning_paths.map((path, idx) => (
                                          <li key={idx} className="text-gray-300 ml-3 text-sm">• {path}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {msg.data.answer.resource_recommendations.communities && (
                                    <div>
                                      <p className="font-semibold text-gray-200 text-xs uppercase tracking-wide mb-1">Communities</p>
                                      <ul className="space-y-1">
                                        {msg.data.answer.resource_recommendations.communities.map((comm, idx) => (
                                          <li key={idx} className="text-gray-300 ml-3 text-sm">• {comm}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              }
                            />
                          )}

                          {/* Confidence Score */}
                          {msg.data.answer.confidence_score && (
                            <div className="mt-4 pt-4 border-t border-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Confidence</span>
                                <div className="flex-1 bg-gray-800 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                                    style={{ width: msg.data.answer.confidence_score }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-cyan-400">{msg.data.answer.confidence_score}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    <div className={`flex ${msg.type === 'user' ? 'flex-row-reverse' : 'gap-3'}`}>
                      {msg.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-semibold">U</span>
                        </div>
                      )}
                      <div className={`rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-blue-700 text-gray-100'
                          : 'bg-gray-900 text-gray-300 border border-gray-800'
                      } text-sm max-w-xl`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-cyan-400" />
                    <span className="text-sm text-gray-400">Researching...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Options */}
        {suggestedOptions.length > 0 && !loading && (
          <div className="px-4 py-4 border-t border-gray-800 bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Follow-up questions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFollowupOption(idx)}
                    className="text-left p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg transition-all text-sm border border-gray-700 hover:border-cyan-600 hover:border-opacity-50 font-medium"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={sessionId 
                  ? "Ask a follow-up question..." 
                  : "Ask about a company..."
                }
                className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 placeholder-gray-500 border border-gray-700 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}