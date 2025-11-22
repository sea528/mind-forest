import React, { useState } from 'react';
import { Key, Lock } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length < 10) {
      setError('유효한 Google Gemini API Key를 입력해주세요.');
      return;
    }
    onSave(inputKey.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#5D7356] rounded-full flex items-center justify-center mb-4 shadow-md">
            <Key className="text-white w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">입장하기</h2>
          <p className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
            Google Gemini API Key가 필요합니다.<br />
            브라우저를 닫으면 키와 대화는 즉시 삭제됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="AI Studio API Key 입력"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5D7356] focus:border-transparent outline-none transition-all bg-gray-50 text-sm"
              autoFocus
            />
          </div>
          
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#5D7356] hover:bg-[#4A5D44] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98]"
          >
            상담 시작
          </button>
          
          <div className="mt-4 text-xs text-center text-gray-400">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-[#5D7356]">
              API Key 발급받기
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};