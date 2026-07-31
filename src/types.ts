/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Player {
  id: string;
  name: string;
  isTeamPlay: boolean;
  teamName?: string;
  office: string;
  avatar: string; // e.g., 'Cyber-Robot'
  isHost: boolean;
  isReady: boolean;
  points: number;
}

export interface Story {
  playerId: string;
  playerName: string;
  storyText: string;
  isTruth: boolean; // true = Truth, false = Lie
  round: number;
}

export interface Vote {
  voterId: string;
  storyPlayerId: string;
  isTruthVote: boolean; // what the voter guessed: true = Truth, false = Lie
  round: number;
}

export type GamePhase = 'LOBBY' | 'PROFILE' | 'INTEL' | 'VOTING' | 'REVEAL' | 'FINAL_ROAST' | 'MACRO_LEADERBOARD';

export interface RoomState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  stories: Story[];
  votes: Vote[];
  currentRound: number; // 1 to totalRounds
  totalRounds: number; // e.g., 3 or 5
  currentInterrogatedIndex: number; // Index of player being interrogated in current round
  isLocked: boolean;
  finalRoast: string | null;
  winnerId: string | null;
}

export interface OfficeLeaderboardEntry {
  rank: number;
  office: string;
  points: number;
  profile: string;
}

export const OFFICES = [
  "Cyberjaya",
  "Ipoh",
  "Melaka",
  "Malta",
  "Dubai",
  "Cyprus",
  "London",
  "Kigali",
  "Paris",
  "Asunción",
  "Ciudad del Este",
  "George Town (Cayman Islands)",
  "Port Vanuatu"
];

export const AVATARS = [
  { id: "Cyber-Robot", label: "🤖 Cyber-Robot", color: "from-cyan-400 to-blue-500" },
  { id: "Wise Owl", label: "🦉 Wise Owl", color: "from-amber-400 to-amber-600" },
  { id: "Astronaut", label: "🧑‍🚀 Astronaut", color: "from-indigo-400 to-purple-600" },
  { id: "Bulldog", label: "🐶 Bulldog", color: "from-orange-400 to-red-500" },
  { id: "Cyber-Cat", label: "🐱 Cyber-Cat", color: "from-pink-400 to-rose-500" },
  { id: "Neon Fox", label: "🦊 Neon Fox", color: "from-yellow-400 to-orange-500" },
  { id: "Alpha Lion", label: "🦁 Alpha Lion", color: "from-yellow-500 to-amber-600" },
  { id: "Zen Panda", label: "🐼 Zen Panda", color: "from-emerald-400 to-teal-600" },
  { id: "Chill Koala", label: "🐨 Chill Koala", color: "from-green-400 to-emerald-500" },
  { id: "Crypto Unicorn", label: "🦄 Crypto Unicorn", color: "from-fuchsia-400 to-pink-600" }
];
