import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveConfiguredApiBaseUrl } from './utils/apiBase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const getOpenAiProxyUrl = () => {
  const apiBase = resolveConfiguredApiBaseUrl();
  return apiBase ? `${apiBase}/openai-analyze` : '/openai-analyze';
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! OpenAI입니다. 무엇을 도와드릴까요?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      // OpenAI API 호출
      const response = await fetch(getOpenAiProxyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: inputValue })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.generated_text || '응답을 생성할 수 없었습니다.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-screen flex flex-col bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#1d3bb8] text-white p-6 shadow-lg">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <MessageCircle className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">OpenAI 채팅</h2>
            <p className="text-white/70 text-sm">AI와 자유롭게 대화하세요</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-6 py-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-white text-[#141414] border border-[#141414]/10'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-white/60' : 'text-[#141414]/50'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white text-[#141414] rounded-2xl px-6 py-4 border border-[#141414]/10">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#2563eb]" />
                <p className="text-sm text-[#141414]/60">응답을 생성중입니다...</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-3 flex items-start gap-3 max-w-2xl">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[#141414]/10 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
              disabled={loading}
              className="flex-1 rounded-xl border border-[#141414]/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:bg-[#141414]/5 disabled:text-[#141414]/50 text-[#141414]"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || loading}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                !inputValue.trim() || loading
                  ? 'bg-[#2563eb]/20 text-[#2563eb]/50 cursor-not-allowed'
                  : 'bg-[#2563eb] text-white hover:bg-[#1d3bb8] hover:scale-105 active:scale-95 cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
              전송
            </button>
          </div>
          <p className="text-xs text-[#141414]/50 mt-2">
            💡 팁: Shift + Enter로 여러 줄 입력 가능
          </p>
        </div>
      </div>
    </motion.div>
  );
}
