/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { RoomState, Player } from "../types";
import { 
  Screen1Gateway, 
  Screen2Persona, 
  Screen3SecretIntel, 
  Screen4VotingArena, 
  Screen5RevealScoreboard, 
  Screen6AIJudgment, 
  Screen7Leaderboard 
} from "./Screens";
import PlaygroundDirector from "./PlaygroundDirector";
import { Trophy, Crown, Users } from "lucide-react";
import { playSound } from "../utils/audio";

interface GameClientProps {
  playerId: string;
  clientTitle: string;
  defaultName?: string;
  defaultOffice?: string;
  defaultAvatar?: string;
  defaultTeam?: string;
  sharedRoomCode: string | null;
  onRoomCreatedOrJoined: (code: string) => void;
  onExitRoom: () => void;
  isCompact?: boolean;
}

export default function GameClient({
  playerId,
  clientTitle,
  defaultName,
  defaultOffice,
  defaultAvatar,
  defaultTeam,
  sharedRoomCode,
  onRoomCreatedOrJoined,
  onExitRoom,
  isCompact = false
}: GameClientProps) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingRoast, setIsGeneratingRoast] = useState(false);
  const [macroLeaderboardView, setMacroLeaderboardView] = useState(false);

  // Sync Room State via Polling (Every 2 seconds)
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${room.roomCode}`);
        if (res.ok) {
          const updatedRoom: RoomState = await res.json();
          setRoom(updatedRoom);
        } else if (res.status === 404) {
          setRoom(null);
          setError("Session expired or playground was closed.");
        }
      } catch (err) {
        console.error("Failed to sync room state:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.roomCode]);

  // Synchronize with external shared room code (for multi-screen sync)
  useEffect(() => {
    if (sharedRoomCode && (!room || room.roomCode !== sharedRoomCode)) {
      handleJoinRoom(sharedRoomCode);
    } else if (!sharedRoomCode && room) {
      setRoom(null);
    }
  }, [sharedRoomCode]);

  // Audio Sync Trigger Effect (observes room state and triggers synthesized chimes on transition)
  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundRef = useRef<number | null>(null);
  const prevInterrogatedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!room) {
      prevPhaseRef.current = null;
      prevRoundRef.current = null;
      prevInterrogatedRef.current = null;
      return;
    }

    const prevPhase = prevPhaseRef.current;
    const prevRound = prevRoundRef.current;
    const prevInterrogated = prevInterrogatedRef.current;

    // Trigger synced audio chimes based on phase transitions
    if (prevPhase !== null && room.phase !== prevPhase) {
      if (room.phase === "PROFILE" || room.phase === "INTEL" || room.phase === "VOTING") {
        playSound.roundStarted();
      } else if (room.phase === "REVEAL" || room.phase === "FINAL_ROAST") {
        playSound.scoreboardReveal();
      }
    } else if (prevPhase === "VOTING" && room.phase === "VOTING") {
      // If phase remains VOTING, but the interrogated player changes, play round started chime!
      if (prevInterrogated !== null && room.currentInterrogatedIndex !== prevInterrogated) {
        playSound.roundStarted();
      }
    }

    // Persist refs
    prevPhaseRef.current = room.phase;
    prevRoundRef.current = room.currentRound;
    prevInterrogatedRef.current = room.currentInterrogatedIndex;
  }, [room?.phase, room?.currentRound, room?.currentInterrogatedIndex]);

  // Create active Room (Lobby)
  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Playground service unavailable (${res.status}).`);
      }

      const createdRoom: RoomState = await res.json();
      await joinRoomAPI(createdRoom.roomCode);
      onRoomCreatedOrJoined(createdRoom.roomCode);
    } catch (err: any) {
      setError(err?.message || "Failed to initialize playground. Try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Join existing Room (Lobby)
  const handleJoinRoom = async (code: string) => {
    if (!code) return;
    setIsConnecting(true);
    setError(null);
    try {
      await joinRoomAPI(code.trim().toUpperCase());
    } catch (err: any) {
      setError(err?.message || "Failed to sync device. Check code and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const joinRoomAPI = async (code: string) => {
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Unable to join playground (${res.status}).`);
    }

    const { room: joinedRoom } = await res.json();
    setRoom(joinedRoom);
    playSound.roomJoined();

    // Auto-set the custom profile if defaults were supplied
    if (defaultName) {
      const profileRes = await fetch(`/api/rooms/${code}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          name: defaultName,
          isTeamPlay: !!defaultTeam,
          teamName: defaultTeam || "",
          office: defaultOffice || "Cyberjaya",
          avatar: defaultAvatar || "Cyber-Robot",
          isReady: false
        })
      });

      if (!profileRes.ok) {
        const data = await profileRes.json().catch(() => null);
        throw new Error(data?.error || `Unable to save player profile (${profileRes.status}).`);
      }
    }
  };

  // Host locks lobby and moves to PROFILE phase
  const handleLockLobby = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/lock-lobby`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Host updates round count
  const handleUpdateRounds = async (rounds: number) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalRounds: rounds })
      });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
      }
    } catch (err) {
      console.error("Failed to update rounds:", err);
    }
  };

  // Transmit profile identity Setup
  const handleTransmitPersona = async (profile: {
    name: string;
    isTeamPlay: boolean;
    teamName?: string;
    office: string;
    avatar: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!room) return { success: false, error: "No active playground session." };
    try {
      const profileRes = await fetch(`/api/rooms/${room.roomCode}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...profile })
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        return { success: false, error: errData.error || "Name selection failed." };
      }

      const res = await fetch(`/api/rooms/${room.roomCode}/transmit-persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });

      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || "Failed to finalize persona." };
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, error: "Network connection failure. Please try again." };
    }
  };

  // Submit Secret Intel (Story for current round)
  const handleSubmitIntel = async (storyText: string, isTruth: boolean) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, storyText, isTruth })
      });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
        playSound.secretSubmitted();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cast vote on interrogated player
  const handleCastVote = async (isTruthVote: boolean) => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, isTruthVote })
      });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
        playSound.voteCast();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Host triggers progression to next story or round
  const handleNextRound = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/next`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Request secure organization roast from Gemini
  const handleGenerateRoast = async () => {
    if (!room) return;
    setIsGeneratingRoast(true);
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/roast`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        if (updated.roast) {
          setRoom(prev => prev ? { ...prev, finalRoast: updated.roast } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsGeneratingRoast(false);
  };

  // Restart new session
  const handlePlayAgain = async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/reset`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setRoom(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Exit game room
  const handleExitRoom = () => {
    setRoom(null);
    setMacroLeaderboardView(false);
    setJoinCodeInput("");
    onExitRoom();
  };

  // Determine current active phase view
  const getActiveView = () => {
    if (macroLeaderboardView) {
      return (
        <Screen7Leaderboard 
          room={room} 
          playerId={playerId} 
          onBackToMain={() => setMacroLeaderboardView(false)} 
        />
      );
    }

    if (!room) {
      return (
        <Screen1Gateway
          room={null}
          playerId={playerId}
          joinCodeInput={joinCodeInput}
          setJoinCodeInput={setJoinCodeInput}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLockLobby={handleLockLobby}
          onUpdateRounds={handleUpdateRounds}
          isConnecting={isConnecting}
          error={error}
        />
      );
    }

    switch (room.phase) {
      case "LOBBY":
        return (
          <Screen1Gateway
            room={room}
            playerId={playerId}
            joinCodeInput={joinCodeInput}
            setJoinCodeInput={setJoinCodeInput}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLockLobby={handleLockLobby}
            onUpdateRounds={handleUpdateRounds}
            isConnecting={isConnecting}
            error={error}
          />
        );
      case "PROFILE":
        return (
          <Screen2Persona
            room={room}
            playerId={playerId}
            onTransmitPersona={handleTransmitPersona}
          />
        );
      case "INTEL":
        return (
          <Screen3SecretIntel
            room={room}
            playerId={playerId}
            onSubmitIntel={handleSubmitIntel}
          />
        );
      case "VOTING":
        return (
          <Screen4VotingArena
            room={room}
            playerId={playerId}
            onCastVote={handleCastVote}
          />
        );
      case "REVEAL":
        return (
          <Screen5RevealScoreboard
            room={room}
            playerId={playerId}
            onNextRound={handleNextRound}
          />
        );
      case "FINAL_ROAST":
        return (
          <Screen6AIJudgment
            room={room}
            playerId={playerId}
            onViewLeaderboard={() => setMacroLeaderboardView(true)}
            onPlayAgain={handlePlayAgain}
            onGenerateRoast={handleGenerateRoast}
            isGeneratingRoast={isGeneratingRoast}
          />
        );
      default:
        return (
          <Screen1Gateway
            room={null}
            playerId={playerId}
            joinCodeInput={joinCodeInput}
            setJoinCodeInput={setJoinCodeInput}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLockLobby={handleLockLobby}
            onUpdateRounds={handleUpdateRounds}
            isConnecting={isConnecting}
            error={error}
          />
        );
    }
  };

  return (
    <div className={`w-full bg-[#1E2022] overflow-hidden relative border-0 rounded-[40px] border-neutral-900 flex flex-col justify-between ${
      isCompact ? "h-[620px] shadow-lg border-2 border-white/5" : "h-[880px] shadow-2xl border-8"
    }`}>
      {/* Client Label Ticker (Highly Useful for Sandbox Mode) */}
      <div className="bg-[#141516] px-4 py-2 flex items-center justify-between border-b border-white/5 text-[10px] font-mono tracking-wider">
        <span className="text-[#FF574A] font-bold uppercase">{clientTitle}</span>
        <span className="text-white/40 font-bold">PORTAL ID: {playerId.substring(0, 8)}...</span>
      </div>

      {/* Phone Speaker & Camera Notch top */}
      {!isCompact && (
        <div className="hidden sm:flex absolute top-10 inset-x-0 h-6 bg-neutral-900 justify-center items-center z-40 rounded-b-xl">
          <div className="w-16 h-3 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-900/50 mr-2"></div>
            <div className="w-8 h-1 bg-neutral-800 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Global mini header inside phone view */}
      <header className={`bg-[#1E2022] border-b border-white/10 px-4 py-3.5 flex items-center justify-between z-20 ${
        !isCompact ? "sm:pt-16 sm:mt-2" : "pt-2"
      }`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleExitRoom}>
          <div className="w-7 h-7 bg-[#FF574A] rounded-lg flex items-center justify-center font-black text-sm text-white shadow-md shadow-[#FF574A]/10">D</div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-[#FF574A]">DERIV</span>
            <span className="text-[7px] tracking-[0.1em] text-white/50 font-semibold uppercase">GiggleGuess</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {room && (
            <div className="flex items-center gap-2 pr-1">
              {room.players.find(p => p.id === playerId)?.isHost ? (
                <span className="text-[9px] bg-[#FF574A]/10 border border-[#FF574A]/20 text-[#FF574A] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-[#FF574A]" /> HOST
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 text-emerald-400" /> PLAYER
                </span>
              )}
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-white/40 uppercase font-bold tracking-wider">Room</span>
                <span className="font-mono text-[#FF574A] font-bold text-xs tracking-wider">{room.roomCode}</span>
              </div>
            </div>
          )}
          
          {room && <div className="w-px h-5 bg-white/10 mx-0.5"></div>}

          <button
            onClick={() => setMacroLeaderboardView(true)}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-amber-500 border border-white/10 transition"
            title="Macro Leaderboard"
          >
            <Trophy className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Scrollable inner frame content */}
      <main className="flex-1 flex flex-col bg-[#1E2022] overflow-y-auto z-10">
        {getActiveView()}
      </main>

      {/* Home indicator bar bottom */}
      {!isCompact && (
        <div className="hidden sm:block h-5 bg-neutral-950 flex items-center justify-center z-40 border-t border-neutral-900">
          <div className="w-28 h-1 bg-neutral-800 rounded-full"></div>
        </div>
      )}

      {/* Localized Playground director widget inside client, but only if it's the host or not in multi-sandbox */}
      {!isCompact && (
        <PlaygroundDirector room={room} playerId={playerId} onRefresh={() => {
          if (room) {
            fetch(`/api/rooms/${room.roomCode}`)
              .then(res => res.json())
              .then(updated => setRoom(updated));
          }
        }} />
      )}
    </div>
  );
}
