/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert, Radio } from 'lucide-react';

interface SirenScreamerProps {
  externalTriggerActive?: boolean;
}

export default function SirenScreamer({ externalTriggerActive }: SirenScreamerProps) {
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (externalTriggerActive) {
      startSiren();
    } else {
      stopSiren();
    }
  }, [externalTriggerActive]);

  const startSiren = () => {
    if (isPlaying) return;
    
    try {
      // 1. Create or resume AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // 2. Create nodes
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      
      // Connect nodes
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Sweep frequency back and forth to simulate cop/ambulance siren
      let freqDirection = 1;
      let currentFreq = 700;
      
      osc.frequency.setValueAtTime(currentFreq, ctx.currentTime);
      osc.start();
      
      oscillatorRef.current = osc;
      gainNodeRef.current = gainNode;
      setIsPlaying(true);
      setIsSirenActive(true);

      // Interval to sweep frequency
      intervalRef.current = setInterval(() => {
        if (!oscillatorRef.current || !ctx) return;
        if (freqDirection === 1) {
          currentFreq += 100;
          if (currentFreq >= 1200) freqDirection = -1;
        } else {
          currentFreq -= 100;
          if (currentFreq <= 650) freqDirection = 1;
        }
        oscillatorRef.current.frequency.setValueAtTime(currentFreq, ctx.currentTime);
      }, 80);

    } catch (e) {
      console.error("Audio Context could not start:", e);
    }
  };

  const stopSiren = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn("Stopping siren error", e);
    }
    
    setIsPlaying(false);
    setIsSirenActive(false);
  };

  // Adjust volume dynamically
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(value, audioContextRef.current.currentTime);
    }
  };

  const toggleSiren = () => {
    if (isPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  // Cleanup on dismount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-350 hover:shadow-md">
      {/* Background visual pulsing ring */}
      {isSirenActive && (
        <>
          <div className="absolute inset-0 bg-red-50/40 animate-pulse pointer-events-none" />
          <div className="absolute -inset-10 bg-red-100/30 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
        </>
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${isSirenActive ? 'bg-red-500 text-white animate-bounce' : 'bg-rose-50 text-rose-600'} transition-all`}>
            {isSirenActive ? (
              <Radio className="w-8 h-8 animate-spin" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              Siren Deterrent Alarm
              {isSirenActive && (
                <span className="text-xs font-semibold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  BLASTING
                </span>
              )}
            </h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Triggers a simulated loud high-frequency siren sweep. Use to deter threats and draw immediate crowd assistance.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full justify-between">
            {/* Siren Activate Toggle */}
            <button
              id="btn_toggle_siren"
              onClick={toggleSiren}
              className={`w-full md:w-44 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all focus:outline-none focus:ring-4 ${
                isSirenActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 animate-pulse' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${isSirenActive ? 'animate-spin' : ''}`} />
              {isSirenActive ? 'Stop Siren' : 'Trigger Alarm'}
            </button>

            {/* Volume feedback icons */}
            <button 
              id="btn_mute_siren"
              onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
            >
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Control bar */}
          <div className="flex items-center gap-2 w-full md:w-56 mt-1">
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <input
              id="slider_siren_volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={!isSirenActive}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-40"
            />
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
