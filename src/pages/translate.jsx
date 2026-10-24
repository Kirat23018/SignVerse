import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import modulesData from '../modulesData.json';
import { getSubscriptionStatus, deductCredits } from '../utils/subscriptionManager';
import { playSiGMLFast } from '../utils/sigmlService';

export default function Translate() {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAction, setCurrentAction] = useState('Type a sentence or click Voice to Sign...');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.5); // Default to Slow
  const [autoTranslateVoice, setAutoTranslateVoice] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());
  const [creditAlert, setCreditAlert] = useState('');
  
  // Live Gloss and Sentence Sequence tracking
  const [activeGlossItem, setActiveGlossItem] = useState(null);
  const [activeTokenIndex, setActiveTokenIndex] = useState(-1);
  const [activeSequence, setActiveSequence] = useState([]);
  const [liveCWASAGloss, setLiveCWASAGloss] = useState('');
  const [liveCWASASF, setLiveCWASASF] = useState('');

  const iframeRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Listen for real-time CWASA gloss and frame broadcasts
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveCWASAGloss(e.data.gloss);
        if (e.data.signFrame) setLiveCWASASF(e.data.signFrame);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  // Check Web Speech API support & sync subscription
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
    setSubStatus(getSubscriptionStatus());
  }, []);

  // 1. High-Performance Flattened & Fast Lookup Hash Map for O(1) Dictionary Search
  const { lookupMap } = useMemo(() => {
    const list = [];
    const map = new Map();

    for (const category in modulesData) {
      if (Array.isArray(modulesData[category])) {
        modulesData[category].forEach(item => {
          if (item.type !== 'video' && item.label && item.file) {
            list.push(item);
            const key = item.label.toLowerCase().trim();
            const path = item.file.includes('DictionarySigns') || item.file.includes('SignFiles')
              ? `${item.file}.sigml`
              : `SignFiles/${item.file}.sigml`;
            map.set(key, { label: item.label, path: path });
          }
        });
      }
    }
    return { allWords: list, lookupMap: map };
  }, []);

  // 2. Comprehensive Multi-Word Phrases & Synonym Expansion Dictionary
  const multiWordPhrases = [
    { phrase: 'thank you', target: 'thank you' },
    { phrase: 'good morning', target: 'good morning' },
    { phrase: 'good night', target: 'good night' },
    { phrase: 'how are you', target: 'how are you' },
    { phrase: 'see you', target: 'goodbye' },
    { phrase: 'i love you', target: 'love' },
    { phrase: 'ice cream', target: 'ice cream' }
  ];

  const synonymMap = {
    'crucial': 'important',
    'vital': 'important',
    'dad': 'father',
    'papa': 'father',
    'daddy': 'father',
    'mom': 'mother',
    'mummy': 'mother',
    'mommy': 'mother',
    'bro': 'brother',
    'sis': 'sister',
    'glad': 'happy',
    'joyful': 'happy',
    'sadness': 'sad',
    'unhappy': 'sad',
    'kids': 'children',
    'child': 'children',
    'huge': 'big',
    'large': 'big',
    'tiny': 'small',
    'little': 'small',
    'quick': 'fast',
    'rapid': 'fast',
    'speak': 'talk',
    'tell': 'talk',
    'hi': 'hello',
    'hey': 'hello',
    'namaste': 'hello',
    'bye': 'goodbye',
    'thanks': 'thank you',
    'thx': 'thank you',
    'pls': 'please',
    'sorry': 'sorry',
    'apologize': 'sorry',
    'yes': 'yes',
    'yeah': 'yes',
    'yep': 'yes',
    'no': 'no',
    'nope': 'no',
    'drink': 'water',
    'eat': 'food',
    'meal': 'food'
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 3. High-Speed Multi-Tier Translation Engine
  const handleTranslate = async (textOverride) => {
    const textToProcess = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!textToProcess || isPlaying) return;

    // Check & Deduct Credits for Translation
    const creditRes = deductCredits(1);
    if (!creditRes.success) {
      setCreditAlert(creditRes.message);
      return;
    }
    setCreditAlert('');
    setSubStatus(getSubscriptionStatus());
    
    setIsPlaying(true);
    let rawText = textToProcess.toLowerCase();
    const playSequence = [];

    // Step A: Multi-word phrase matching check
    for (const item of multiWordPhrases) {
      if (rawText.includes(item.phrase)) {
        if (lookupMap.has(item.target)) {
          const signData = lookupMap.get(item.target);
          playSequence.push({ label: signData.label, path: signData.path, type: 'word' });
          rawText = rawText.replace(item.phrase, ' ');
        }
      }
    }

    // Step B: Tokenize individual words
    const words = rawText.split(/\s+/).filter(Boolean);

    for (let word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, ''); 
      if (!cleanWord) continue;

      let match = lookupMap.get(cleanWord);
      
      // Synonym resolution
      if (!match && synonymMap[cleanWord]) {
        match = lookupMap.get(synonymMap[cleanWord]);
      }

      if (match) {
        playSequence.push({ label: match.label, path: match.path, type: 'word' });
      } else {
        // High-Speed Tokenization (Letter by letter fingerspelling fallback)
        for (let char of cleanWord) {
          if (/[a-z]/.test(char)) {
            playSequence.push({ 
              label: `Letter: ${char.toUpperCase()}`, 
              path: `SignFiles/${char.toUpperCase()}.sigml`, 
              type: 'letter' 
            });
          }
        }
      }
    }

    if (playSequence.length === 0) {
      setCurrentAction('No valid signs found for the input.');
      setIsPlaying(false);
      return;
    }

    // Step C: Play sequence sequentially with zero latency & live gloss tracking
    setActiveSequence(playSequence);
    for (let i = 0; i < playSequence.length; i++) {
      const item = playSequence[i];
      setActiveTokenIndex(i);
      setActiveGlossItem(item);
      setCurrentAction(`Playing [${i + 1}/${playSequence.length}]: ${item.label}`);
      
      if (iframeRef.current) {
        playSiGMLFast(iframeRef.current, item.path, speedMultiplier);
      }

      // Base delay per gesture scaled by speed multiplier
      const baseDelay = item.type === 'letter' ? 1400 : 2600; 
      await sleep(baseDelay * speedMultiplier);
    }

    setCurrentAction('✨ Translation Complete!');
    setIsPlaying(false);
  };

  // 4. Voice-to-Text & Voice-to-Sign Recognition Handler
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentAction('🎙️ Listening... Speak clearly into your microphone');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const recognizedText = currentFinal || interimTranscript;
        if (recognizedText) {
          setInputText(recognizedText);
          if (currentFinal) {
            finalTranscriptRef.current = currentFinal;
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setCurrentAction('❌ Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          setCurrentAction('⚠️ No speech detected. Please click the mic and try again.');
        } else {
          setCurrentAction(`⚠️ Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalText = finalTranscriptRef.current || inputText;
        if (finalText.trim()) {
          setCurrentAction(`🗣️ Voice recognized: "${finalText.trim()}"`);
          if (autoTranslateVoice) {
            setTimeout(() => {
              handleTranslate(finalText.trim());
            }, 500);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div 
      className="signverse-split-container"
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}
    >
      
      {/* Left Panel: Text & Voice Input & Controls */}
      <div 
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '26px 30px',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '2px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Header with Credits & Plan Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ color: '#0f172a', margin: 0, fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>AI Text & Voice to Sign</span>
              <span style={{ fontSize: '11.5px', backgroundColor: '#e0f2fe', color: '#004080', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>
                Voice 🎙️
              </span>
            </h2>
          </div>

          <Link to="/pricing" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '14px', fontWeight: '700', border: '1px solid #cbd5e1' }}>
              {subStatus.isPaidPlan ? '✨ Pro (Unlimited)' : `🪙 ${subStatus.credits} Credits • ${subStatus.trialDaysRemaining}d Trial`}
            </span>
          </Link>
        </div>
        
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px', lineHeight: '1.4' }}>
          Speak or type sentences. High-speed $O(1)$ offline matcher animates 3D avatars instantly!
        </p>

        {creditAlert && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '700', border: '1px solid #fca5a5' }}>
            ⚠️ {creditAlert} <Link to="/pricing" style={{ color: '#004080', textDecoration: 'underline', marginLeft: '6px' }}>Upgrade to Pro</Link>
          </div>
        )}

        {/* Voice Recognition Action Card */}
        <div style={{ 
          backgroundColor: isListening ? '#fff3e0' : '#f8fafc', 
          border: isListening ? '2px solid #ff9800' : '1px solid #e2e8f0', 
          borderRadius: '12px', padding: '12px 14px', marginBottom: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleVoiceRecognition}
              disabled={isPlaying}
              style={{
                backgroundColor: isListening ? '#ef4444' : '#004080',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '25px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: isPlaying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(0,0,0,0.1)',
                animation: isListening ? 'pulse-mic 1.2s infinite' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? '⏹️ Stop Listening' : '🎙️ Speak (Voice to Sign)'}
            </button>

            {isListening && (
              <span style={{ color: '#ea580c', fontSize: '12.5px', fontWeight: '700', animation: 'fade 1.5s infinite' }}>
                Listening live...
              </span>
            )}
          </div>

          {/* Auto Translate Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
            <input 
              type="checkbox" 
              checked={autoTranslateVoice} 
              onChange={(e) => setAutoTranslateVoice(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            Auto-translate after speaking
          </label>
        </div>
        
        {/* Text Area with Clear Button */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <textarea 
            placeholder={isListening ? "Listening to your voice... speak now!" : "Enter text here or speak using the mic above (e.g., Hello father it is crucial)..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', height: '110px', padding: '12px 36px 12px 12px', borderRadius: '10px', 
              border: isListening ? '2px solid #ff9800' : '1.5px solid #cbd5e1', boxSizing: 'border-box', 
              fontSize: '14.5px', resize: 'none', outline: 'none', fontFamily: 'inherit',
              color: '#0f172a', backgroundColor: '#ffffff',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#004080'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />

          {inputText && (
            <button 
              onClick={() => setInputText('')}
              title="Clear text"
              style={{
                position: 'absolute', right: '12px', top: '12px', background: 'transparent',
                border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer', padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Interactive High-Contrast Speed Controller Card */}
        <div style={{
          marginBottom: '16px', padding: '12px 14px', backgroundColor: '#f1f5f9',
          borderRadius: '12px', border: '1.5px solid #cbd5e1',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⏱️ Speed:</span>
              <span style={{ 
                fontSize: '11px', 
                backgroundColor: speedMultiplier === 1.5 ? '#dcfce7' : speedMultiplier <= 0.8 ? '#fef3c7' : '#e0e7ff',
                color: speedMultiplier === 1.5 ? '#14532d' : speedMultiplier <= 0.8 ? '#78350f' : '#1e1b4b',
                border: speedMultiplier === 1.5 ? '1px solid #86efac' : speedMultiplier <= 0.8 ? '1px solid #fcd34d' : '1px solid #c7d2fe',
                padding: '2px 8px', borderRadius: '12px', fontWeight: '800'
              }}>
                {speedMultiplier === 0.8 ? '0.8x Fast 🐇' : speedMultiplier === 1.0 ? '1.0x Normal 🚶' : speedMultiplier === 1.5 ? '1.5x Slow (Recommended) 🐢' : '2.2x Step 🔍'}
              </span>
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
              Press <kbd style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '2px 5px', borderRadius: '4px', border: '1px solid #94a3b8', fontSize: '10.5px', fontWeight: '700' }}>Enter ↵</kbd>
            </span>
          </div>

          {/* Segmented Speed Button Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { label: '⚡ Fast', value: 0.8, desc: 'Advanced' },
              { label: '🚶 Normal', value: 1.0, desc: '1.0x' },
              { label: '🐢 Slow', value: 1.5, desc: 'Recommended' },
              { label: '🔍 Step', value: 2.2, desc: 'Detailed' }
            ].map((option) => {
              const isSelected = speedMultiplier === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSpeedMultiplier(option.value)}
                  disabled={isPlaying}
                  style={{
                    padding: '7px 4px',
                    borderRadius: '8px',
                    border: isSelected ? '2.5px solid #002d62' : '1.5px solid #94a3b8',
                    backgroundColor: isSelected ? '#004080' : '#ffffff',
                    cursor: isPlaying ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 10px rgba(0, 64, 128, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? '#ffffff' : '#0f172a', display: 'block' }}>
                    {option.label}
                  </span>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: isSelected ? '#e0f2fe' : '#475569', display: 'block' }}>
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Translate Button */}
        <button 
          onClick={() => handleTranslate()}
          disabled={isPlaying || !inputText.trim()}
          style={{
            width: '100%', padding: '13px', 
            backgroundColor: isPlaying || !inputText.trim() ? '#94a3b8' : '#10b981', 
            color: 'white', border: 'none', borderRadius: '10px', 
            fontSize: '15.5px', fontWeight: '800', cursor: isPlaying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            boxShadow: isPlaying || !inputText.trim() ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)'
          }}
        >
          {isPlaying ? (
            <>
              <span className="spinner" />
              <span>3D Avatar Signing in Progress...</span>
            </>
          ) : (
            <>
              <span>🤟 Translate to 3D Sign Language</span>
            </>
          )}
        </button>

        {/* Live Status Indicator Card */}
        <div style={{ 
          marginTop: '16px', padding: '12px 16px', backgroundColor: isPlaying ? '#dcfce7' : isListening ? '#fef3c7' : '#f8fafc', 
          borderRadius: '10px', border: isPlaying ? '1px solid #86efac' : isListening ? '1px solid #fcd34d' : '1px solid #e2e8f0',
          textAlign: 'center', transition: 'all 0.3s ease'
        }}>
          <h4 style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
            System Status
          </h4>
          <p style={{ 
            fontSize: '14px', fontWeight: '800', color: isPlaying ? '#15803d' : isListening ? '#b45309' : '#004080', margin: 0,
            animation: isPlaying || isListening ? 'pulse 1.5s infinite' : 'none' 
          }}>
            {currentAction}
          </p>
        </div>

        {!voiceSupported && (
          <p style={{ fontSize: '11.5px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
            ℹ️ Note: Voice input requires a browser with Web Speech API support (Google Chrome or Microsoft Edge).
          </p>
        )}
      </div>

      {/* Right Panel: 3D Avatar Viewer & Live Gloss Pipeline HUD */}
      <div 
        className="signverse-panel-right"
        style={{
          width: '55%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#e5e7eb',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Avatar Viewport Frame (Upper section) */}
        <div 
          className="signverse-avatar-frame"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e5e7eb'
          }}
        >
          <iframe 
            ref={iframeRef} 
            src="/player-applet.html" 
            title="CWASA Avatar Player"
            className="signverse-avatar-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
          />
        </div>

        {/* Right Panel BOTTOM Gloss & Pipeline HUD (Green Theme with Times New Roman) */}
        <div
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(180deg, #052e16 0%, #14532d 100%)',
            color: '#ffffff',
            borderTop: '3px solid #22c55e',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10,
            boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
            fontFamily: '"Times New Roman", Times, serif'
          }}
        >
          {/* Active Gloss Line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px' }}>
                LIVE GLOSS:
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.25)',
                  color: '#4ade80',
                  border: '1.5px solid #22c55e',
                  padding: '4px 16px',
                  borderRadius: '8px',
                  fontSize: '19px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                {liveCWASAGloss || activeGlossItem?.label || 'READY'}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  backgroundColor: isPlaying ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: isPlaying ? '#4ade80' : '#bbf7d0',
                  border: isPlaying ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              >
                {isPlaying ? '🟢 Signing...' : '⚪ Idle'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                Avatar: <strong style={{ color: '#ffffff' }}>Luna</strong>
              </span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                Speed: <strong style={{ color: '#ffffff' }}>{speedMultiplier}x</strong>
              </span>
              {liveCWASASF && (
                <span style={{ backgroundColor: '#052e16', padding: '4px 10px', borderRadius: '6px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold', border: '1px solid #22c55e' }}>
                  Frame: {liveCWASASF}
                </span>
              )}
            </div>
          </div>

          {/* Sentence Sequence Token Strip */}
          {activeSequence.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingTop: '2px',
                scrollbarWidth: 'none'
              }}
            >
              {activeSequence.map((tok, idx) => {
                const isCurrent = idx === activeTokenIndex && isPlaying;
                const isPast = idx < activeTokenIndex || (!isPlaying && activeTokenIndex === activeSequence.length - 1);
                return (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      backgroundColor: isCurrent
                        ? '#16a34a'
                        : isPast
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(255,255,255,0.1)',
                      color: isCurrent ? '#ffffff' : isPast ? '#86efac' : '#cbd5e1',
                      border: isCurrent
                        ? '1.5px solid #4ade80'
                        : isPast
                        ? '1px solid #22c55e'
                        : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: isCurrent ? '0 0 10px #22c55e' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tok.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        @keyframes pulse-mic {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}