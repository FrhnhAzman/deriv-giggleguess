/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, Bot, Zap, Play, RotateCcw, Award } from "lucide-react";
import { RoomState } from "../types";

interface DirectorProps {
  room: RoomState | null;
  playerId: string;
  onRefresh: () => void;
}

export default function PlaygroundDirector({ room, playerId, onRefresh }: DirectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [msg, setMsg] = useState("");

  if (!room) return null;

  const handleAddAI = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/rooms/${room.roomCode}/simulate-peers`, {
        method: "POST"
      });
      if (res.ok) {
        setMsg("AI Colleagues added! (Sarah, Jean-Pierre, Alex, David)");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
    setIsSimulating(false);
  };

  const handleAutoReady = async () => {
    setIsSimulating(true);
    try {
      // Find all ready-pending players and transmit
      const pendingPlayers = room.players.filter(p => !p.isReady);
      for (const p of pendingPlayers) {
        await fetch(`/api/rooms/${room.roomCode}/transmit-persona`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: p.id })
        });
      }
      setMsg("All players set to READY!");
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setIsSimulating(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-2xl p-4 w-72 max-w-sm">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-coral-500 text-[#FF574A]" />
              <span className="font-sans font-bold text-sm tracking-tight text-neutral-100">PLAYGROUND DIRECTOR</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 bg-neutral-800 rounded"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
            Use these controls to simulate other players and experience the full multi-device flow in a single session!
          </p>

          <div className="space-y-2">
            <button
              onClick={handleAddAI}
              disabled={isSimulating}
              className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-lg text-xs text-left"
            >
              <span className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Add 4 AI Colleagues
              </span>
              <span className="bg-neutral-900 text-[10px] px-1.5 py-0.5 rounded text-neutral-400">Add Peers</span>
            </button>

            {room.phase === "PROFILE" && (
              <button
                onClick={handleAutoReady}
                disabled={isSimulating}
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-lg text-xs text-left"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Auto-Ready All Profiles
                </span>
                <span className="bg-neutral-900 text-[10px] px-1.5 py-0.5 rounded text-neutral-400">Setup Phase</span>
              </button>
            )}

            {room.phase === "INTEL" && (
              <div className="p-2.5 bg-neutral-800/50 border border-neutral-800 rounded-lg text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-neutral-200">
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Intel submission
                </div>
                Submit your personal story to automatically fill in stories for all AI peers and advance!
              </div>
            )}

            {room.phase === "VOTING" && (
              <div className="p-2.5 bg-neutral-800/50 border border-neutral-800 rounded-lg text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-neutral-200">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Voting phase
                </div>
                Cast your vote to automatically trigger AI peer votes and reveal results instantly.
              </div>
            )}

            {room.phase === "REVEAL" && (
              <div className="p-2.5 bg-neutral-800/50 border border-neutral-800 rounded-lg text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-neutral-200">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Scoreboard
                </div>
                View the breakdown. Click &quot;Next Story / Round&quot; in the app to continue.
              </div>
            )}
          </div>

          {msg && (
            <div className="mt-3 p-1.5 bg-[#FF574A]/10 border border-[#FF574A]/20 text-[#FF574A] rounded text-[11px] text-center">
              {msg}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-500">
            <span>Room Code: {room.roomCode}</span>
            <span>Phase: {room.phase}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF574A] hover:bg-[#e04c40] text-white rounded-full shadow-lg transition-all transform hover:scale-105"
        >
          <Bot className="w-5 h-5" />
          <span className="font-sans font-bold text-xs tracking-tight">PLAYGROUND DIRECTOR</span>
        </button>
      )}
    </div>
  );
}
