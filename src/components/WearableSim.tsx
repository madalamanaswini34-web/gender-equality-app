/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Watch, Wifi, WifiOff, Heart, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface WearableSimProps {
  onWearableSOS: () => void;
}

export default function WearableSim({ onWearableSOS }: WearableSimProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [deviceModel, setDeviceModel] = useState('Equal Voice Equal Choice Pulse Watch V4');
  const [battery, setBattery] = useState(94);
  const [fallDetectionActive, setFallDetectionActive] = useState(true);
  const [abnormalHeartRateAlert, setAbnormalHeartRateAlert] = useState(false);

  // Simulate dynamic heartbeats
  useEffect(() => {
    let interval: any = null;
    if (isConnected) {
      interval = setInterval(() => {
        setHeartRate((prev) => {
          let change = Math.floor(Math.random() * 7) - 3;
          let next = prev + change;
          if (next > 115) next = 95;
          if (next < 58) next = 65;

          // Simulate abnormal surge if over 112
          if (next > 110) {
            setAbnormalHeartRateAlert(true);
          } else {
            setAbnormalHeartRateAlert(false);
          }
          return next;
        });
        setBattery((b) => Math.max(10, b - (Math.random() > 0.9 ? 1 : 0)));
      }, 3000);
    } else {
      setAbnormalHeartRateAlert(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isConnected]);

  const toggleConnection = () => {
    setIsConnected(!isConnected);
  };

  const simulateFallEmergency = () => {
    if (!isConnected) return;
    alert("🚨 WEARABLE TELEMETRY SENSOR ALERT: Rapid impact de-acceleration (FALL) detected on Smart Watch!");
    onWearableSOS();
  };

  const triggerWearableSOS = () => {
    if (!isConnected) return;
    onWearableSOS();
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Wireless grid background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
              Wearable Integration
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {isConnected ? 'Sync Active' : 'Offline'}
              </span>
            </h3>
            <p className="text-slate-500 text-xs">
              Simulate watch triggers for high safety assurance.
            </p>
          </div>
        </div>

        <button
          id="btn_wearable_connect"
          onClick={toggleConnection}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            isConnected 
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isConnected ? (
            <>
              <WifiOff className="w-3.5 h-3.5" /> Unsync Watch
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" /> Sync Watch
            </>
          )}
        </button>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Model Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Device</span>
              <p className="text-xs font-bold text-slate-700 truncate mt-1">{deviceModel}</p>
            </div>

            {/* Heart Rate Card */}
            <div className={`p-3 rounded-xl border transition-all ${
              abnormalHeartRateAlert 
                ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Heart Rate</span>
                <Heart className={`w-3.5 h-3.5 ${abnormalHeartRateAlert ? 'text-red-500 animate-bounce' : 'text-rose-500'}`} />
              </div>
              <p className="text-lg font-black mt-0.5">{heartRate} <span className="text-xs font-normal">BPM</span></p>
            </div>

            {/* Battery Info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Battery Sync</span>
              <p className="text-lg font-bold text-slate-700 mt-0.5">{battery}%</p>
            </div>

            {/* Active Sensors */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fall Detection</span>
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Armed Actively
              </p>
            </div>
          </div>

          {abnormalHeartRateAlert && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <strong>Stress Surge:</strong> Fast cardiac heartbeats registered on wearable. Keep breathing calmly, stay near lit crowds, or long-press your back trigger to deploy helpers.
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {/* Button SOS on watch */}
            <button
              id="btn_wearable_sos_trigger"
              onClick={triggerWearableSOS}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" /> Simulate Watch SOS Force
            </button>
            
            {/* Simulator fall event */}
            <button
              id="btn_wearable_fall_trigger"
              onClick={simulateFallEmergency}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Trigger Sudden Fall Event
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 px-4 text-center">
          <Watch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">Smart Wearable Not Paired</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
            Pair your Garmin, Apple Watch, or Equal Voice Equal Choice physical wearable token here. Pair state activates micro SOS alerts directly from physical wrist impact counters or direct hotkeys offline!
          </p>
        </div>
      )}
    </div>
  );
}
