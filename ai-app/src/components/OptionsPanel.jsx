import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const OptionsPanel = ({ 
  options, 
  onOptionSelect, 
  onCustomFollowUp, 
  topic, 
  company,
  loading 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customQuestion, setCustomQuestion] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      onCustomFollowUp(customQuestion);
      setCustomQuestion('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          <span>Generating smart options...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-gray-800">Smart Follow-ups</h3>
            <p className="text-sm text-gray-500">
              {company ? `About ${company}` : `Topic: ${topic}`}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* Dynamic Options */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Suggested Questions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onOptionSelect(option)}
                  className="option-button"
                  disabled={loading}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Ask Your Own Question</h4>
            <form onSubmit={handleCustomSubmit} className="flex space-x-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your follow-up question..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!customQuestion.trim() || loading}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Ask
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsPanel;