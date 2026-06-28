/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Preloaded mock safety reports stored in-memory
let reports = [
  {
    id: 'rep-1',
    type: 'streetlight',
    title: 'Broken streetlights near Gough block',
    description: 'The entire alley is pitch black after 8 PM, making it unsafe to walk alone. Suggest choosing Route A instead.',
    category: 'all',
    latitude: 37.7710,
    longitude: -122.4240,
    locationName: 'Near Gough Ave Block 3',
    timestamp: new Date().toISOString(),
    severity: 'high',
    reporterName: 'Alice Jenkins',
    votes: 12
  },
  {
    id: 'rep-2',
    type: 'harassment',
    title: 'Street harassment reported',
    description: 'Group of individuals making untoward comments to women passing by near Union Main Square.',
    category: 'women',
    latitude: 37.7815,
    longitude: -122.4090,
    locationName: 'Union Main Square',
    timestamp: new Date().toISOString(),
    severity: 'medium',
    reporterName: 'Anonymous',
    votes: 8
  },
  {
    id: 'rep-3',
    type: 'robbery',
    title: 'Armed snatching attempt',
    description: 'Suspicious individuals on bike attempted to snatch a wallet and laptop bag near Civic Hall Basement.',
    category: 'all',
    latitude: 37.7745,
    longitude: -122.4180,
    locationName: 'Civic Hall Basement B',
    timestamp: new Date().toISOString(),
    severity: 'high',
    reporterName: 'Mark S.',
    votes: 15
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API: Get safety reports
  app.get('/api/reports', (req, res) => {
    res.json(reports);
  });

  // 2. API: Post a new safety report
  app.post('/api/reports', (req, res) => {
    try {
      const { type, title, description, category, latitude, longitude, locationName, severity, reporterName } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required.' });
      }

      const newReport = {
        id: `rep-${Date.now()}`,
        type: type || 'suspicious',
        title,
        description,
        category: category || 'all',
        latitude: parseFloat(latitude) || 37.7749,
        longitude: parseFloat(longitude) || -122.4194,
        locationName: locationName || 'Report Location',
        timestamp: new Date().toISOString(),
        severity: severity || 'medium',
        reporterName: reporterName || 'Anonymous Citizen',
        votes: 1
      };

      reports = [newReport, ...reports];
      res.status(201).json(newReport);
    } catch (e) {
      console.error('Error creating report:', e);
      res.status(500).json({ error: 'Failed to create report.' });
    }
  });

  // 3. API: Vote/verify a safety report
  app.post('/api/reports/:id/vote', (req, res) => {
    const { id } = req.params;
    const report = reports.find(r => r.id === id);
    if (!report) {
      return res.status(444).json({ error: 'Report not found' });
    }
    report.votes = (report.votes || 0) + 1;
    res.json(report);
  });

  // 4. API: AI Safety Assistant Chat
  app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Prompt message is required.' });
    }

    const fallbackResponse = (query: string): string => {
      const lower = query.toLowerCase();
      if (lower.includes('stalk') || lower.includes('follow') || lower.includes('threat') || lower.includes('dangerous') || lower.includes('suspicious')) {
        return `### 🚨 Personal Safety Guidelines: Handling Stalkers or Suspicious Activity

If you suspect you are being followed or observed:
1. **Change Your Vector Immediately**: Cross the street, change speeds, or enter a well-lit public space like a café, bank lobby, or supermarket.
2. **Make Direct Eye Contact**: Turn and look briefly but firmly at them. Signal clearly that you are highly conscious of their presence and not an easy target.
3. **Sound the Alarm**: Deploy the **Equal Voice Equal Choice High-Decibel Siren** in the applet right now. High-pitched noise creates psychological hesitation for an offender and forces witnesses to intervene.
4. **Broadcast Location**: Tap the **Red SOS Panel**. It automatically compiles GPS metrics and prepares details for rapid transit dispatch.
5. **Direct Legal Defense**: Stalking is actionable under criminal codes. Record timestamps, clothing colors, and physical descriptions—our secured **Evidence Camera Module** encrypts files instantly for legal presentation.`;
      }

      if (lower.includes('laws') || lower.includes('rights') || lower.includes('legal') || lower.includes('police') || lower.includes('fir')) {
        return `### ⚖️ Essential Citizen Protective Statutes (Equal Voice Equal Choice Initiative)

Knowledge is protective power. Here are crucial legal definitions designed to support all citizens in danger:

1. **Zero FIR Protocol**:
   - Under statutory criminal law codes, any urgent physical assault, robbery, or severe harassment complaint can be initiated at **ANY** police zone. It is a severe infraction for a station desk to refuse you. They must take the entry and transfer it to the correct precinct.
2. **Protection Against Digital Extortion (Boys & Men)**:
   - Cyber-extortion via compromised video-calls or blackmail falls under digital bullying provisions. Report these threats directly to cyber enforcement cells. Never pay blackmailers; block communication immediately and preserve evidence receipts using our secured Evidence locker.
3. **Custody Limits on Women**:
   - Statutory provisions require that no female citizen may be formally arrested under night bounds (post 6 PM and pre 6 AM) except under rare, high-level magistrate directives.
4. **General Grievance Neutrality**:
   - Legal codes are increasingly gender-inclusive. Emergency aid and safety laws protect survivors of violence regardless of gender. Equal Voice Equal Choice stands for equal access to justice.`;
      }

      if (lower.includes('fight') || lower.includes('self-defense') || lower.includes('attack') || lower.includes('grab') || lower.includes('defense') || lower.includes('physical')) {
        return `### 🥋 Micro Self-Defense Combat Strategy

Under severe physical threat, prioritize creating an opportunity for escape. Maintain a confident, balanced stance:

1. **Target Vulnerable Soft Zones**:
   - **Nose Cartilage**: Thrust with your open palm base upward into the base of the attacker's nose.
   - **Eye Sockets**: Drive thumbs or index fingers directly inward.
   - **Groin & Shins**: Deliver a heavy straight foot kick or sharp knee thrust to the groin.
2. **Wrist Grasp Counter-Move**:
   - Do not pull directly backward against their fingers. Rotate your wrist toward their thumb (the weakest point of any grip) and pull with explosive, sudden leverage.
   - Use your other hand to lock their thumb down and twist away.
3. **Bear-Hug Escape**:
   - If grabbed from behind, execute a sudden headbutt backward into their nose, stamp heavily on their instep/feet with your heel, and twist out.
4. **Raise Voice Alarm**:
   - Shout **"FIRE!"** instead of "Help", as the word "fire" triggers immediate bystander curiosity and active reaction. Active search lights or sirens in the application should be blasted continuously.`;
      }

      if (lower.includes('first-aid') || lower.includes('first aid') || lower.includes('accident') || lower.includes('bleed') || lower.includes('cpr') || lower.includes('hurt')) {
        return `### 🩹 Step-by-Step Emergency First-Aid Guidelines

*Always prioritize dialing municipal emergency medical lines immediately.* Under temporary suspension of aid:

1. **For Massive External Bleeding**:
   - Apply continuous, direct, heavy pressure on the source wound using sterile gauze or any clean fabric.
   - Separate and elevate the wounded limb above heart level to naturally decrease flow pressure.
2. **Handling Bone Fractures & Sprains**:
   - **Do not** attempt to splint/re-align the bone. Gently splint/immobilize the joint above and below the site using rigid material (cardboard, wood) and light strapping.
3. **Mild Surface Burns**:
   - Flush the area immediately under cool, running tap water for at least 15-20 minutes. Do not apply ice, grease, or butter: these trap heat.
4. **Bystander CPR (Hands-Only)**:
   - If an adult is unresponsive and not breathing properly, place your hands centered on the chest and perform rapid, high-pressure compressions (100-120 per minute) to the beat of "Stayin Alive".`;
      }

      if (lower.includes('streetlight') || lower.includes('dark') || lower.includes('safe-zone') || lower.includes('route') || lower.includes('map')) {
        return `### 🗺️ Dynamic Safe Navigation Tips

When traversing low-safety, poorly lit streets:
1. **Pre-Plan with Safe Routes**: Always use the **Equal Voice Equal Choice live mapping engine** to view community safety hazard flags, like reports about dark streetlights or known suspicious zones.
2. **Look Confident & Decisive**: Walk with high chest up, hands outside pockets (ready to react), and do not stare constantly down at your phone screen!
3. **The 2-Earbud Redundancy Rule**: Remove at least one earbud (or keep volume low) so you can sense approaching bikes, footsteps, or vehicle accelerations.
4. **Virtual Companion Safeguard**: Deploy the **Check-In Prompts** section. It keeps an eye on you—if you miss confirm tap during a dangerous crossing, emergency messages are immediately prepared.`;
      }

      return `### 💡 Equal Voice Equal Choice Safety Advisor

Thank you for consulting the portal. I am here to assist all community members (men, women, and non-binary individuals) with highly active resources.

Here is what you can ask me:
- ⚖️ **"What is a Zero FIR or digital civil defense rights?"**
- 🥋 **"How do I escape a physical grab or soft-target attack?"**
- 🩹 **"Give me first aid steps for sudden bleeding or accidents."**
- 🗺️ **"What are the best precautions for walking unlit routes?"**

*For absolute, immediate threats, trigger the high-decibel Siren in our app or deploy the large Red SOS switch to broadcast coordinates right away!*`;
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY is not defined. Initiating smart fallback response.');
        return res.json({ text: fallbackResponse(message) });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      // Construct conversational contents payload
      const contentsList: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contentsList.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }

      // Add user message
      contentsList.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const systemPrompt = `You are Equal Voice Equal Choice's AI Safety & Legal Assistant, an intelligent, empathetic, and highly authoritative civic safety companion.
Your primary objective is to provide useful, actionable, and state-specific safety instruction, self-defense moves, legal definitions (including Zero FIR protocols or cyber-extortion safeguards), and first-aid checklists. You support both women and men equally, ensuring inclusive security.

Key Directives:
1. Maintain an inclusive approach with equal concern for both women and men. Provide tailored protection recommendations where relevant.
2. For self-defense questions, offer highly practical, step-by-step physical block/counter tactics.
3. For legal questions, cite applicable protective articles or public provisions objectively and accurately.
4. For medical emergencies or accidents, give safe, step-by-step Red Cross or medical first-aid guidance clearly first (with a strong reminder to dial professional emergency numbers).
5. Always respond in markdown format. Be concise, highly professional, supportive, and clear. Avoid any generic disclaimers or marketing hype. Deliver direct value.`;

      // Call Gemini API using modern SDK structure with highly robust model fallback
      let response;
      try {
        console.log('Attempting chat completion with primary model gemini-3.5-flash');
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: contentsList,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          }
        });
      } catch (firstErr: any) {
        console.warn('Primary model gemini-3.5-flash failed (possibly 503 overloaded). Retrying with gemini-flash-latest...', firstErr.message || firstErr);
        try {
          response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: contentsList,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            }
          });
        } catch (secondErr: any) {
          console.error('Secondary model gemini-flash-latest also failed:', secondErr.message || secondErr);
          throw secondErr; // Bubble up to outer catch to invoke local fallbackResponse
        }
      }

      const text = (response && response.text) || fallbackResponse(message);
      res.json({ text });
    } catch (err: any) {
      console.warn('Error during Gemini API call, triggering fallback response:', err);
      res.json({ text: fallbackResponse(message) });
    }
  });

  // 5. Integrate Vite middle-ware or serve static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
