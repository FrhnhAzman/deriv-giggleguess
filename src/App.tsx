/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import GameClient from "./components/GameClient";
import { Users, Smartphone, RefreshCw, Layers, Sparkles, HelpCircle, AlertCircle } from "lucide-react";

export default function App() {
  // Option: 'single' | 'quad'
  const [viewMode, setViewMode] = useState<'single' | 'quad'>('quad'); // Default to 'quad' so the user can immediately see the 4 screens they requested!

  // The primary player ID for Single Mode
  const [singlePlayerId] = useState<string>(() => {
    const saved = localStorage.getItem("deriv_liar_player_id");
    if (saved) return saved;
    const generated = `usr_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deriv_liar_player_id", generated);
    return generated;
  });

  // Share room code between clients in Quad mode
  const [sharedRoomCode, setSharedRoomCode] = useState<string | null>(null);

  // Parse URL query parameter for automatic room joining
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setSharedRoomCode(roomParam.toUpperCase());
    }
  }, []);

  const handleRoomCreatedOrJoined = (code: string) => {
    setSharedRoomCode(code);
    // Update browser URL query param for easy sharing
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleExitRoom = () => {
    setSharedRoomCode(null);
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({ path: cleanUrl }, "", cleanUrl);
  };

  return (
    <div className="min-h-screen bg-[#141516] text-white flex flex-col relative overflow-x-hidden">
      {/* Decorative ambient blurred backgrounds */}
      <div className="absolute w-[45rem] h-[45rem] rounded-full bg-[#FF574A]/5 blur-[150px] -top-52 -left-44 pointer-events-none z-0"></div>
      <div className="absolute w-[40rem] h-[40rem] rounded-full bg-cyan-500/3 blur-[120px] -bottom-40 -right-20 pointer-events-none z-0"></div>

      {/* Main Control Console header */}
      <header className="relative z-10 border-b border-white/10 bg-[#1E2022]/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#FF574A] rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-[#FF574A]/20">
            D
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
              DERIV GIGGLEGUESS
              <span className="bg-[#FF574A]/10 border border-[#FF574A]/20 text-[#FF574A] text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase">
                TESTING MATRIX
              </span>
            </h1>
            <p className="text-[10px] tracking-[0.1em] text-white/50 font-semibold uppercase">
              Global Regional Sandbox • Multi-Client Simulator
            </p>
          </div>
        </div>

        {/* View Mode Switcher Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode('quad')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'quad'
                  ? "bg-[#FF574A] text-white shadow-lg shadow-[#FF574A]/20"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Quad-Sandbox (4 Screens)</span>
            </button>

            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'single'
                  ? "bg-[#FF574A] text-white shadow-lg shadow-[#FF574A]/20"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Single Device View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Sandbox Arena */}
      <main className="flex-1 relative z-10 p-4 md:p-6 flex flex-col justify-start">
        {viewMode === 'quad' ? (
          /* QUAD SANDBOX MODE: 2x2 interactive grid */
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Quick Helper Banner */}
            <div className="bg-[#FF574A]/5 border border-[#FF574A]/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#FF574A] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider">
                    How to test the 4-Player Synchronized Flow:
                  </h3>
                  <p className="text-[11px] text-white/70 max-w-3xl leading-relaxed">
                    1. On <span className="text-[#FF574A] font-semibold">Screen 1</span>, click <span className="text-emerald-400 font-semibold">CREATE PLAYGROUND</span>.<br />
                    2. The remaining 3 screens (Sarah, Alex, Jean-Pierre) will <span className="text-[#FF574A] font-bold">automatically detect and join</span> your room!<br />
                    3. On all screens, input details and lock ready to enter the <span className="text-cyan-400 font-semibold">Intel Phase</span>.<br />
                    4. Submit stories, vote on your coworkers&apos; profiles, and see point tallies propagate across all screens live!
                  </p>
                </div>
              </div>
              {sharedRoomCode && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex flex-col items-end flex-shrink-0 self-stretch md:self-auto justify-center">
                  <span className="text-[9px] text-white/40 font-mono uppercase">SHARED ROOM</span>
                  <span className="text-base font-mono font-black text-[#FF574A] tracking-wider">{sharedRoomCode}</span>
                </div>
              )}
            </div>

            {/* Grid Layout of 4 Screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Screen 1: Host / Farhanah */}
              <div className="flex flex-col items-center">
                <GameClient
                  playerId="sandbox_farhanah"
                  clientTitle="Screen 1 (Host - Farhanah)"
                  defaultName="Farhanah"
                  defaultOffice="Cyberjaya"
                  defaultAvatar="Cyber-Robot"
                  sharedRoomCode={sharedRoomCode}
                  onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
                  onExitRoom={handleExitRoom}
                  isCompact={true}
                />
              </div>

              {/* Screen 2: Sarah */}
              <div className="flex flex-col items-center">
                <GameClient
                  playerId="sandbox_sarah"
                  clientTitle="Screen 2 (Sarah)"
                  defaultName="Sarah"
                  defaultOffice="London"
                  defaultAvatar="Wise Owl"
                  sharedRoomCode={sharedRoomCode}
                  onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
                  onExitRoom={handleExitRoom}
                  isCompact={true}
                />
              </div>

              {/* Screen 3: Alex */}
              <div className="flex flex-col items-center">
                <GameClient
                  playerId="sandbox_alex"
                  clientTitle="Screen 3 (Alex)"
                  defaultName="Alex"
                  defaultOffice="Malta"
                  defaultAvatar="Astronaut"
                  sharedRoomCode={sharedRoomCode}
                  onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
                  onExitRoom={handleExitRoom}
                  isCompact={true}
                />
              </div>

              {/* Screen 4: Jean-Pierre */}
              <div className="flex flex-col items-center">
                <GameClient
                  playerId="sandbox_jean"
                  clientTitle="Screen 4 (Jean-Pierre)"
                  defaultName="Jean-Pierre"
                  defaultOffice="Paris"
                  defaultAvatar="Neon Fox"
                  sharedRoomCode={sharedRoomCode}
                  onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
                  onExitRoom={handleExitRoom}
                  isCompact={true}
                />
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE DEVICE PREVIEW MODE */
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="w-full sm:max-w-md">
              <GameClient
                playerId={singlePlayerId}
                clientTitle="Smartphone Client (Farhanah)"
                defaultName="Farhanah"
                defaultOffice="Cyberjaya"
                defaultAvatar="Cyber-Robot"
                sharedRoomCode={sharedRoomCode}
                onRoomCreatedOrJoined={handleRoomCreatedOrJoined}
                onExitRoom={handleExitRoom}
                isCompact={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="relative z-10 bg-[#1E2022] border-t border-white/5 py-4 px-6 text-center text-xs text-white/30 font-mono">
        DERIV® AI PLAYGROUND ENV • DEVELOPER SIMULATOR • TIME STATE (UTC) 
      </footer>
    </div>
  );
}
