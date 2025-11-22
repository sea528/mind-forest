import React from 'react';
import { Message, Sender } from '../types';
import { User, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Sender.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm mt-1 ${
          isUser ? 'bg-[#E0E8DF]' : 'bg-[#5D7356]'
        }`}>
          {isUser ? (
            <User size={16} className="text-[#5D7356]" />
          ) : (
            <Sparkles size={16} className="text-white" />
          )}
        </div>

        {/* Bubble */}
        <div className={`px-5 py-3 rounded-2xl shadow-sm text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words ${
          isUser 
            ? 'bg-[#E0E8DF] text-gray-800 rounded-tr-sm' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
        }`}>
          {message.text}
        </div>
      </div>
    </div>
  );
};