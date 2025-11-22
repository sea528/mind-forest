import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, LogOut, Leaf, Mic, MicOff } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MessageBubble } from './components/MessageBubble';
import { GeminiService } from './services/geminiService';
import { Message, Sender } from './types';
import { STORAGE_KEY, WELCOME_MESSAGE, APP_NAME } from './constants';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // We keep the service in a ref so it persists across renders but doesn't trigger re-renders
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef('');

  // Initialize logic
  useEffect(() => {
    // Changed to sessionStorage so the key is forgotten when the tab is closed
    const storedKey = sessionStorage.getItem(STORAGE_KEY);
    if (storedKey) {
      setApiKey(storedKey);
      geminiServiceRef.current = new GeminiService(storedKey);
    }
    
    // Initial Welcome Message
    setMessages([
      {
        id: 'welcome',
        role: Sender.MODEL,
        text: WELCOME_MESSAGE,
        timestamp: new Date(),
      },
    ]);

    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        // Append transcript to the original input stored when listening started
        const prefix = originalInputRef.current ? originalInputRef.current + ' ' : '';
        setInput(prefix + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSaveKey = (key: string) => {
    // Use sessionStorage
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    geminiServiceRef.current = new GeminiService(key);
  };

  const handleResetKey = () => {
    try {
      // 1. Stop listening if active
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }

      // 2. Clear storage completely
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear(); 

      // 3. Reset State Manually (Avoid reload to prevent 404s/errors)
      setApiKey(null);
      geminiServiceRef.current = null;
      setInput('');
      
      // Reset conversation to initial welcome message
      setMessages([
        {
          id: 'welcome',
          role: Sender.MODEL,
          text: WELCOME_MESSAGE,
          timestamp: new Date(),
        },
      ]);
      
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognitionRef.current) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome, Edge, Safari 등을 사용해주세요.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Save current input before starting dictation to allow appending
      originalInputRef.current = input;
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (!input.trim() || !geminiServiceRef.current || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Sender.USER,
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const responseText = await geminiServiceRef.current.sendMessage(userText, messages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Sender.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Sender.MODEL,
        text: "미안해, 연결이 잠시 끊겼네. 잠시 후에 다시 이야기해줄래?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F5F5F0] shadow-2xl overflow-hidden relative">
      
      {/* Header - High z-index for button accessibility */}
      <header className="bg-[#5D7356] text-white px-5 py-4 flex items-center justify-between shadow-md z-50 relative">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Leaf size={20} className="text-green-100" />
          <span>{APP_NAME}</span>
        </div>
        {apiKey && (
          <button 
            onClick={handleResetKey}
            type="button"
            className="text-xs bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer active:scale-95 select-none z-[100] shadow-sm border border-white/10"
            aria-label="로그아웃 및 대화 종료"
          >
            <LogOut size={14} />
            나가기
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full mb-6 animate-pulse">
            <div className="flex gap-2 max-w-[75%] items-center">
              <div className="w-8 h-8 rounded-full bg-[#5D7356] flex items-center justify-center opacity-70">
                 <RefreshCw size={14} className="text-white animate-spin" />
              </div>
              <div className="text-gray-400 text-sm pl-1">
                진심어린 답변을 준비중입니다...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4 border-t border-gray-100 z-40">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="고민을 털어놓으세요..."
            className="flex-1 bg-gray-50 text-gray-800 border border-gray-200 rounded-full px-5 py-3.5 pr-24 focus:outline-none focus:ring-2 focus:ring-[#5D7356] focus:border-transparent transition-all shadow-inner placeholder-gray-400 text-base"
            disabled={isLoading || !apiKey}
          />
          
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading || !apiKey}
            className={`absolute right-12 p-2 rounded-full transition-all transform active:scale-90 ${
              isListening 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-transparent text-gray-400 hover:text-[#5D7356]'
            }`}
            title="음성 입력"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !apiKey}
            className="absolute right-2 bg-[#5D7356] hover:bg-[#4A5D44] disabled:bg-gray-300 text-white p-2 rounded-full transition-all shadow-sm transform active:scale-90"
          >
            <Send size={18} />
          </button>
        </form>
      </footer>

      {/* Modal Overlay for API Key */}
      {!apiKey && <ApiKeyModal onSave={handleSaveKey} />}
      
    </div>
  );
};

export default App;