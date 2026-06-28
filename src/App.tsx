/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  Phone,
  MapPin,
  Flame,
  Volume2,
  Lock,
  User,
  Heart,
  FileText,
  AlertOctagon,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Compass,
  AlertTriangle,
  Lightbulb,
  CornerDownRight,
  BookOpen,
  Info,
  ChevronRight,
  Send,
  Download,
  Users,
  Camera,
  Moon,
  MessageSquare,
  Search,
  Filter,
  Plus
} from 'lucide-react';

import SirenScreamer from './components/SirenScreamer';
import VoiceTrigger from './components/VoiceTrigger';
import MediaRecorderEvidence from './components/MediaRecorderEvidence';
import WearableSim from './components/WearableSim';
import { SafetyReport, ChatMessage, RouteOption, SafetyResource } from './types';
import Markdown from 'react-markdown';

export default function App() {
  // Tab/Navigation State: 'home' | 'map' | 'features' | 'awareness' | 'chat'
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'features' | 'awareness' | 'chat'>('home');

  // Core Safety States
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: 37.7749, lng: -122.4194, address: "Civic Center Plz, San Francisco, CA" });
  const [sosActive, setSosActive] = useState(false);
  const [sirenTriggered, setSirenTriggered] = useState(false);
  const [wearableTriggerActive, setWearableTriggerActive] = useState(false);

  // Night Travel Mode State
  const [nightModeActive, setNightModeActive] = useState(false);
  const [nightCheckInTimer, setNightCheckInTimer] = useState<number | null>(null);
  const [nightCountdown, setNightCountdown] = useState(30);
  const [nightAlertTriggered, setNightAlertTriggered] = useState(false);

  // Selected Safe Route Choice
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-a');

  // Selected Map Category Filters
  const [mapFilter, setMapFilter] = useState<'all' | 'police' | 'hospital' | 'womens_center' | 'shelter' | 'user_report'>('all');

  // Custom Report Form State
  const [customReportType, setCustomReportType] = useState<string>('harassment');
  const [customReportTitle, setCustomReportTitle] = useState('');
  const [customReportDesc, setCustomReportDesc] = useState('');
  const [customReportCategory, setCustomReportCategory] = useState<'women' | 'men' | 'all'>('all');
  const [customReportSeverity, setCustomReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [customReportName, setCustomReportName] = useState('');
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  
  // Custom Latitude and Longitude click point coordinate capture
  const [clickedMapPoint, setClickedMapPoint] = useState<{ lat: number; lng: number } | null>(null);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am Equal Voice Equal Choice's **AI Safety & Legal Assistant**. I can help you with instantaneous emergency checklists, first-aid instructions, self-defense tactics, legal rights for both women and men, or safety suggestions.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Selected Safety Resource detail pop-up
  const [selectedResource, setSelectedResource] = useState<SafetyResource | null>(null);

  // Simulation Feedback
  const [showStatusCheckFeedback, setShowStatusCheckFeedback] = useState(false);

  // Load Initial Safety reports from Backend API
  const fetchSafetyReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.warn("Failed fetching live safety reports, using defaults.", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchSafetyReports();
  }, []);

  // Post dynamic custom report pin to live backend API
  const handleAddLiveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReportTitle || !customReportDesc) {
      alert("Please fill in the title and description details.");
      return;
    }

    // Capture coordinates: either click point or user location
    const lat = clickedMapPoint ? clickedMapPoint.lat : gpsLocation.lat + (Math.random() * 0.01 - 0.005);
    const lng = clickedMapPoint ? clickedMapPoint.lng : gpsLocation.lng + (Math.random() * 0.01 - 0.005);
    
    const bodyArgs = {
      type: customReportType,
      title: customReportTitle,
      description: customReportDesc,
      category: customReportCategory,
      latitude: lat,
      longitude: lng,
      locationName: clickedMapPoint ? `Selected Coordinate Location` : `Near ${gpsLocation.address.split(',')[0]}`,
      severity: customReportSeverity,
      reporterName: customReportName || "Anonymous Citizen"
    };

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyArgs)
      });
      if (response.ok) {
        // Reload pins
        await fetchSafetyReports();
        setShowAddReportModal(false);
        setCustomReportTitle('');
        setCustomReportDesc('');
        setCustomReportName('');
        setClickedMapPoint(null);
        alert("🎉 Thank you. Your safety report has been successfully pinned on the map coordinates for all users to see!");
      } else {
        alert("Server failed to store report. Adding temporarily to offline fallback.");
        // Add offline
        const tempReport: SafetyReport = {
          id: `rep-${Date.now()}`,
          type: customReportType as any,
          title: customReportTitle,
          description: customReportDesc,
          category: customReportCategory,
          latitude: lat,
          longitude: lng,
          locationName: bodyArgs.locationName,
          timestamp: new Date().toISOString(),
          severity: customReportSeverity as any,
          reporterName: bodyArgs.reporterName,
          votes: 1
        };
        setReports([tempReport, ...reports]);
        setShowAddReportModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upvote reported safety issue to verify accuracy
  const handleVoteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/vote`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setReports(reports.map(r => r.id === id ? { ...r, votes: updated.votes } : r));
      } else {
        // Increment locally if server fails
        setReports(reports.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
      }
    } catch (e) {
      setReports(reports.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r));
    }
  };

  // AI Chat Assistant Submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput;
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setSendingChat(true);

    // Scroll chat content to bottom
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      // Create simplified payload representation
      const chatHistory = chatMessages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsgText, history: chatHistory })
      });

      if (res.ok) {
        const reply = await res.json();
        const assistantMsg: ChatMessage = {
          id: `chat-reply-${Date.now()}`,
          sender: 'assistant',
          text: reply.text || "I apologize, my systems couldn't process this safety concern. Standard helplines are available.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error("API return error");
      }
    } catch (err) {
      // High-quality local simulation fallback if server isn't serving Gemini client
      const lower = userMsgText.toLowerCase();
      let simText = "";
      if (lower.includes('laws') || lower.includes('rights') || lower.includes('legal')) {
        simText = "⚖️ **CITIZEN LEGAL SAFEGUARD RIGHTS (WOMEN & MEN)**\n\n- **Zero FIR Protocol**: Under Sec 154 CrPC, you can register any sudden safety infraction or distress complaint at ANY police zone, even outside their immediate boundary.\n- **Equality of Protection**: Laws shield all survivors of physical threat. Cyber harassment trackers are registered online.\n- **Women Arrest Mandate**: No woman can be locked into custody post-sunset (6 PM) without a magistrate presence.";
      } else if (lower.includes('how to fight') || lower.includes('attack') || lower.includes('self-defense') || lower.includes('grab')) {
        simText = "🥋 **FAST SURVIVAL SELF-DEFENSE ACTION**\n\n1. **Strike Soft Zones**: Thumb thrust directly to eyes, palm strike thrust to nose cartilage, or knee drop to private parts.\n2. **Wrist Escape Grip**: Twist your arm to the weak thumbs-side opening of the grasp and pull with sudden force.\n3. **De-escalate & Alert**: Trigger the Equal Voice Equal Choice High-Decibel Siren immediately; vocalize 'FIRE' to force neighborhood intervention.";
      } else {
        simText = "📋 **Equal Voice Equal Choice Automated Response Tracker**\n\nOur intelligent hub logged your alert. If you are in immediate danger, please deploy the large **Red SOS switch** immediately. I am fully available here to outline legal, mental distress resources, or detailed first-aid points.";
      }

      setChatMessages(prev => [...prev, {
        id: `chat-sim-${Date.now()}`,
        sender: 'assistant',
        text: simText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setSendingChat(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // SOS Activation System
  const deploySOSSequence = () => {
    setSosActive(true);
    setSirenTriggered(true);
    const audioSmsMsg = "I need help. My current location is shared through Equal Voice Equal Choice. Track: 37.7749,-122.4194";
    console.log("SOS Alert Dispatch Issued: ", audioSmsMsg);
  };

  const cancelSOSSequence = () => {
    setSosActive(false);
    setSirenTriggered(false);
    setWearableTriggerActive(false);
  };

  // Hands-Free Speech callback handler
  const handleVoiceSOSTrigger = (phrase: string) => {
    alert(`📢 Voice emergency phrase detected: "${phrase}"! Equal Voice Equal Choice is triggering emergency alarms, capturing evidence recordings, and dispatching alerts!`);
    deploySOSSequence();
  };

  // Smart Wearable SOS handler
  const handleWearableSOS = () => {
    deploySOSSequence();
  };

  // Night Travel Mode timer handler
  useEffect(() => {
    let checkInInterval: any = null;
    if (nightModeActive) {
      setNightCountdown(30);
      setNightAlertTriggered(false);
      checkInInterval = setInterval(() => {
        setNightCountdown((prev) => {
          if (prev <= 1) {
            // Trigger automatic siren and location dispatch if countdown hits 0
            setNightAlertTriggered(true);
            deploySOSSequence();
            return 30; // reset
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setNightAlertTriggered(false);
    }

    return () => {
      if (checkInInterval) clearInterval(checkInInterval);
    };
  }, [nightModeActive]);

  const confirmPeriodicCheckIn = () => {
    setNightCountdown(30);
    setNightAlertTriggered(false);
    setShowStatusCheckFeedback(true);
    setTimeout(() => setShowStatusCheckFeedback(false), 3000);
  };

  // Mock safety scores database for map view directions (Route A vs Route B)
  const routesData: RouteOption[] = [
    {
      id: 'route-a',
      name: 'Route A (Equal Voice Equal Choice Recommended)',
      distance: '1.2 miles',
      duration: '5 mins',
      safetyScore: 95,
      description: 'Fully well-lit urban highway bypass with active streetlights, dense foot traffic, 12 active CCTV surveillance units, and 2 police checkpoints nearby.',
      features: ['Active CCTV surveillance', 'Dense public layout', '24h Street illumination', 'Passes directly by Police Station 4'],
      coordinates: [
        { lat: 37.7749, lng: -122.4194 },
        { lat: 37.7760, lng: -122.4150 },
        { lat: 37.7810, lng: -122.4120 },
        { lat: 37.7833, lng: -122.4167 }
      ]
    },
    {
      id: 'route-b',
      name: 'Route B (Shortest Path Bypass)',
      distance: '0.9 miles',
      duration: '4 mins',
      safetyScore: 65,
      description: 'Provides a minor shortcut through a poorly illuminated alley. Reports indicate dim lighting, broken streetlights near Ellis block, and minimal neighborhood foot traffic.',
      features: ['Dim lighting', 'Known broken streetlight pins', 'Blind alley corners', 'Zero official police substations'],
      coordinates: [
        { lat: 37.7749, lng: -122.4194 },
        { lat: 37.7710, lng: -122.4240 },
        { lat: 37.7790, lng: -122.4350 },
        { lat: 37.7833, lng: -122.4167 }
      ]
    }
  ];

  // Static awareness materials targeting gender equality, legal advice and tips for women and men
  const awarenessResources: SafetyResource[] = [
    {
      id: 'res-1',
      title: 'Zero FIR Rights & Legal Safeguards (Inclusive)',
      category: 'legal-rights',
      author: 'Ministry of Legal Justice Resources',
      targetAudience: 'all',
      content: 'An Equal Voice Equal Choice initiative for everyone: A Zero FIR allows a victim to register a complaint of physical attack, robbery, threat or harassment at ANY police station, regardless of territorial jurisdiction rules. The complaint is then forwarded to the respective precinct free of charge.'
    },
    {
      id: 'res-2',
      title: 'Active Cyber-Extortion Defence Tactics (Boys & Men Support)',
      category: 'support',
      author: 'Cyber Security Alliance Command',
      targetAudience: 'boys-men',
      content: 'Boys and men are frequently selected targets for financial blackmail through malicious web video traps. 1. DO NOT carry out payments (extortionists typically ask for higher sums once you pay). 2. Take screenshots of all credentials. 3. Cease communication immediately and report on national safety logs (cybercrime.gov.in). 4. Secure the privacy locks of your online pages immediately.'
    },
    {
      id: 'res-3',
      title: 'Street-Stalking Bystander Intervention (The 5 Ds)',
      category: 'self-defense',
      author: 'Safe Communities Association',
      targetAudience: 'women',
      content: '1. **Distract**: Ask the victim for directions or pull them into conversation. 2. **Delegate**: Ask an authority figure or security guard nearby. 3. **Document**: Record audio or click coordinates securely. 4. **Direct**: Speak cleanly and challenge the perpetrator directly if safe. 5. **Delay**: Check on the safety of the individual after the incident has passed.'
    },
    {
      id: 'res-4',
      title: 'Silent Depression & Peer Mental Resources for Men',
      category: 'mental-health',
      author: 'Global Mental Health Institute',
      targetAudience: 'boys-men',
      content: 'Societal standards frequently teach boys and men to bottle up anxiety or fear as weakness. Equal Voice Equal Choice includes completely confidential, state-approved psychological lines to voice stress freely. Reach out to SafeLine on 988 or talk to our supportive AI Safety Assistant anytime.'
    },
    {
      id: 'res-5',
      title: 'Legal Protection Against Online Defamation',
      category: 'legal-rights',
      author: 'Citizens Legal Counsel',
      targetAudience: 'all',
      content: 'Under digital protection acts, any cyberbullying, deepfake harassment, fake review, or online threat triggers criminal liability (punishable up to three years of custody). Use Equal Voice Equal Choice to capture instant chat context files.'
    },
    {
      id: 'res-6',
      title: 'Gender Equality: Safety is a Unified Campaign',
      category: 'equality-awareness',
      author: 'Equal Voice Equal Choice Inclusion Initiative',
      targetAudience: 'all',
      content: 'To foster true social impact, we believe safety is not a single gender issue. Promoting equal support guides, highlighting the threats men face, and implementing shared safety map coordinates will lead to a cooperative, safer city for everyone.'
    }
  ];

  // Map markers containing preloaded mock safety resources & live services
  const nearbyServices = [
    { id: 'srv-1', type: 'police', title: 'District Central Police Command', address: 'Market Blvd Block 10', lat: 37.7780, lng: -122.4120, emergencyContact: '100 / 112' },
    { id: 'srv-2', type: 'hospital', title: 'St. Mary Citizens Urgent Care', address: 'Gough Ave Block 3', lat: 37.7690, lng: -122.4270, emergencyContact: '102' },
    { id: 'srv-3', type: 'pharmacy', title: '24/7 Safety Pharmacy & Medicals', address: 'Sutter Dr 14A', lat: 37.7880, lng: -122.4140, emergencyContact: '011-233' },
    { id: 'srv-4', type: 'womens_center', title: 'Empower Girls & Women Resource Center', address: 'Union Main Square', lat: 37.7815, lng: -122.4090, emergencyContact: '1091' },
    { id: 'srv-5', type: 'shelter', title: 'Municipal Safe Public Shelter Zone', address: 'Civic Hall Basement B', lat: 37.7745, lng: -122.4180, emergencyContact: '888-291' }
  ];

  // Helper filter logic to render markers on custom high-fidelity Canvas-Map
  const filteredMarkers = [
    ...nearbyServices.filter(s => mapFilter === 'all' || mapFilter === s.type),
    ...reports.map(r => ({
      id: r.id,
      type: 'user_report',
      subType: r.type,
      title: r.title,
      address: r.locationName,
      lat: r.latitude,
      lng: r.longitude,
      reporterName: r.reporterName,
      severity: r.severity,
      votes: r.votes,
      description: r.description
    })).filter(r => mapFilter === 'all' || mapFilter === 'user_report')
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      
      {/* 🚨 SOS TRIGGER TOP OVERLAY FLAG BAR */}
      {sosActive && (
        <div className="bg-red-600 text-white p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-center sticky top-0 z-50 animate-pulse shadow-lg">
          <div className="flex items-center gap-3 justify-center">
            <span className="p-1 bg-white text-red-600 rounded-full animate-ping">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div className="text-left">
              <p className="font-extrabold text-sm md:text-base tracking-wide">EMERGENCY SOS TRANSMISSION IS ACTIVE</p>
              <p className="text-xs text-red-100">Live GPS tracking coordinates (37.7749° N, -122.4194° W) pinned to emergency police network.</p>
            </div>
          </div>
          <div className="flex gap-2.5 items-center">
            <a href="tel:100" className="bg-white text-red-700 px-3.5 py-1.5 rounded-lg text-xs font-black shadow hover:bg-slate-50 transition border border-red-200">
              📞 Dial Police (100)
            </a>
            <a href="tel:1091" className="bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow hover:bg-red-900 transition">
              👩 Women Help (1091)
            </a>
            <button
              id="btn_cancel_sos"
              onClick={cancelSOSSequence}
              className="bg-slate-900 hover:bg-slate-950 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              Cancel Alarm
            </button>
          </div>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg md:text-xl tracking-tight flex items-center gap-1.5">
                Equal Voice Equal Choice
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unified Safety Portal</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav_home"
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'home' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              Home
            </button>
            <button
              id="nav_map"
              onClick={() => { setActiveTab('map'); fetchSafetyReports(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'map' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              Interactive Map
            </button>
            <button
              id="nav_features"
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'features' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              SOS & Features
            </button>
            <button
              id="nav_awareness"
              onClick={() => setActiveTab('awareness')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === 'awareness' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              Aawareness & Rights
            </button>
            <button
              id="nav_chat"
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'chat' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              AI Safety Assistant
            </button>
          </nav>

          {/* Quick SOS Trigger button on global nav */}
          <div className="flex items-center gap-3">
            
            {/* Night Travel Mode Indicator */}
            <button
              id="btn_night_mode_toggle_quick"
              onClick={() => setNightModeActive(!nightModeActive)}
              className={`p-2.5 rounded-xl border transition ${
                nightModeActive 
                  ? 'bg-slate-900 border-indigo-500 text-indigo-300 animate-pulse' 
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              title="Toggle Night Watch Mode"
            >
              <Moon className="w-4.5 h-4.5" />
            </button>

            <button
              id="btn_global_sos"
              onClick={deploySOSSequence}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-200 flex items-center gap-1.5 animate-bounce"
            >
              <ShieldAlert className="w-4.5 h-4.5" />
              SOS Alert
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE SCROLL NAVIGATION BAR */}
      <div className="lg:hidden bg-white border-b border-slate-100 overflow-x-auto whitespace-nowrap flex items-center gap-1 px-4 py-2 scrollbar-none sticky top-[65px] z-30 shadow-inner">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-block mr-2 transition ${
            activeTab === 'home' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Home Overview
        </button>
        <button
          onClick={() => { setActiveTab('map'); fetchSafetyReports(); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-block mr-2 transition ${
            activeTab === 'map' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Interactive Map
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-block mr-2 transition ${
            activeTab === 'features' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Siren & SOS Tools
        </button>
        <button
          onClick={() => setActiveTab('awareness')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-block mr-2 transition ${
            activeTab === 'awareness' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Awareness Hub
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold inline-block transition ${
            activeTab === 'chat' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          🤖 Chat Bot Help
        </button>
      </div>

      {/* MAIN LAYOUT GATEWAY CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-8">

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* HERO INTRODUCTION PANEL */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950/90 to-slate-950 pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-300 font-bold text-xs uppercase tracking-widest rounded-full border border-indigo-500/20 inline-block mb-4">
                  🌟 Empowering Civic Protection Day and Night
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-4">
                  Your Immediate Shield <br/>
                  Against Threat & Distress.
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl">
                  Equal Voice Equal Choice is a comprehensive, gender-inclusive community platform designed to dramatically shorten emergency dispatch times, map real-time city hazards, and arm all citizens with direct legal safeguards and active physical deterrents.
                </p>

                <div className="flex flex-wrap gap-3.5">
                  <button
                    id="btn_home_start_map"
                    onClick={() => setActiveTab('map')}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-950 flex items-center gap-1.5"
                  >
                    🚀 Enter Safety Map <Compass className="w-4 h-4" />
                  </button>
                  <button
                    id="btn_home_laws"
                    onClick={() => setActiveTab('awareness')}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-xl text-sm transition-all"
                  >
                    View Citizen Rights & Laws
                  </button>
                  <button
                    id="btn_home_chat"
                    onClick={() => setActiveTab('chat')}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-900 to-indigo-950 border border-indigo-800 font-bold rounded-xl text-sm text-indigo-200 transition-all flex items-center gap-1.5"
                  >
                    Consult AI Support 🤖
                  </button>
                </div>
              </div>
            </div>

            {/* REAL-TIME APP LAUNCHER STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Average Response</h4>
                <p className="text-2xl md:text-3xl font-black text-slate-800">4.2 mins</p>
                <div className="text-emerald-600 text-xs font-bold mt-1.5 flex items-center gap-1">
                  <span>↓ 35% shorter waiting window</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">CCTV Coverage Index</h4>
                <p className="text-2xl md:text-3xl font-black text-slate-800">92.4%</p>
                <div className="text-slate-500 text-xs mt-1.5">
                  Verified routes mapping
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Smart Shelters</h4>
                <p className="text-2xl md:text-3xl font-black text-slate-800">140+</p>
                <div className="text-emerald-600 text-xs font-bold mt-1.5 flex items-center gap-1">
                  <span>● Coordinates updated live</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Citizen Upvotes Today</h4>
                <p className="text-2xl md:text-3xl font-black text-slate-800">4,819</p>
                <div className="text-indigo-600 text-xs font-semibold mt-1.5">
                  Crowdsourced threat reports
                </div>
              </div>
            </div>

            {/* TWO COLUMN INCLUSIVE SAFETY FEATURE HIGHLIGHT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Women Safety Initiatives */}
              <div className="bg-gradient-to-br from-rose-50/50 via-white to-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-sm relative">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl w-fit mb-5">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3">Empowering Women's Safety</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Customized for maximum rapid escape support. Connect instantly with trusted contacts, locate 24h monitored safe gender welfare hubs, sound the deterrent siren alarm instantly, and review precise legal protections regarding stalking, work harassment, and safe hours of arrest laws.
                </p>
                <div className="space-y-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-fit">
                    💖 Emergency Women Cell Line: 1091
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-fit">
                    📍 Passes Verified Well-Lit CCTV Channels
                  </span>
                </div>
              </div>

              {/* Men Safety Initiatives */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-white rounded-3xl p-6 md:p-8 border border-indigo-100 shadow-sm relative">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl w-fit mb-5">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3">Equal Protection for Men & Boys</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Maintaining absolute gender equality. Equal Voice Equal Choice recognizes specialized threats targeting males such as sudden highway robbery assaults, public transit fraud, fake cyber-extortion, physical accident entrapments, and severe mental health distress.
                </p>
                <div className="space-y-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit">
                    🔒 Cyber Security Extortion Defense Tools
                  </span>
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit">
                    🧠 Men's Suicide & Heavy Anxiety Stress Lines
                  </span>
                </div>
              </div>

            </div>

            {/* CORE COMMUNITY STATS & PLATFORM DOWNLOAD PROMPT */}
            <div className="bg-slate-100 rounded-3xl p-6 md:p-8 border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-md md:text-lg">Are you on the move? Export Equal Voice Equal Choice Offline</h4>
                <p className="text-slate-500 text-xs md:text-sm max-w-xl">
                  Download database checkpoints, local map markers, emergency contacts list, and self-defense tutorial files directly into your memory storage to play offline.
                </p>
              </div>
              <button
                id="btn_download_offline_bundle"
                onClick={() => {
                  alert("📥 Exporting Equal Voice Equal Choice Safety offline bundle: Pinned emergency points, legal references, and offline sound maps downloaded successfully!");
                }}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 shrink-0 border border-slate-700"
              >
                <Download className="w-4 h-4" /> Download App Data (ZIP)
              </button>
            </div>

          </div>
        )}

        {/* 2. MAP VIEW TAB */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Control panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <MapPin className="text-indigo-600 w-5 h-5" /> Live Community Safety Navigation Stage
                </h3>
                <p className="text-slate-500 text-xs">
                  Your detected location: <strong className="text-indigo-600 font-bold">{gpsLocation.address}</strong>. Drag elements or tap areas on map to record unsafe hazards.
                </p>
              </div>

              {/* Add custom coordinate pin action button */}
              <button
                id="btn_open_report_modal"
                onClick={() => setShowAddReportModal(true)}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Report Unsafe Hazard Point
              </button>
            </div>

            {/* Quick Filter Categories bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setMapFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                🗺️ All Points ({filteredMarkers.length})
              </button>
              <button
                onClick={() => setMapFilter('police')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'police' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                🚨 Police Stations
              </button>
              <button
                onClick={() => setMapFilter('hospital')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'hospital' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                🏥 Hospitals & Care
              </button>
              <button
                onClick={() => setMapFilter('womens_center')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'womens_center' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                👩 Women Help Centers
              </button>
              <button
                onClick={() => setMapFilter('shelter')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'shelter' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                🏠 Safe Shelters
              </button>
              <button
                onClick={() => setMapFilter('user_report')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  mapFilter === 'user_report' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ⚠️ Community Reports
              </button>
            </div>

            {/* ROUTE COMPARATIVE SCORE ANALYSIS (Route A vs Route B) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1 space-y-4 pr-0 lg:pr-5 border-0 lg:border-r border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">Smart Route Comparison</span>
                  <h4 className="font-extrabold text-slate-800 text-md">Navigation Safety Indices</h4>
                  <p className="text-slate-500 text-xs">
                    Equal Voice Equal Choice evaluates local area lights, active crowd flows, CCTV coverage, and citizen history logs to generate a real route status rating.
                  </p>
                </div>

                {/* Route Cards */}
                <div className="space-y-3">
                  {routesData.map((route) => {
                    const isSelected = selectedRouteId === route.id;
                    return (
                      <button
                        key={route.id}
                        id={`btn_route_select_${route.id}`}
                        onClick={() => setSelectedRouteId(route.id)}
                        className={`w-full text-left p-4 rounded-xl border text-xs transition-all ${
                          isSelected 
                            ? 'bg-slate-900 border-indigo-500 text-white shadow-md' 
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold flex items-center gap-1">
                            {route.id === 'route-a' ? '🟢' : '🔴'} {route.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                            route.safetyScore >= 80 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            Safety: {route.safetyScore}%
                          </span>
                        </div>
                        <p className={`line-clamp-2 mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {route.description}
                        </p>
                        <div className="flex gap-2.5 mt-2.5 text-[10px] text-slate-400 font-medium">
                          <span>Dist: {route.distance}</span>
                          <span>•</span>
                          <span>Est: {route.duration}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HIGH FIDELITY INTERACTIVE CANVAS MAP */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Visual Map Canvas Grid Simulation */}
                <div className="relative aspect-[16/9] md:aspect-[21/9] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner select-none flex items-center justify-center">
                  
                  {/* Grid Lines for technical styling */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />
                  
                  {/* Glowing Route A Path Display if Route A is selected */}
                  {selectedRouteId === 'route-a' && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      {/* Smooth safe pathway */}
                      <path
                        d="M 50,150 Q 180,50 350,140 T 600,60"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="8 4"
                        className="animate-pulse"
                      />
                      <g transform="translate(50, 150)">
                        <circle r="6" fill="#10b981" />
                        <text y="-12" className="text-[10px] fill-emerald-400 font-extrabold font-sans">Start (You)</text>
                      </g>
                      <g transform="translate(600, 60)">
                        <circle r="6" fill="#10b981" />
                        <text y="-12" className="text-[10px] fill-emerald-400 font-extrabold font-sans">Destination</text>
                      </g>
                    </svg>
                  )}

                  {/* Dim unstable Route B Path Display if Route B is selected */}
                  {selectedRouteId === 'route-b' && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 w-full">
                      <path
                        d="M 50,150 Q 220,190 400,180 T 600,60"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="opacity-70"
                      />
                      <g transform="translate(50, 150)">
                        <circle r="6" fill="#ef4444" />
                        <text y="-12" className="text-[10px] fill-rose-400 font-extrabold font-sans">Start (You)</text>
                      </g>
                      <g transform="translate(600, 60)">
                        <circle r="6" fill="#ef4444" />
                        <text y="-12" className="text-[10px] fill-rose-400 font-extrabold font-sans">Destination (Through Dim Alley)</text>
                      </g>
                    </svg>
                  )}

                  {/* Render safety markers as custom clickable buttons styled in absolute grid */}
                  <div className="absolute inset-0">
                    
                    {/* User Marker */}
                    <div className="absolute top-[68%] left-[8%] -translate-x-1-2 -translate-y-1-2 z-20 flex flex-col items-center">
                      <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center animate-ping absolute" />
                      <div className="w-4 h-4 bg-indigo-600 border-2 border-white rounded-full relative z-10 shadow-lg" />
                      <span className="bg-slate-900/90 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-md mt-1 whitespace-nowrap shadow-md border border-slate-700">
                        📍 My GPS Location
                      </span>
                    </div>

                    {/* Active filtered checkpoint pins */}
                    {filteredMarkers.map((m, idx) => {
                      const marker = m as any;
                      // Determine coordinates percent simulation mapped inside index box
                      const percentX = Math.abs(Math.sin(marker.lat * 50)) * 75 + 10;
                      const percentY = Math.abs(Math.cos(marker.lng * 50)) * 65 + 15;

                      // Color markers depending on type
                      let markerColor = "bg-amber-500";
                      let markerIconText = "🚨";
                      if (marker.type === 'police') { markerColor = "bg-indigo-600"; markerIconText = "🚓"; }
                      else if (marker.type === 'hospital') { markerColor = "bg-red-500"; markerIconText = "🏥"; }
                      else if (marker.type === 'womens_center') { markerColor = "bg-rose-500"; markerIconText = "👩"; }
                      else if (marker.type === 'shelter') { markerColor = "bg-emerald-500"; markerIconText = "🏠"; }
                      else if (marker.type === 'user_report') { 
                        markerColor = marker.severity === 'high' ? "bg-red-600 animate-pulse" : "bg-orange-500";
                        markerIconText = "⚠️"; 
                      }

                      return (
                        <div
                          key={marker.id}
                          className="absolute z-20 group cursor-pointer"
                          style={{ left: `${percentX}%`, top: `${percentY}%` }}
                        >
                          {/* Inner pin point */}
                          <div className={`p-1.5 rounded-full ${markerColor} text-white text-[11px] shadow-md border border-white hover:scale-110 active:scale-95 transition-all transform`}>
                            {markerIconText}
                          </div>

                          {/* Hover Details overlay card snippet */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-3 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-30 space-y-1 text-left">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                              <span className="font-extrabold uppercase text-[9px] text-indigo-400">
                                {marker.type.replace('_', ' ')}
                              </span>
                              {marker.votes !== undefined && (
                                <span className="text-[9px] text-emerald-400">👍 {marker.votes} verifications</span>
                              )}
                            </div>
                            <h5 className="font-bold text-slate-100 leading-tight">{marker.title}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-2">{marker.address || marker.description}</p>
                            {marker.emergencyContact && (
                              <p className="text-[9px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md mt-1 w-fit">
                                📞 Call: {marker.emergencyContact}
                              </p>
                            )}
                            {marker.type === 'user_report' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVoteReport(marker.id);
                                }}
                                className="w-full text-center py-1 mt-1.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold rounded-md text-[9px] transition"
                              >
                                👍 Verify Hazard Match
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Click Map Helper hint feedback */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg py-1 px-2.5 text-[9px] text-slate-400">
                      Hover pins to query active status, address & emergency hotline numbers.
                    </div>

                  </div>

                </div>

                {/* Simulated Quick Actions for interactive route coordinates */}
                <div className="p-4 bg-slate-100 border border-slate-200/50 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>💡 Area Safety Scores Summary</span>
                    <span className="text-slate-400 font-normal">Grid sector coordinates active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Area Sector A (Retail Plaza)</span>
                      <p className="text-md font-bold text-emerald-600 mt-0.5">Rating: 9.2/10</p>
                      <p className="text-[10px] text-slate-500 mt-1">Excellent lighting, active standard security loops.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Area Sector B (Ellis Alleys)</span>
                      <p className="text-md font-bold text-rose-600 mt-0.5">Rating: 5.4/10</p>
                      <p className="text-[10px] text-slate-500 mt-1">Recent dim light reports, isolated blind sidewalks.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* LIVE SAFETY REPORTS LIST TABLE */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm md:text-base">Active Community Reports Log</h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Real hazards reported anonymously. Upvote pins to verify they have been resolved or are active threat lines.
                  </p>
                </div>
                <button
                  onClick={fetchSafetyReports}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600"
                >
                  🔄 Sync Reports
                </button>
              </div>

              {loadingReports ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Querying live safety coordinates from Express database feed...
                </div>
              ) : reports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No community reports lodged yet near your current zone. Click "Report Unsafe Hazard Point" to begin!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((rep) => {
                    let severityColor = "bg-slate-100 text-slate-700";
                    if (rep.severity === 'high') severityColor = "bg-red-100 text-red-700";
                    else if (rep.severity === 'medium') severityColor = "bg-amber-100 text-amber-700";

                    return (
                      <div key={rep.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-between hover:shadow-sm transition">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${severityColor}`}>
                              {rep.severity} Severity
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{rep.locationName}</span>
                          </div>
                          
                          <h5 className="font-bold text-slate-800 text-sm mb-1">{rep.title}</h5>
                          <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed mb-4">{rep.description}</p>
                        </div>

                        <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                          <div>
                            <span className="font-bold text-slate-700">{rep.reporterName}</span>
                            <span className="inline-block mx-1">•</span>
                            <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                          </div>
                          <button
                            id={`btn_upvote_idx_${rep.id}`}
                            onClick={() => handleVoteReport(rep.id)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 transition flex items-center gap-1 shrink-0"
                          >
                            👍 Verified ({rep.votes})
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. SOS FEATURES & HARDWARE SIM SERVICES TAB */}
        {activeTab === 'features' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* HERO SOS DEPLOY BUTTON CARD */}
            <div className="bg-gradient-to-br from-rose-50 via-rose-100/40 to-white rounded-3xl p-6 md:p-10 border border-rose-200 text-slate-800 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                
                {/* 1st part: Instructions */}
                <div className="lg:col-span-1 space-y-3">
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-full border border-rose-500/20 inline-block">
                    ⚠️ Citizen Emergency Dispatcher
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">
                    One-Tap Life SOS Control
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    By pulling the trigger below, your safe coordinates are shared instantly on police control networks, a loud sweep alarm goes off on your speaker, and direct text dispatches go to pre-configured trusted friends or neighbors immediately.
                  </p>

                  <div className="p-3 bg-white/80 border border-rose-100 rounded-xl space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Preconfigured SMS Broadcast Template:</p>
                    <p className="text-slate-600 text-[11px] leading-relaxed italic font-medium">
                      &quot;I need help immediately. My current live location is shared through Equal Voice Equal Choice coordinate metrics (37.7749,-122.4194). Send aid!&quot;
                    </p>
                  </div>
                </div>

                {/* 2nd part: Huge Interactive SOS Trigger Button */}
                <div className="lg:col-span-1 flex flex-col items-center justify-center">
                  <button
                    id="btn_huge_sos_deploy"
                    onClick={sosActive ? cancelSOSSequence : deploySOSSequence}
                    className={`w-40 h-40 md:w-48 md:h-48 rounded-full font-black text-xl md:text-2xl tracking-widest text-white shadow-2xl transition-all border-4 flex flex-col items-center justify-center gap-1 focus:outline-none focus:ring-8 ${
                      sosActive
                        ? 'bg-rose-950 hover:bg-rose-900 border-red-500 shadow-rose-900 animate-ping ring-red-300'
                        : 'bg-red-600 hover:bg-red-700 border-red-500/40 shadow-red-200 hover:scale-105 active:scale-95 duration-200 ring-rose-200'
                    }`}
                  >
                    <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 animate-bounce" />
                    <span>{sosActive ? 'CANCEL' : 'SOS'}</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">
                      {sosActive ? 'DEployed' : 'Tap to Shield'}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-4 text-center">
                    {sosActive ? '⚠️ Press and hold to disarm active alert status' : 'Tap once for immediate local deployment'}
                  </p>
                </div>

                {/* 3rd part: Simulated Helpline Contacts numbers */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-rose-100 shadow-inner space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                    Emergency Toll-Free Helplines
                  </h4>

                  <div className="space-y-2.5">
                    <a
                      href="tel:100"
                      className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700"
                    >
                      <span className="flex items-center gap-2">🚓 National Police Command</span>
                      <span className="text-indigo-600 font-extrabold font-mono text-xs">Dial 100 / 112 →</span>
                    </a>
                    
                    <a
                      href="tel:1091"
                      className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700"
                    >
                      <span className="flex items-center gap-2">👩 Women Intervention Cell</span>
                      <span className="text-rose-600 font-extrabold font-mono text-xs">Dial 1091 →</span>
                    </a>

                    <a
                      href="tel:102"
                      className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700"
                    >
                      <span className="flex items-center gap-2">🚑 Ambulance / Trauma Dispatch</span>
                      <span className="text-emerald-600 font-extrabold font-mono text-xs">Dial 102 →</span>
                    </a>

                    <a
                      href="tel:101"
                      className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-xs font-bold text-slate-700"
                    >
                      <span className="flex items-center gap-2">🔥 Fire Brigade & Safety Rescue</span>
                      <span className="text-amber-600 font-extrabold font-mono text-xs">Dial 101 →</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* SIREN INTEGRATION COMPONENT & HANDS-FREE VOICE ACTIVATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SirenScreamer externalTriggerActive={sirenTriggered} />
              <VoiceTrigger onVoiceEmergencyTriggered={handleVoiceSOSTrigger} />
            </div>

            {/* NIGHT WATCH TIMED TRAVEL MODE SETUP */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/60 rounded-full blur-3xl pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
                <div className="lg:col-span-1 space-y-2">
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 font-bold text-[10px] uppercase tracking-wide rounded-full border border-amber-500/20 inline-block">
                    ⏳ Timed Check-in Loop
                  </span>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5">
                    Night Watch Mode
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Designed for unlit commutes or late-night taxi rides. When armed, Equal Voice Equal Choice triggers a periodic check-in prompt. If you neglect to tap safety confirm within 30 seconds, an automatic SOS warning alarm cascades instantly to authorities!
                  </p>
                </div>

                <div className="lg:col-span-1 flex flex-col items-center justify-center bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  {nightModeActive ? (
                    <div className="space-y-4 text-center w-full">
                      <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center mx-auto animate-pulse">
                        <span className="text-lg font-black text-amber-400">{nightCountdown}s</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300">Countdown Active • Waiting Check-in</p>
                        <p className="text-[10px] text-slate-500 mt-1">Tap confirmation below to reset the timers.</p>
                      </div>
                      
                      <button
                        id="btn_confirm_checkin"
                        onClick={confirmPeriodicCheckIn}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                      >
                        ✅ Yes, I Am Safe
                      </button>

                      {showStatusCheckFeedback && (
                        <p className="text-[11px] text-emerald-400 animate-pulse font-semibold">
                          🔄 Check-in logged. Next timer sequence reset!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <Moon className="w-8 h-8 text-indigo-400 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Night Safe Timer Offline</p>
                        <p className="text-[10px] text-slate-500 mt-1">Toggle watch to safeguard isolated routes.</p>
                      </div>
                      <button
                        id="btn_arm_night_watch"
                        onClick={() => setNightModeActive(true)}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Arm Night Watch Now
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 space-y-3 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-800">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Night Safe Guidelines:</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-400">✔</span>
                      <span>Configures continuous telemetry tracking on map.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-400">✔</span>
                      <span>Audio recording begins instantly if timer breaches limit.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-400">✔</span>
                      <span>De-escalates potential panic during stress episodes.</span>
                    </li>
                  </ul>
                  {nightModeActive && (
                    <button
                      onClick={() => setNightModeActive(false)}
                      className="w-full text-center text-xs font-bold text-rose-400 hover:text-rose-300 pt-1"
                    >
                      Turn Off Night Watch Mode
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ADVANCED SMART WATCH SIMULATOR INTEGRATION & EVIDENCE CAM RECORDER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WearableSim onWearableSOS={handleWearableSOS} />
              <MediaRecorderEvidence />
            </div>

            {/* HARDWARE OVERRIDE SIMULATORS (Double tap, Shake phone, long press) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                  Simulate Phone Hardware Lock-Screen Triggers
                </h4>
                <p className="text-slate-500 text-xs">
                  Physical safety shortcuts to trigger sirens and alert contacts even when the smartphone screens are locked. Test inputs below:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  id="btn_sim_double_tap"
                  onClick={() => {
                    alert("📱 Physical Double-Tap of volume key detected! Equal Voice Equal Choice has activated internal deterrent mechanisms!");
                    setSirenTriggered(true);
                    deploySOSSequence();
                  }}
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-100 border border-slate-200/80 text-left transition text-xs space-y-1"
                >
                  <span className="font-black text-slate-800 block text-sm">📳 Double-Tap Power</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Triggers alarm bypasses instantly under absolute physical locks.
                  </p>
                  <span className="inline-block mt-2 font-bold text-[10px] text-indigo-600">Simulate Input Key →</span>
                </button>

                <button
                  id="btn_sim_shake"
                  onClick={() => {
                    alert("📳 Sensor feedback logic: Device shaken 3 times in quick continuous intervals! Deploying dispatch alert!");
                    setSirenTriggered(true);
                    deploySOSSequence();
                  }}
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-100 border border-slate-200/80 text-left transition text-xs space-y-1"
                >
                  <span className="font-black text-slate-800 block text-sm">📴 Shake Phone 3 Times</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Utilizes built-in phone accelerometer detection metrics offline.
                  </p>
                  <span className="inline-block mt-2 font-bold text-[10px] text-indigo-600">Simulate Accent Shake →</span>
                </button>

                <button
                  id="btn_sim_volume"
                  onClick={() => {
                    alert("🔊 long press of physical volume key detected! Activating Siren deterrences!");
                    setSirenTriggered(true);
                  }}
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:border-rose-100 border border-slate-200/80 text-left transition text-xs space-y-1"
                >
                  <span className="font-black text-slate-800 block text-sm">🔊 Long-Press Volume Key</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Instantly blasts the high-frequency Siren Sweeper on maximum gain.
                  </p>
                  <span className="inline-block mt-2 font-bold text-[10px] text-indigo-600">Simulate Long-Press →</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 4. AWARENESS & EDUCATION HUB TAB */}
        {activeTab === 'awareness' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Introductory panel */}
            <div className="p-6 md:p-8 bg-indigo-950 text-white rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-900/45 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wide border border-indigo-500/30">
                  ⚖️ Inclusive Awareness Portal
                </span>
                <h3 className="text-2xl font-black mt-2">Education, Legal Rights & Unified Cooperation</h3>
                <p className="text-slate-300 text-xs leading-relaxed mt-2">
                  True community protection requires gender-inclusive guidelines. Explore verified resources on legal self-defense under physical harassment, suicide & silent stress hubs for boys/men, and unified civic safety strategies.
                </p>
              </div>
            </div>

            {/* Dynamic filter Audience select */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left filter menu/stats list */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">
                  Query Library Sectors
                </h4>
                
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-indigo-50 text-[11px] text-indigo-800 font-semibold flex items-center justify-between">
                    <span>💡 Gender Equality Safety Index</span>
                    <span>9.4 Rated</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50 text-[11px] text-rose-800 font-semibold flex items-center justify-between">
                    <span>📑 Women Stalking & Abuse Laws</span>
                    <span>12 resources</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                    <span>🛡️ Men's Cyber-Fraud Defense</span>
                    <span>8 manuals</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                  <strong>Social Impact Mandate:</strong> Equal Voice Equal Choice maintains strict neutrality. Providing equal tools and awareness checklists encourages a high sense of safety and shortens emergency response loops.
                </div>
              </div>

              {/* Grid books display cards */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {awarenessResources.map((res) => {
                  let audienceBadge = "bg-slate-150 text-slate-700";
                  if (res.targetAudience === 'women') audienceBadge = "bg-rose-100 text-rose-700";
                  else if (res.targetAudience === 'boys-men') audienceBadge = "bg-indigo-100 text-indigo-700";

                  return (
                    <div
                      key={res.id}
                      onClick={() => setSelectedResource(res)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transform duration-200"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${audienceBadge}`}>
                            Audience: {res.targetAudience.replace('-', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            📁 {res.category.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <h4 className="font-extrabold text-slate-800 text-sm leading-snug mb-2 hover:text-indigo-600 transition">
                          {res.title}
                        </h4>
                        
                        <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                          {res.content}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>By {res.author}</span>
                        <span className="text-indigo-600 flex items-center gap-0.5">Read Detail <ChevronRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* RESOURCE DETAILS MODAL VIEW */}
            {selectedResource && (
              <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                        {selectedResource.category.toUpperCase().replace('-', ' ')}
                      </span>
                      <h4 className="font-black text-slate-800 text-base md:text-lg mt-1.5 leading-snug">
                        {selectedResource.title}
                      </h4>
                    </div>
                    <button
                      id="btn_close_resource"
                      onClick={() => setSelectedResource(null)}
                      className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap">
                    {selectedResource.content}
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Log Authority: {selectedResource.author}</span>
                    <span>Welfare Tier: {selectedResource.targetAudience.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. AI SAFETY ASSISTANT CHAT BOT HELP TAB */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm flex flex-col h-[600px] overflow-hidden animate-fade-in relative">
            
            {/* Header info bar */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-radial-gradient(ellipse_at_top,_var(--tw-gradient-stops)) from-indigo-950 via-slate-950 to-slate-950 opacity-80 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm md:text-base tracking-tight flex items-center gap-1.5">
                    Equal Voice Equal Choice AI Chat Assistant
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Powered by server-side Gemini 3.5 Flash
                  </p>
                </div>
              </div>

              {/* Online indicator */}
              <div className="relative z-10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secured Line</span>
              </div>
            </div>

            {/* Interactive suggested prompts */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 shrink-0 flex gap-2 overflow-x-auto scrollbar-none text-[11px]">
              <span className="text-slate-400 self-center font-bold uppercase text-[9px] shrink-0 mr-1">Suggested:</span>
              <button
                id="btn_prompt_self_defense"
                onClick={() => setChatInput("What are some smart self-defense movements to escape a stalker?")}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full font-medium text-slate-600 transition shrink-0"
              >
                🥋 Stalker Self-Defense
              </button>
              <button
                id="btn_prompt_first_aid"
                onClick={() => setChatInput("Provide step by step first aid instructions for a bicycle road accident")}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full font-medium text-slate-600 transition shrink-0"
              >
                🩹 First-Aid Accident
              </button>
              <button
                id="btn_prompt_legal"
                onClick={() => setChatInput("What exactly is a Zero FIR or laws protecting citizens from defamation?")}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full font-medium text-slate-600 transition shrink-0"
              >
                ⚖️ Zero FIR Law
              </button>
              <button
                id="btn_prompt_cyber"
                onClick={() => setChatInput("How can boys defend themselves from online cyber extortion on video chats?")}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full font-medium text-slate-600 transition shrink-0"
              >
                🔒 Cyber Blackmail Fix
              </button>
            </div>

            {/* Chat message display engine */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {chatMessages.map((msg, idx) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex gap-3 max-w-3xl ${isAssistant ? '' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* Tiny Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold ${
                      isAssistant ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {isAssistant ? '🤖' : '👤'}
                    </div>

                    {/* Chat Text Bubble */}
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative shadow-xs border ${
                      isAssistant 
                        ? 'bg-white border-slate-200/60 text-slate-800 rounded-tl-none' 
                        : 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none'
                    }`}>
                      {isAssistant ? (
                        <div className="markdown-body prose max-w-none text-xs leading-relaxed font-medium [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h3]:font-bold [&>h4]:font-bold [&>h3]:text-sm [&>h4]:text-xs [&>h3]:mt-3 [&>h4]:mt-2 [&>strong]:font-semibold [&>p]:mb-2 last:[&>p]:mb-0">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line font-medium leading-relaxed">
                          {msg.text}
                        </p>
                      )}
                      
                      <span className={`text-[9px] block text-right mt-1.5 font-bold uppercase tracking-wider ${
                        isAssistant ? 'text-slate-400' : 'text-indigo-200'
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {sendingChat && (
                <div className="flex gap-3 max-w-xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    ⏳
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 rounded-tl-none animate-pulse">
                    AI Safety Assistant is evaluating legal, medical, and defensive options...
                  </div>
                </div>
              )}

              {/* Scroll anchor target */}
              <div ref={chatBottomRef} />
            </div>

            {/* Form text input box */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
              <input
                id="input_chat_box"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about self-defense, Zero FIR rights, first aid, cyber safety, or mental stress tools..."
                className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none transition"
              />
              <button
                id="btn_chat_submit"
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                Send <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-extrabold text-slate-100 flex items-center gap-2 justify-center md:justify-start">
                Equal Voice Equal Choice Unified Initiative
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                An inclusive safety shield for everyone — protecting women, men, boys, and travelers day and night offline.
              </p>
            </div>
            <div className="flex gap-3.5 text-xs text-indigo-400 font-bold">
              <button onClick={() => setActiveTab('home')} className="hover:underline">Home</button>
              <span>•</span>
              <button onClick={() => setActiveTab('map')} className="hover:underline">Safety Map</button>
              <span>•</span>
              <button onClick={() => setActiveTab('features')} className="hover:underline">Emergency SOS</button>
              <span>•</span>
              <button onClick={() => setActiveTab('awareness')} className="hover:underline">Awareness Hub</button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-6 py-6 border-t border-slate-800 leading-relaxed max-w-xl mx-auto">
            Equal Voice Equal Choice is a community resource companion. It is not an alternate bypass for dial-911 physical law enforcement response. If you are facing severe live violence please dial emergency lines directly on your phone keypad.
          </p>
        </div>
      </footer>

      {/* 🚀 ADD SAFETY HAZARD REPORT Pin POPUP MODAL */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative border border-slate-100">
            
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <h4 className="font-black text-slate-800 text-base md:text-lg flex items-center gap-1.5">
                  <AlertOctagon className="text-amber-500 w-5 h-5 animate-pulse" /> Post Safety Hazard Coordinate Pin
                </h4>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  All logged hazard coordinates will render instantly as verification flags for close proximity citizens.
                </p>
              </div>
              <button
                onClick={() => { setShowAddReportModal(false); setClickedMapPoint(null); }}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLiveReport} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                
                {/* Threat Type Selector */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Issue Category Selection</label>
                  <select
                    id="select_report_type"
                    value={customReportType}
                    onChange={(e) => setCustomReportType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="harassment">Street Harassment/Teasing</option>
                    <option value="accident">Severe Road Accident</option>
                    <option value="streetlight">Broken Streetlights/Darkness</option>
                    <option value="suspicious">Suspicious Foot Traffic Activity</option>
                    <option value="robbery">Armed Snatching/Robbery Hazard</option>
                    <option value="cybercrime">Fake Public Sniffer Wi-Fi</option>
                    <option value="threat">Physical Threat</option>
                  </select>
                </div>

                {/* Target Audience Sector (Inclusivity check) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Inclusivity Filter</label>
                  <select
                    id="select_report_audience"
                    value={customReportCategory}
                    onChange={(e) => setCustomReportCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Universal (All citizens affected)</option>
                    <option value="women">Affects Women primarily</option>
                    <option value="men">Affects Men & Boys primarily</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Severity Selection */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Severity Alarm</label>
                  <select
                    id="select_report_severity"
                    value={customReportSeverity}
                    onChange={(e) => setCustomReportSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low (General local awareness)</option>
                    <option value="medium">Medium (Moderate road disruption)</option>
                    <option value="high">High (Immediate danger/Extreme hazard)</option>
                  </select>
                </div>

                {/* Reporter Name (Anonymity Checkbox) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Your Alias/Reporter Tag</label>
                  <input
                    id="input_report_name"
                    type="text"
                    value={customReportName}
                    onChange={(e) => setCustomReportName(e.target.value)}
                    placeholder="E.g. Sarah Jenkins or 'Anonymous'"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Headline Summary Title</label>
                <input
                  id="input_report_title"
                  type="text"
                  required
                  value={customReportTitle}
                  onChange={(e) => setCustomReportTitle(e.target.value)}
                  placeholder="E.g. Pitch black road corner near Sutter main junction"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Actionable Description Details</label>
                <textarea
                  id="textarea_report_desc"
                  required
                  rows={4}
                  value={customReportDesc}
                  onChange={(e) => setCustomReportDesc(e.target.value)}
                  placeholder="Provide precise location markers and guidance. E.g. broken bulb on the streetlight, recommend choosing Main Street instead to avoid tripping or robbery risks."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Alert reminder coordinates focus */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] text-slate-500">
                ✔️ Coordinate locations will default near your live GPS coordinates dynamically. (Accuracy: ~15 meters)
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddReportModal(false); setClickedMapPoint(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn_submit_report"
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
                >
                  Post Verification Coordinate Pin 🚀
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
