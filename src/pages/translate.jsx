import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllVocabulary, playSiGMLFast, stopSiGML } from '../utils/sigmlService';
import { getSubscriptionStatus, deductCredits } from '../utils/subscriptionManager';
import { translateEnglishToISL, ISL_LINGUISTIC_DISCLAIMER } from '../utils/islTranslator';

const AVATARS = [
  { id: 'luna', label: 'Luna' },
  { id: 'marc', label: 'Marc' },
  { id: 'anna', label: 'Anna' },
  { id: 'francoise', label: 'Francoise' },
  { id: 'siggi', label: 'Siggi' }
];
const VALID_AVATAR_IDS = new Set(AVATARS.map((a) => a.id));

function readTranslateSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem('signverse_user_settings') || 'null');
    const avatar = VALID_AVATAR_IDS.has(parsed?.defaultAvatar) ? parsed.defaultAvatar : 'luna';
    const spd = parseFloat(parsed?.avatarSpeed);
    const speed = [0.8, 1.0, 1.5, 2.2].includes(spd) ? spd : spd >= 1.25 ? 1.5 : 1.5;
    return { avatar, speed };
  } catch {
    return { avatar: 'luna', speed: 1.5 };
  }
}

export default function Translate() {
  const initialPrefs = readTranslateSettings();
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAction, setCurrentAction] = useState('Type a sentence or click Voice to Sign...');
  const [speedMultiplier, setSpeedMultiplier] = useState(initialPrefs.speed);
  const [autoTranslateVoice, setAutoTranslateVoice] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());
  const [creditAlert, setCreditAlert] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(initialPrefs.avatar);

  // Live Gloss and Sentence Sequence tracking
  const [activeGlossItem, setActiveGlossItem] = useState(null);
  const [activeTokenIndex, setActiveTokenIndex] = useState(-1);
  const [activeSequence, setActiveSequence] = useState([]);
  const [islGlossOrder, setIslGlossOrder] = useState([]);
  const [liveCWASAGloss, setLiveCWASAGloss] = useState('');
  const [liveCWASASF, setLiveCWASASF] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');

  const iframeRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const cancelPlaybackRef = useRef(false);
  const playbackSessionIdRef = useRef(0);

  // Listen for real-time CWASA gloss, frame, and status broadcasts (same-origin verified)
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.origin && e.origin !== window.location.origin) return;
      if (e.data?.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveCWASAGloss(e.data.gloss);
        if (e.data.signFrame) setLiveCWASASF(e.data.signFrame);
      } else if (e.data?.type === 'CWASA_STATUS') {
        if (e.data.status === 'error' || e.data.status === 'warning') {
          setAvatarNotice(e.data.message || '3D Avatar playback issue encountered.');
        } else if (e.data.status === 'ready') {
          setAvatarNotice('');
        }
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

  const { lookupMap } = useMemo(() => getAllVocabulary(), []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleStopPlayback = () => {
    playbackSessionIdRef.current += 1;
    cancelPlaybackRef.current = true;
    stopSiGML(iframeRef.current);
    setIsPlaying(false);
    setCurrentAction('Playback stopped by user.');
  };

  const handleAvatarChange = (nextAvatar) => {
    setSelectedAvatar(nextAvatar);
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_AVATAR', avatar: nextAvatar },
          window.location.origin
        );
      } catch {
        // Non-fatal
      }
    }
  };

  // High-Speed English-to-ISL Linguistic Translation Engine
  const handleTranslate = async (textOverride) => {
    const textToProcess = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!textToProcess || isPlaying) return;

    const creditRes = deductCredits(1);
    if (!creditRes.success) {
      setCreditAlert(creditRes.message);
      return;
    }
    setCreditAlert('');
    setSubStatus(getSubscriptionStatus());

    const translated = translateEnglishToISL(textToProcess, lookupMap);
    if (translated.steps.length === 0) {
      setCurrentAction('No valid signs found for the input.');
      return;
    }

    try {
      const prevCount = parseInt(localStorage.getItem('signverse_translation_count') || '0', 10) || 0;
      localStorage.setItem('signverse_translation_count', String(prevCount + 1));
    } catch {
      // Safe localStorage guard
    }

    const sessionId = ++playbackSessionIdRef.current;
    cancelPlaybackRef.current = false;
    setIsPlaying(true);
    setIslGlossOrder(translated.glossOrder);

    const playSequence = translated.steps.map((step) => ({
      label: step.displayWord,
      path: step.file,
      type: step.isFingerspell ? 'letter' : 'word',
      matchType: step.matchType
    }));
    setActiveSequence(playSequence);

    for (let i = 0; i < playSequence.length; i += 1) {
      if (cancelPlaybackRef.current || playbackSessionIdRef.current !== sessionId) break;
      const item = playSequence[i];
      setActiveTokenIndex(i);
      setActiveGlossItem(item);
      setCurrentAction(`Playing [${i + 1}/${playSequence.length}]: ${item.label}`);

      if (iframeRef.current) {
        playSiGMLFast(iframeRef.current, item.path, speedMultiplier);
      }

      const baseDelay = item.type === 'letter' ? 1400 : 2400;
      await sleep(baseDelay * speedMultiplier);
    }

    if (playbackSessionIdRef.current === sessionId && !cancelPlaybackRef.current) {
      setCurrentAction('Translation Complete!');
      setIsPlaying(false);
    } else if (playbackSessionIdRef.current === sessionId) {
      setIsPlaying(false);
    }
  };

  // Voice-to-Text & Voice-to-Sign Recognition Handler
  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setCurrentAction('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
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
        setCurrentAction('Listening... Speak clearly into your microphone');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
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
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setCurrentAction('Microphone access was denied. Please allow microphone permissions.');
        } else if (event.error === 'no-speech') {
          setCurrentAction('No speech detected. Please click the mic and try again.');
        } else {
          setCurrentAction(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalText = finalTranscriptRef.current || inputText;
        if (finalText.trim()) {
          setCurrentAction(`Voice recognized: "${finalText.trim()}"`);
          if (autoTranslateVoice) {
            setTimeout(() => {
              handleTranslate(finalText.trim());
            }, 400);
          }
        }
      };

      recognition.start();
    } catch {
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
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        position: 'relative'
      }}
    >
      {/* Left Panel: Text & Voice Controls */}
      <div
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '24px 28px',
          backgroundColor: '#1F2421',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '1px solid #2D3531',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ color: '#E4EAE6', margin: 0, fontSize: '21px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Text &amp; Voice to ISL</span>
            <span style={{ fontSize: '11px', backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.3)', padding: '3px 8px', borderRadius: '10px', fontWeight: '700' }}>
              3D Avatar
            </span>
          </h1>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/text-to-sign" style={{ textDecoration: 'none', fontSize: '12px', background: '#242A27', color: '#E4EAE6', padding: '5px 10px', borderRadius: '10px', fontWeight: '700', border: '1px solid #3A443F' }}>
              Learning Hub
            </Link>
            <Link to="/pricing" style={{ textDecoration: 'none', fontSize: '12px', backgroundColor: 'rgba(124,169,146,0.15)', color: '#A3CBB7', padding: '5px 10px', borderRadius: '10px', fontWeight: '700', border: '1px solid rgba(124,169,146,0.3)' }}>
              {subStatus.isPaidPlan ? 'Pro (Unlimited)' : `${subStatus.credits} Credits • ${subStatus.trialDaysRemaining}d Trial`}
            </Link>
          </div>
        </div>

        <p style={{ color: '#B5C5BC', fontSize: '13px', margin: '0 0 14px', lineHeight: '1.45' }}>
          Speak or type English sentences. Text is mapped to approximate ISL gloss order (Topic-Comment / SOV) and animated by our 3D WebGL avatar.
        </p>

        {creditAlert && (
          <div role="alert" style={{ padding: '10px 14px', backgroundColor: '#3B1E1E', color: '#FECACA', borderRadius: '10px', marginBottom: '14px', fontSize: '13px', fontWeight: '700', border: '1px solid #7F1D1D' }}>
            {creditAlert} <Link to="/pricing" style={{ color: '#A3CBB7', textDecoration: 'underline', marginLeft: '6px' }}>Upgrade to Pro</Link>
          </div>
        )}

        {/* Voice Recognition Card */}
        <div
          style={{
            backgroundColor: isListening ? 'rgba(245,158,11,0.12)' : '#242A27',
            border: isListening ? '1.5px solid #F59E0B' : '1px solid #3A443F',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={isPlaying}
              style={{
                backgroundColor: isListening ? '#DC2626' : '#7CA992',
                color: isListening ? '#FFFFFF' : '#0D1310',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: isPlaying ? 'not-allowed' : 'pointer'
              }}
            >
              {isListening ? 'Stop Listening' : 'Speak (Voice to Sign)'}
            </button>
            {isListening && <span style={{ color: '#FCD34D', fontSize: '12px', fontWeight: '700' }}>Listening live...</span>}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#B5C5BC', cursor: 'pointer', fontWeight: '600' }}>
            <input
              type="checkbox"
              checked={autoTranslateVoice}
              onChange={(e) => setAutoTranslateVoice(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-translate after speaking
          </label>
        </div>

        {/* Text Input */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <label htmlFor="translate-text-input" className="sr-only">
            Enter text to translate into 3D sign language
          </label>
          <textarea
            id="translate-text-input"
            placeholder={isListening ? 'Listening to your voice...' : 'Enter English text (e.g., Hello, what is your name?)'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '104px',
              padding: '12px 36px 12px 12px',
              borderRadius: '12px',
              border: isListening ? '2px solid #F59E0B' : '1px solid #3A443F',
              boxSizing: 'border-box',
              fontSize: '14.5px',
              resize: 'none',
              fontFamily: 'inherit',
              color: '#E4EAE6',
              backgroundColor: '#191C1A'
            }}
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              aria-label="Clear input text"
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                background: 'transparent',
                border: 'none',
                color: '#B5C5BC',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        {/* Speed Controller */}
        <div style={{ marginBottom: '14px', padding: '12px 14px', backgroundColor: '#242A27', borderRadius: '12px', border: '1px solid #3A443F', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#E4EAE6' }}>
              Playback Speed: <span style={{ color: '#A3CBB7' }}>{speedMultiplier}x</span>
            </span>
            <span style={{ fontSize: '11px', color: '#9CAEA4' }}>Press Enter to translate</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { label: 'Fast', value: 0.8, desc: '0.8x' },
              { label: 'Normal', value: 1.0, desc: '1.0x' },
              { label: 'Slow', value: 1.5, desc: 'Recommended' },
              { label: 'Step', value: 2.2, desc: 'Detailed' }
            ].map((option) => {
              const isSelected = speedMultiplier === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSpeedMultiplier(option.value)}
                  disabled={isPlaying}
                  style={{
                    padding: '7px 4px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid #7CA992' : '1px solid #3A443F',
                    backgroundColor: isSelected ? '#7CA992' : '#191C1A',
                    color: isSelected ? '#0D1310' : '#E4EAE6',
                    cursor: isPlaying ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '800' }}>{option.label}</span>
                  <span style={{ fontSize: '10px', opacity: isSelected ? 0.85 : 0.7 }}>{option.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Translate & Stop Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleTranslate()}
            disabled={isPlaying || !inputText.trim()}
            style={{
              flex: 1,
              padding: '13px',
              backgroundColor: isPlaying || !inputText.trim() ? '#2D3531' : '#7CA992',
              color: isPlaying || !inputText.trim() ? '#85968C' : '#0D1310',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: isPlaying || !inputText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isPlaying ? '3D Avatar Signing...' : 'Translate to 3D Sign Language'}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStopPlayback}
              style={{
                padding: '0 16px',
                backgroundColor: '#3B1E1E',
                color: '#FECACA',
                border: '1px solid #7F1D1D',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Stop
            </button>
          )}
        </div>

        {/* Live Status Card (Single accessible status live region) */}
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            backgroundColor: isPlaying ? 'rgba(124,169,146,0.14)' : '#242A27',
            borderRadius: '10px',
            border: isPlaying ? '1px solid #7CA992' : '1px solid #3A443F',
            textAlign: 'center'
          }}
        >
          <div style={{ color: '#9CAEA4', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700', marginBottom: '4px' }}>
            System Status
          </div>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#E4EAE6', margin: 0 }}>
            {currentAction}
          </p>
        </div>

        {/* ISL Linguistic Gloss Approximation Note */}
        <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#191C1A', border: '1px solid #2D3531', fontSize: '11.5px', color: '#9CAEA4', lineHeight: '1.45' }}>
          <strong style={{ color: '#A3CBB7' }}>ISL Grammar Note:</strong> {ISL_LINGUISTIC_DISCLAIMER}
          {islGlossOrder.length > 0 && (
            <div style={{ marginTop: '6px', color: '#E4EAE6' }}>
              Gloss Order: <span style={{ fontWeight: '700', color: '#7CA992' }}>{islGlossOrder.join(' + ')}</span>
            </div>
          )}
        </div>

        {!voiceSupported && (
          <p style={{ fontSize: '11.5px', color: '#FCA5A5', marginTop: '10px', textAlign: 'center' }}>
            Voice input requires Web Speech API support (Google Chrome or Microsoft Edge).
          </p>
        )}
      </div>

      {/* Right Panel: 3D Avatar Viewer & Sage Gloss HUD */}
      <div
        className="signverse-panel-right"
        style={{
          width: '55%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#191C1A',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
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
            backgroundColor: '#191C1A'
          }}
        >
          <iframe
            ref={iframeRef}
            src="/player-applet.html"
            title="CWASA Avatar Player"
            className="signverse-avatar-iframe"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />

          {avatarNotice && (
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                right: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(25,28,26,0.92)',
                border: '1px solid #F59E0B',
                color: '#FDE68A',
                fontSize: '12px'
              }}
            >
              {avatarNotice}
            </div>
          )}
        </div>

        {/* Bottom Gloss & Pipeline HUD (Cohesive Sage Theme) */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#141715',
            color: '#E4EAE6',
            borderTop: '1px solid #2D3531',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Live Gloss
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(124, 169, 146, 0.16)',
                  color: '#A3CBB7',
                  border: '1px solid rgba(124, 169, 146, 0.35)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '800'
                }}
              >
                {liveCWASAGloss || activeGlossItem?.label || 'READY'}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  backgroundColor: isPlaying ? 'rgba(124, 169, 146, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: isPlaying ? '#A3CBB7' : '#B5C5BC',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}
              >
                {isPlaying ? 'Signing...' : 'Idle'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
              <label htmlFor="translate-avatar-select" className="sr-only">
                Select 3D Sign Avatar
              </label>
              <select
                id="translate-avatar-select"
                value={selectedAvatar}
                onChange={(e) => handleAvatarChange(e.target.value)}
                style={{
                  backgroundColor: '#242A27',
                  color: '#E4EAE6',
                  border: '1px solid #3A443F',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {AVATARS.map((av) => (
                  <option key={av.id} value={av.id}>
                    Avatar: {av.label}
                  </option>
                ))}
              </select>

              <span style={{ backgroundColor: '#242A27', padding: '4px 10px', borderRadius: '8px', color: '#B5C5BC', border: '1px solid #3A443F' }}>
                Speed: <strong style={{ color: '#E4EAE6' }}>{speedMultiplier}x</strong>
              </span>
              {liveCWASASF && (
                <span style={{ backgroundColor: '#242A27', padding: '4px 10px', borderRadius: '8px', color: '#A3CBB7', fontFamily: 'monospace', fontWeight: '700', border: '1px solid #3A443F' }}>
                  Frame: {liveCWASASF}
                </span>
              )}
            </div>
          </div>

          {activeSequence.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingTop: '2px' }}>
              {activeSequence.map((tok, idx) => {
                const isCurrent = idx === activeTokenIndex && isPlaying;
                const isPast = idx < activeTokenIndex || (!isPlaying && activeTokenIndex === activeSequence.length - 1);
                return (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap',
                      backgroundColor: isCurrent ? '#7CA992' : isPast ? 'rgba(124,169,146,0.2)' : '#242A27',
                      color: isCurrent ? '#0D1310' : isPast ? '#A3CBB7' : '#B5C5BC',
                      border: isCurrent ? '1px solid #7CA992' : '1px solid #3A443F'
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
    </div>
  );
}
