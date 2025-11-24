import { User, Bot } from 'lucide-react';

const Message = ({ message, isUser }) => {
  const formatContent = (content) => {
    if (typeof content === 'object') {
      return (
        <div className="space-y-3">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="border-l-4 border-primary pl-3">
              <strong className="text-primary capitalize">{key.replace('_', ' ')}:</strong>
              {Array.isArray(value) ? (
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {value.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm">{String(value)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className={`flex items-start space-x-3 mb-6 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={isUser ? 'message-user' : 'message-bot'}>
        {formatContent(message)}
      </div>
    </div>
  );
};

export default Message;