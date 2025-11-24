import { Bot, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-primary-light text-sm">Powered by Gemini & Tavily</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Version 5</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;