/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { OFFICES, AVATARS } from "./src/types.ts";
import type { RoomState, Player, OfficeLeaderboardEntry } from "./src/types.ts";

dotenv.config();

const app = express();
const jsonParser = express.json();
app.use((req, res, next) => {
  // Vercel's Node helper may populate req.body before Express runs. Avoid
  // reading the already-consumed request stream a second time.
  if (req.body !== undefined) {
    next();
    return;
  }
  jsonParser(req, res, next);
});

const PORT = Number(process.env.PORT) || 3000;

// In-memory databases
const rooms: { [code: string]: RoomState } = {};

const macroLeaderboard: OfficeLeaderboardEntry[] = [
  { rank: 1, office: "Cyberjaya", points: 12450, profile: "Structural Deception Experts" },
  { rank: 2, office: "London", points: 11200, profile: "Uncomfortably Honest" },
  { rank: 3, office: "Malta", points: 9850, profile: "Imaginative Narrative Designers" },
  { rank: 4, office: "Ipoh", points: 9100, profile: "Tactical Counter-Strategists" },
  { rank: 5, office: "Paris", points: 4200, profile: "Artistic Exaggerators" },
  { rank: 6, office: "Melaka", points: 3800, profile: "Strategic Whispers" },
  { rank: 7, office: "Dubai", points: 3100, profile: "Opulent Storytellers" },
  { rank: 8, office: "Asunción", points: 2750, profile: "High-Speed Fabulists" },
  { rank: 9, office: "Cyprus", points: 2100, profile: "Offshore Mythmakers" }
];

// Helper to generate a room code: DV-XXXX (e.g., DV-8841)
function generateRoomCode(): string {
  let code = "";
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `DV-${num}`;
  } while (rooms[code]);
  return code;
}

// Lazy-initialize Gemini Client to prevent crash if key is missing
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is missing. Fallen back to procedural roasts.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Preset funny stories for AI Simulated Players
const AI_STORY_POOL = [
  { text: "I once accidentally muted myself during an all-hands and spent 10 minutes gesturing wildly before realizing.", isTruth: true },
  { text: "I convinced my team that my laptop was voice-activated, and they spent an hour shouting at their screens.", isTruth: false },
  { text: "I was locked in the Cyberjaya server room for three hours and had to survive on stale pantry biscuits.", isTruth: true },
  { text: "I accidentally submitted a secret recipe for garlic bread instead of my quarterly performance review.", isTruth: false },
  { text: "I bought a giant dinosaur onesie on corporate expense claiming it was 'vital compliance equipment' for my office chair.", isTruth: false },
  { text: "I once fell asleep on a Zoom call with the regional director and my snore was mistaken for a server fan buzzing.", isTruth: true },
  { text: "I spent three weeks answering support tickets using only quotes from Shakespeare and my customer satisfaction rating went UP.", isTruth: false },
  { text: "I was secretly the mascot for my local office party and had to dance in front of the regional manager while wearing a giant koala suit.", isTruth: true },
  { text: "I've been using an AI virtual avatar in meetings since October and nobody has noticed my hair is actually blue now.", isTruth: false },
  { text: "I once joined an executive budget meeting while wearing a giant dinosaur onesie by accident.", isTruth: true }
];

// Helper to get random stories for AI players
function getRandomAIStory(): { text: string; isTruth: boolean } {
  const index = Math.floor(Math.random() * AI_STORY_POOL.length);
  return AI_STORY_POOL[index];
}

// AI Player definitions
const AI_PEER_TEMPLATES = [
  { name: "Sarah", office: "Cyberjaya", avatar: "Cyber-Robot" },
  { name: "Jean-Pierre", office: "Paris", avatar: "Neon Fox" },
  { name: "Alex", office: "Malta", avatar: "Wise Owl" },
  { name: "David", office: "London", avatar: "Bulldog" }
];

// ---------------- API ENDPOINTS ----------------

// Get macro leaderboard
app.get("/api/leaderboard", (req, res) => {
  res.json(macroLeaderboard);
});

// Used by deployments and monitoring to verify that the API function is live.
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Create Room
app.post("/api/rooms", (req, res) => {
  const code = generateRoomCode();
  const room: RoomState = {
    roomCode: code,
    phase: "LOBBY",
    players: [],
    stories: [],
    votes: [],
    currentRound: 1,
    totalRounds: 5, // Default to 5
    currentInterrogatedIndex: 0,
    isLocked: false,
    finalRoast: null,
    winnerId: null
  };
  rooms[code] = room;
  res.status(201).json(room);
});

// Update total rounds (LOBBY phase only)
app.post("/api/rooms/:code/rounds", (req, res) => {
  const { code } = req.params;
  const { totalRounds } = req.body;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  if (room.isLocked) {
    return res.status(400).json({ error: "Cannot change rounds after game starts." });
  }

  if (totalRounds === 3 || totalRounds === 5) {
    room.totalRounds = totalRounds;
    return res.json(room);
  } else {
    return res.status(400).json({ error: "Rounds must be 3 or 5." });
  }
});

// Join Room
app.post("/api/rooms/:code/join", (req, res) => {
  const { code } = req.params;
  const { playerId, name } = req.body;
  const room = rooms[code.toUpperCase()];

  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  if (room.isLocked) {
    return res.status(400).json({ error: "Lobby is locked. Game has already begun." });
  }

  // Check if player already in room
  let player = room.players.find(p => p.id === playerId);
  if (!player) {
    const isHost = room.players.length === 0;
    player = {
      id: playerId || `usr_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Player ${room.players.length + 1}`,
      isTeamPlay: false,
      office: OFFICES[0],
      avatar: AVATARS[0].id,
      isHost,
      isReady: false,
      points: 0
    };
    room.players.push(player);
  }

  res.json({ player, room });
});

// Get Room Status
app.get("/api/rooms/:code", (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }
  res.json(room);
});

// Add Simulated AI Peers
app.post("/api/rooms/:code/simulate-peers", (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  // Add 3 simulated peers if not already added
  let addedCount = 0;
  AI_PEER_TEMPLATES.forEach(tmpl => {
    const id = `ai_${tmpl.name.toLowerCase()}`;
    if (!room.players.some(p => p.id === id)) {
      let aiName = tmpl.name;
      let counter = 1;
      while (room.players.some(p => p.name.trim().toLowerCase() === aiName.trim().toLowerCase())) {
        aiName = `${tmpl.name} ${counter}`;
        counter++;
      }

      room.players.push({
        id,
        name: aiName,
        isTeamPlay: false,
        office: tmpl.office,
        avatar: tmpl.avatar,
        isHost: false,
        isReady: true, // Auto ready
        points: 0
      });
      addedCount++;
    }
  });

  res.json({ message: `Added ${addedCount} AI colleagues to the lobby!`, room });
});

// Update Player Profile
app.post("/api/rooms/:code/profile", (req, res) => {
  const { code } = req.params;
  const { playerId, name, isTeamPlay, teamName, office, avatar, isReady } = req.body;
  const room = rooms[code.toUpperCase()];

  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Player not found." });
  }

  if (name && name.trim()) {
    const trimmedName = name.trim().toLowerCase();
    const isDuplicate = room.players.some(
      p => p.id !== playerId && p.name.trim().toLowerCase() === trimmedName
    );
    if (isDuplicate) {
      return res.status(400).json({ error: `The name "${name.trim()}" is already taken by another colleague in this room.` });
    }
  }

  player.name = name ? name.trim() : player.name;
  player.isTeamPlay = false;
  player.teamName = undefined;
  player.office = office || player.office;
  player.avatar = avatar || player.avatar;
  player.isReady = isReady !== undefined ? isReady : player.isReady;

  // If this is a simulated peer trigger or if we are the host, check lock
  res.json(room);
});

// Host Lock Lobby & Begin Profile setup
app.post("/api/rooms/:code/lock-lobby", (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  room.isLocked = true;
  room.phase = "PROFILE";
  res.json(room);
});

// Transmit Persona (Ready / Commit Setup)
app.post("/api/rooms/:code/transmit-persona", (req, res) => {
  const { code } = req.params;
  const { playerId } = req.body;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = true;
  }

  // If all players (human and AI) are ready, move to INTEL phase
  const allReady = room.players.every(p => p.isReady);
  if (allReady && room.players.length > 0) {
    room.phase = "INTEL";
    // Reset player ready states for story submission
    room.players.forEach(p => p.isReady = false);
  }

  res.json(room);
});

// Submit Secret Intel (Story)
app.post("/api/rooms/:code/story", (req, res) => {
  const { code } = req.params;
  const { playerId, storyText, isTruth } = req.body;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  const player = room.players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ error: "Player not found." });

  // Add/replace story for this player in this round
  room.stories = room.stories.filter(s => !(s.playerId === playerId && s.round === room.currentRound));
  room.stories.push({
    playerId,
    playerName: player.name,
    storyText,
    isTruth,
    round: room.currentRound
  });

  player.isReady = true;

  // Auto-generate stories for any AI players who haven't submitted yet
  room.players.forEach(p => {
    if (p.id.startsWith("ai_")) {
      const hasStory = room.stories.some(s => s.playerId === p.id && s.round === room.currentRound);
      if (!hasStory) {
        const mockIntel = getRandomAIStory();
        room.stories.push({
          playerId: p.id,
          playerName: p.name,
          storyText: mockIntel.text,
          isTruth: mockIntel.isTruth,
          round: room.currentRound
        });
        p.isReady = true;
      }
    }
  });

  // If all players have submitted, move to VOTING phase
  const allStoriesIn = room.players.every(p => 
    room.stories.some(s => s.playerId === p.id && s.round === room.currentRound)
  );

  if (allStoriesIn) {
    room.phase = "VOTING";
    room.currentInterrogatedIndex = 0;
    // Reset ready states for voting
    room.players.forEach(p => p.isReady = false);
    room.votes = room.votes.filter(v => v.round !== room.currentRound); // clear votes for this round
  }

  res.json(room);
});

// Submit Vote
app.post("/api/rooms/:code/vote", (req, res) => {
  const { code } = req.params;
  const { playerId, isTruthVote } = req.body;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  const activeInterrogatedPlayer = room.players[room.currentInterrogatedIndex];
  if (!activeInterrogatedPlayer) return res.status(400).json({ error: "No player being interrogated right now." });

  // Record/replace vote
  room.votes = room.votes.filter(v => !(v.voterId === playerId && v.storyPlayerId === activeInterrogatedPlayer.id && v.round === room.currentRound));
  room.votes.push({
    voterId: playerId,
    storyPlayerId: activeInterrogatedPlayer.id,
    isTruthVote,
    round: room.currentRound
  });

  // Highlight player as ready (has voted)
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = true;
  }

  // Auto-generate votes for AI players
  room.players.forEach(p => {
    if (p.id.startsWith("ai_") && p.id !== activeInterrogatedPlayer.id) {
      const hasVoted = room.votes.some(v => v.voterId === p.id && v.storyPlayerId === activeInterrogatedPlayer.id && v.round === room.currentRound);
      if (!hasVoted) {
        // AI player voting strategy:
        // Get the real story status
        const realStory = room.stories.find(s => s.playerId === activeInterrogatedPlayer.id && s.round === room.currentRound);
        let aiGuess = true;
        if (realStory) {
          if (realStory.isTruth) {
            // 65% chance of guessing Truth (correct)
            aiGuess = Math.random() < 0.65;
          } else {
            // 50% chance of guessing Truth (fooled)
            aiGuess = Math.random() < 0.50;
          }
        }
        room.votes.push({
          voterId: p.id,
          storyPlayerId: activeInterrogatedPlayer.id,
          isTruthVote: aiGuess,
          round: room.currentRound
        });
        p.isReady = true;
      }
    }
  });

  // Check if all eligible voters have voted.
  // Eligible voters are everyone except the player being interrogated.
  const eligibleVoters = room.players.filter(p => p.id !== activeInterrogatedPlayer.id);
  const allVoted = eligibleVoters.every(voter => 
    room.votes.some(v => v.voterId === voter.id && v.storyPlayerId === activeInterrogatedPlayer.id && v.round === room.currentRound)
  );

  if (allVoted) {
    // Lock voting and move to REVEAL phase!
    room.phase = "REVEAL";
    
    // Calculate points for this interrogation
    const currentStory = room.stories.find(s => s.playerId === activeInterrogatedPlayer.id && s.round === room.currentRound);
    if (currentStory) {
      const actualReality = currentStory.isTruth;
      const roundVotes = room.votes.filter(v => v.storyPlayerId === activeInterrogatedPlayer.id && v.round === room.currentRound);
      
      let fooledCount = 0;
      let correctCount = 0;

      roundVotes.forEach(vote => {
        const voter = room.players.find(p => p.id === vote.voterId);
        if (voter) {
          if (vote.isTruthVote === actualReality) {
            // Guessed correctly! +1 pt
            voter.points += 1;
            correctCount++;
          } else {
            fooledCount++;
          }
        }
      });

      // If interrogated player fooled the majority (fooledCount > correctCount)
      // or at least half in case of even voters, let's say: fooledCount > correctCount
      if (roundVotes.length > 0 && fooledCount > correctCount) {
        activeInterrogatedPlayer.points += 2;
      }
    }
  }

  res.json(room);
});

// Next Story / Round progression
app.post("/api/rooms/:code/next", (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  // Move to next story or next round
  if (room.currentInterrogatedIndex < room.players.length - 1) {
    // Next player in the same round
    room.currentInterrogatedIndex += 1;
    room.phase = "VOTING";
    room.players.forEach(p => p.isReady = false);
  } else {
    // All players interrogated in this round!
    if (room.currentRound < room.totalRounds) {
      // Advance to next round
      room.currentRound += 1;
      room.currentInterrogatedIndex = 0;
      room.phase = "INTEL";
      // Clear stories and votes for the new round
      // room.stories = []; // Keep old stories if we want log, but we filter by round anyway
      room.players.forEach(p => p.isReady = false);
    } else {
      // End of All Rounds! Time to initiate FINAL_ROAST
      room.phase = "FINAL_ROAST";
      
      // Calculate Winner
      let winner: Player | null = null;
      let maxPoints = -1;
      room.players.forEach(p => {
        if (p.points > maxPoints) {
          maxPoints = p.points;
          winner = p;
        }
      });
      room.winnerId = winner ? (winner as Player).id : null;

      // Update the Macro Leaderboard!
      // Add each player's active game points to their regional office aggregate
      room.players.forEach(p => {
        const entry = macroLeaderboard.find(item => item.office.toLowerCase() === p.office.toLowerCase());
        if (entry) {
          entry.points += p.points;
        } else {
          // Add new office if not exists
          macroLeaderboard.push({
            rank: macroLeaderboard.length + 1,
            office: p.office,
            points: p.points,
            profile: "Rising Strategic Fabulists"
          });
        }
      });

      // Re-sort macro leaderboard
      macroLeaderboard.sort((a, b) => b.points - a.points);
      macroLeaderboard.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });
    }
  }

  res.json(room);
});

// Trigger Gemini Roast / AI Judgment
app.post("/api/rooms/:code/roast", async (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  // Compile game metrics for Gemini
  const playersSummary = room.players.map(p => {
    return `${p.name} from ${p.office} (${p.avatar}) got ${p.points} points.`;
  }).join("\n");

  const storiesSummary = room.stories.map(s => {
    return `- ${s.playerName} (${s.isTruth ? 'TRUTH' : 'LIE'}): "${s.storyText}"`;
  }).join("\n");

  const winner = room.players.find(p => p.id === room.winnerId);
  const winnerName = winner ? winner.name : "Someone";
  const winnerOffice = winner ? winner.office : "Unknown";

  // Identify lowest scoring office/player
  let lowestPlayer = room.players[0];
  room.players.forEach(p => {
    if (p.points < lowestPlayer.points) {
      lowestPlayer = p;
    }
  });

  const prompt = `
    You are the central core AI of DERIV GIGGLEGUESS. Write a sarcastic, extremely funny, and casual roast of this team-building game session at Deriv (an online trading and fintech company).
    
    Make it super funny and use SIMPLE, EASY-TO-UNDERSTAND English. Do NOT use dry, boring corporate jargon or complex words. Use everyday, witty, and conversational language.
    
    The team just finished ${room.totalRounds} rounds of detecting lies and sharing outrageous workplace stories.
    
    Here is the player data:
    ${playersSummary}
    
    Here are the stories submitted:
    ${storiesSummary}
    
    The champion (Ultimate Truth-Weaver) is ${winnerName} from the ${winnerOffice} office.
    The player who performed the worst (or let down their team) is ${lowestPlayer.name} from the ${lowestPlayer.office} office.
    
    Rules for the roast:
    1. Write exactly 3-4 short, punchy sentences in simple English.
    2. Roast ${winnerName} for having a hilariously convincing poker face (or being a certified liar).
    3. Gently mock ${lowestPlayer.name} or the ${lowestPlayer.office} office for failing basic truth-detection (e.g. they would believe anything, even that the office coffee is actually good).
    4. Keep it under 120 words.
    5. No generic greetings or dry introductions. Write a single, highly readable, laugh-out-loud funny paragraph.
  `;

  const client = getGeminiClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.85
        }
      });

      const text = response.text || "";
      room.finalRoast = text.trim();
      res.json({ roast: room.finalRoast });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Fallback
      room.finalRoast = generateFallbackRoast(winnerName, winnerOffice, lowestPlayer.name, lowestPlayer.office, room);
      res.json({ roast: room.finalRoast, error: err.message });
    }
  } else {
    // Generate beautiful procedural fallback roast if API key missing
    room.finalRoast = generateFallbackRoast(winnerName, winnerOffice, lowestPlayer.name, lowestPlayer.office, room);
    res.json({ roast: room.finalRoast });
  }
});

function generateFallbackRoast(winnerName: string, winnerOffice: string, lowestName: string, lowestOffice: string, room: RoomState): string {
  // Find a story of the winner to roast
  const winnerStory = room.stories.find(s => s.playerId === room.winnerId);
  const storyExcerpt = winnerStory ? `that "${winnerStory.storyText.substring(0, 40)}..."` : "their crazy stories";
  
  return `Wow, ${winnerName} from the ${winnerOffice} office is officially a master liar! They actually got everyone to believe ${storyExcerpt}. Meanwhile, ${lowestName} from the ${lowestOffice} office has zero detective skills and got fooled by literally everything. Please practice your lying skills before our next team meeting, everyone!`;
}

// Play a new session (reset game, keep players but reset scores)
app.post("/api/rooms/:code/reset", (req, res) => {
  const { code } = req.params;
  const room = rooms[code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found." });

  room.phase = "INTEL"; // Go back to secret intel input directly
  room.currentRound = 1;
  room.currentInterrogatedIndex = 0;
  room.stories = [];
  room.votes = [];
  room.finalRoast = null;
  room.winnerId = null;
  
  // Reset player scores and ready state
  room.players.forEach(p => {
    p.points = 0;
    p.isReady = false;
  });

  res.json(room);
});


// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite and Rollup are development-only dependencies. Loading them lazily
    // keeps their native bindings out of Vercel Function cold starts.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Vercel imports the Express app as a serverless function. Only open a network
// port when this file is run as the standalone local/Node server.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
