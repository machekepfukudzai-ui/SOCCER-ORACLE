
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';

export const OracleChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, parts: {text: string}[]}[]>([
    { role: 'model', parts: [{ text: "Hi! I'm the MatchOracle Assistant. Ask me anything about upcoming matches, team stats, or predictions." }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: m.parts }));
      const responseText = await sendChatMessage(input, history);
      const modelMsg = { role: 'model', parts: [{ text: responseText }] };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I couldn't process that." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                 <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-bold text-white">Oracle Assistant</span>
            </div>
            <button onClick={toggleChat} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/95">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about a match..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 ${
          isOpen ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};
