import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { askGeminiRealtime, QUICK_SUGGESTIONS } from '../utils/aiBotEngine';

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm **SignBot AI**, your calming, 24/7 assistant.\n\nAsk me **ANY question** — from 3D sign translations, deaf culture, and platform shortcuts to science, coding, and general knowledge! 🌿",
      action: null,
      provider: 'Groq AI ⚡',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  
  // API Key Settings Modal
  const activeKey = localStorage.getItem('groq_api_key') || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(activeKey);
  const [isKeySaved, setIsKeySaved] = useState(!!activeKey);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingId(null);
    }
  };

  const speakText = (text, messageId = null) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking && currentSpeakingId === messageId) {
      stopSpeech();
      return;
    }

    stopSpeech();

    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/###\s+/g, '')
      .replace(/[-•]\s+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
      setCurrentSpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setCurrentSpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
      setCurrentSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSend(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (customPrompt = null) => {
    const query = (customPrompt || inputText).trim();
    if (!query || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await askGeminiRealtime(query, history);

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        action: response.action,
        provider: response.provider || 'Groq AI ⚡',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      if (ttsEnabled) {
        speakText(response.text, botMsg.id);
      }

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I experienced a minor connection hiccup. Please ask again!",
          provider: 'Offline Recovery',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed.startsWith('gsk_')) {
      localStorage.setItem('groq_api_key', trimmed);
    } else {
      localStorage.setItem('gemini_api_key', trimmed);
    }
    setIsKeySaved(!!trimmed);
    setShowSettings(false);
  };

  // Modern Formatted Markdown Renderer
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx} style={{ color: '#7CA992', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={partIdx} style={{ backgroundColor: 'rgba(124, 169, 146, 0.15)', color: '#7CA992', padding: '2px 5px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{part.slice(1, -1)}</code>;
        }
        return part;
      });

      if (line.startsWith('### ')) {
        return <h4 key={lineIdx} style={{ margin: '10px 0 4px 0', color: '#7CA992', fontSize: '14.5px', fontWeight: '700' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={lineIdx} style={{ display: 'flex', gap: '8px', margin: '3px 0 3px 6px', alignItems: 'flex-start' }}>
            <span style={{ color: '#7CA992', fontWeight: 'bold' }}>•</span>
            <div style={{ flex: 1 }}>{formattedLine}</div>
          </div>
        );
      }
      return <p key={lineIdx} style={{ margin: lineIdx === 0 ? '0' : '5px 0 0 0', lineHeight: '1.5' }}>{formattedLine}</p>;
    });
  };

  return (
    <>
      {/* 1. Floating Trigger Button (Bottom-Right) */}
      <div 
        className="signverse-chat-trigger-container"
        style={{ 
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center'
        }}
      >
        <button
          onClick={() => {
            if (isOpen) stopSpeech();
            setIsOpen(!isOpen);
          }}
          aria-label="Open AI Assistant"
          className="signverse-chat-trigger-btn"
          style={{
            position: 'relative',
            background: isOpen ? '#242A27' : '#7CA992',
            color: isOpen ? '#E4EAE6' : '#191C1A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50px',
            padding: isOpen ? '12px 20px' : '10px 22px 10px 14px',
            fontSize: '14.5px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.25s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Avatar Icon */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: isOpen ? 'rgba(255, 255, 255, 0.08)' : '#191C1A',
            color: isOpen ? '#E4EAE6' : '#7CA992',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', flexShrink: 0
          }}>
            <span style={{ fontSize: '18px' }}>
              {isOpen ? '✕' : '🌿'}
            </span>
            
            <span style={{
              position: 'absolute', bottom: '-1px', right: '-1px', width: '10px', height: '10px',
              backgroundColor: '#7CA992', borderRadius: '50%', border: '2px solid #242A27'
            }} />
          </div>

          <div className="signverse-chat-trigger-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ letterSpacing: '0.3px' }}>
              {isOpen ? 'Close Assistant' : 'Ask SignAI 🌿'}
            </span>
            {!isOpen && (
              <span style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: '500' }}>
                Soothing Assistant
              </span>
            )}
          </div>

          {hasUnread && !isOpen && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px',
              backgroundColor: '#7CA992', borderRadius: '50%', border: '2px solid #191C1A'
            }} />
          )}
        </button>
      </div>

      {/* 2. Floating AI Chatbot Window */}
      {isOpen && (
        <div 
          className="signverse-chat-window"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: '#242A27',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999
          }}
        >
          {/* Header */}
          <div style={{
            background: '#191C1A',
            color: '#E4EAE6', padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px', height: '38px',
                borderRadius: '50%',
                background: 'rgba(124, 169, 146, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(124, 169, 146, 0.3)',
                fontSize: '18px', flexShrink: 0
              }}>
                🤖
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#E4EAE6' }}>SignBot AI</h3>
                  <span style={{ fontSize: '10px', backgroundColor: '#7CA992', color: '#191C1A', padding: '1px 6px', borderRadius: '6px', fontWeight: '800' }}>v2.5</span>
                </div>
                <span style={{ fontSize: '11px', color: '#9CAEA4', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '7px', height: '7px', backgroundColor: '#7CA992', borderRadius: '50%' }} />
                  {isKeySaved ? 'Groq / Gemini Active' : 'Online Mode'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="AI Settings & API Key"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#E4EAE6', fontSize: '14px', cursor: 'pointer', padding: '6px 8px' }}
              >
                ⚙️
              </button>

              <button
                onClick={() => {
                  if (ttsEnabled) {
                    stopSpeech();
                    setTtsEnabled(false);
                  } else {
                    setTtsEnabled(true);
                  }
                }}
                title={ttsEnabled ? 'Mute Auto Voice' : 'Enable Auto Voice Audio'}
                style={{
                  background: ttsEnabled ? '#7CA992' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: '8px',
                  color: ttsEnabled ? '#191C1A' : '#E4EAE6',
                  fontSize: '14px', cursor: 'pointer', padding: '6px 8px'
                }}
              >
                {ttsEnabled ? '🔊' : '🔇'}
              </button>

              <button
                onClick={() => {
                  stopSpeech();
                  setIsOpen(false);
                }}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#9CAEA4', fontSize: '14px', cursor: 'pointer', padding: '6px 8px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Settings Modal (API Key configuration) */}
          {showSettings && (
            <div style={{ backgroundColor: '#191C1A', padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#E4EAE6' }}>⚙️ Connected AI Provider</span>
                <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#9CAEA4' }}>Close</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="Paste Groq or Gemini Key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#242A27', color: '#E4EAE6', fontSize: '12px', outline: 'none' }}
                />
                <button
                  onClick={handleSaveApiKey}
                  style={{ background: '#7CA992', color: '#191C1A', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Quick Suggestion Pills */}
          <div style={{
            backgroundColor: '#191C1A', padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none'
          }}>
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion)}
                style={{
                  backgroundColor: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px',
                  padding: '5px 12px', fontSize: '11.5px', color: '#E4EAE6', cursor: 'pointer',
                  fontWeight: '600', flexShrink: 0
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#242A27',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div 
                  style={{
                    maxWidth: '88%', padding: '12px 16px', borderRadius: '14px',
                    background: msg.sender === 'user' ? '#7CA992' : '#191C1A',
                    color: msg.sender === 'user' ? '#191C1A' : '#E4EAE6',
                    fontSize: '13.5px', lineHeight: '1.5',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    wordBreak: 'break-word', position: 'relative'
                  }}
                >
                  {renderFormattedText(msg.text)}

                  {msg.action && (
                    <button
                      onClick={() => {
                        stopSpeech();
                        setIsOpen(false);
                        navigate(msg.action.route);
                      }}
                      style={{
                        marginTop: '10px', width: '100%', padding: '8px 12px',
                        background: 'rgba(124, 169, 146, 0.15)',
                        color: '#7CA992', border: '1px solid rgba(124, 169, 146, 0.3)',
                        borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <span>👉 {msg.action.label}</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '0 4px' }}>
                  <span style={{ fontSize: '10px', color: '#9CAEA4', fontWeight: '500' }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                backgroundColor: '#191C1A', borderRadius: '14px', width: 'fit-content',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>Thinking</span>
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#7CA992', borderRadius: '50%', animation: 'dotPulse 1.2s infinite' }} />
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#7CA992', borderRadius: '50%', animation: 'dotPulse 1.2s infinite 0.2s' }} />
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: '#7CA992', borderRadius: '50%', animation: 'dotPulse 1.2s infinite 0.4s' }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '12px 16px', backgroundColor: '#191C1A', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <button
              onClick={toggleVoiceInput}
              title="Speak Question"
              style={{
                backgroundColor: isListening ? '#ef4444' : '#242A27',
                color: isListening ? '#ffffff' : '#7CA992',
                border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '50%', width: '38px', height: '38px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0
              }}
            >
              🎙️
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now!" : "Ask ANY question..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#242A27', color: '#E4EAE6',
                fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              style={{
                background: inputText.trim() && !isTyping ? '#7CA992' : 'rgba(255, 255, 255, 0.1)',
                color: inputText.trim() && !isTyping ? '#191C1A' : '#9CAEA4',
                border: 'none', borderRadius: '50%', width: '38px', height: '38px',
                cursor: inputText.trim() && !isTyping ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', flexShrink: 0
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Embedded Animations */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
