/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, ShieldAlert, Sparkles, Radio } from 'lucide-react';

interface VoiceTriggerProps {
  onVoiceEmergencyTriggered: (phraseUsed: string) => void;
}

export default function VoiceTrigger({ onVoiceEmergencyTriggered }: VoiceTriggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [lastSpeechInput, setLastSpeechInput] = useState('');
  const [detectedTrigger, setDetectedTrigger] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const waveformBars = Array.from({ length: 15 }, (_, i) => i);

  useEffect(() => {
    // Check support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || interimTranscript).toLowerCase();
      if (activeText.trim()) {
        setLastSpeechInput(activeText);
      }

      // Check key emergency command phrases
      const triggers = ['help me', 'emergency', 'help', 'siren', 'stop it', 'alert police'];
      for (const phrase of triggers) {
        if (activeText.includes(phrase)) {
          setDetectedTrigger(true);
          onVoiceEmergencyTriggered(phrase);
          // Briefly highlight trigger then reset
          setTimeout(() => setDetectedTrigger(false), 5000);
          break;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error event:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Re-initialize listen automatically if user left it active
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Auto restart skipped due to overlap');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isListening, onVoiceEmergencyTriggered]);

  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech start crashed:", e);
      }
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl transition-all duration-305 ${
            detectedTrigger 
              ? 'bg-red-500 text-white animate-ping' 
              : isListening 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400'
          }`}>
            <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              Voice Command Trigger
              <span className="flex items-center gap-1 text-xs font-semibold uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                <Sparkles className="w-3 h-3" /> Hands-Free
              </span>
            </h3>
            <p className="text-slate-400 text-sm max-w-md mt-0.5">
              Activate the emergency warning sequence immediately without touching your screen. Say: <strong className="text-emerald-400 font-semibold italic">"Help Me"</strong>, <strong className="text-emerald-400 font-semibold italic">"Emergency"</strong>, or <strong className="text-emerald-400 font-semibold italic">"Siren"</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 justify-end min-w-[200px]">
          {speechSupported ? (
            <button
              id="btn_voice_trigger_toggle"
              onClick={toggleListening}
              className={`py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all focus:outline-none focus:ring-4 ${
                isListening 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-900 border border-emerald-400' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 animate-bounce" />
                  <span>Listening Active</span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Activate Mic</span>
                </>
              )}
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-orange-950/40 text-orange-400 text-xs border border-orange-500/20 max-w-xs text-center md:text-right">
              Speech synthesis is blocked or unsupported on this browser agent. Run under Chrome/Safari to support hands free command listening.
            </div>
          )}

          {isListening && (
            <div className="flex items-end gap-1 h-6 px-2 justify-center md:justify-end">
              {waveformBars.map((bar) => {
                const randomHeight = Math.floor(Math.random() * 16) + 4;
                const animDuration = (1 + Math.random() * 1.5).toFixed(2);
                return (
                  <div
                    key={bar}
                    className="w-1 bg-emerald-400 rounded-full"
                    style={{
                      height: `${randomHeight}px`,
                      animation: `pulse-bar ${animDuration}s infinite ease-in-out`
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isListening && lastSpeechInput && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2.5">
          <span className="text-xs uppercase font-semibold text-slate-500 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Feed:
          </span>
          <span className="text-sm font-medium text-slate-300 italic truncate max-w-2xl bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            &quot;{lastSpeechInput}&quot;
          </span>
          {detectedTrigger && (
            <span className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-md flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 animate-bounce" /> Match Detected
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.2); }
        }
      `}</style>
    </div>
  );
}
