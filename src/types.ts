/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SafetyReport {
  id: string;
  type: 'harassment' | 'threat' | 'accident' | 'streetlight' | 'suspicious' | 'safe-zone' | 'robbery' | 'cybercrime';
  title: string;
  description: string;
  category: 'women' | 'men' | 'all';
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  reporterName: string;
  votes: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFirstAid?: boolean;
}

export interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  description: string;
  features: string[];
  coordinates: { lat: number; lng: number }[];
}

export interface SafetyResource {
  id: string;
  title: string;
  category: 'self-defense' | 'legal-rights' | 'mental-health' | 'equality-awareness' | 'support';
  author: string;
  content: string;
  targetAudience: 'women' | 'boys-men' | 'all';
}
