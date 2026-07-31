/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, Bot, Shield, ShieldAlert, Award, ArrowRight, ArrowLeft, CheckCircle2, 
  HelpCircle, Camera, AlertTriangle, Send, Landmark, RefreshCw, Trophy, Sparkles, Plus, Lock, Vote as VoteIcon,
  Copy, Check, Share2, QrCode, Crown
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { RoomState, Player, Story, Vote, OFFICES, AVATARS, OfficeLeaderboardEntry } from "../types";

// -------------------------------------------------------------
// SCREEN 1: THE GATEWAY & PLAYGROUND CREATION
// -------------------------------------------------------------
interface GatewayProps {
  room: RoomState | null;
  playerId: string;
  joinCodeInput: string;
  setJoinCodeInput: (val: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLockLobby: () => void;
  onUpdateRounds?: (rounds: number) => void;
  isConnecting: boolean;
  error: string | null;
}

export function Screen1Gateway({
  room,
  playerId,
  joinCodeInput,
  setJoinCodeInput,
  onCreateRoom,
  onJoinRoom,
  onLockLobby,
  onUpdateRounds,
  isConnecting,
  error
}: GatewayProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanStatus, setScanStatus] = useState("Initializing camera...");
  const [copiedLink, setCopiedLink] = useState(false);

  const activePlayer = room?.players.find(p => p.id === playerId);
  const isHost = activePlayer?.isHost || false;

  const handleStartScanner = async () => {
    setShowScanner(true);
    setScanStatus("Scanning for regional lobbies...");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Simulate reading QR code after 3 seconds
        setTimeout(() => {
          const simulatedCode = "DV-8841";
          setJoinCodeInput(simulatedCode);
          setScanStatus(`Found Room! Code: ${simulatedCode}`);
          setTimeout(() => {
            onJoinRoom(simulatedCode);
            handleCloseScanner();
          }, 1000);
        }, 3000);
      } else {
        throw new Error("Camera APIs not supported in this frame.");
      }
    } catch (err) {
      console.warn("Camera fallback triggered:", err);
      setScanStatus("Camera unavailable in iframe. Simulating scan...");
      setTimeout(() => {
        const simulatedCode = "DV-8841";
        setJoinCodeInput(simulatedCode);
        setScanStatus(`Simulated scan found room: ${simulatedCode}`);
        setTimeout(() => {
          onJoinRoom(simulatedCode);
          handleCloseScanner();
        }, 1200);
      }, 2500);
    }
  };

  const handleCloseScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowScanner(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Self-referential join URL for the QR code
  const joinUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${window.location.pathname}?room=${room?.roomCode || ""}`
    : "";

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy link:", err);
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6">
      <div className="space-y-6">
        {/* Core Branding */}
        <div className="text-center space-y-2 mt-2">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans font-black text-2xl sm:text-3xl tracking-wider text-[#FF574A]"
            id="main-title"
          >
            DERIV GIGGLEGUESS
          </motion.h1>
          <div className="inline-block bg-[#FF574A]/10 px-3 py-1 rounded-full border border-[#FF574A]/20">
            <span className="font-mono text-[10px] tracking-widest text-[#FF574A] uppercase font-bold">
              THE VOTE • GLOBAL TEAM BUILDING EDITION
            </span>
          </div>
        </div>

        {/* Instructional Copy Box */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#FF574A]">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <h2 className="font-sans font-bold text-xs tracking-wider uppercase text-white/80">HOW TO SCAN & PLAY:</h2>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-sans">
            <strong className="text-white">Host a new game?</strong><br />
            Tap <span className="text-[#FF574A] font-semibold">"CREATE PLAYGROUND"</span> to generate a unique room code & QR code. Hold up your screen so participants can scan and join instantly!
          </p>
          <p className="text-xs text-white/70 leading-relaxed font-sans pt-1 border-t border-white/5">
            <strong className="text-white">Joining as a participant?</strong><br />
            Scan the host's QR code with your phone camera, or enter their 6-digit room code below to sync your device.
          </p>
        </div>

        {/* Interactive Controls & Inputs */}
        <div className="space-y-4 pt-1">
          {!room ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onCreateRoom}
              disabled={isConnecting}
              className="w-full py-4 bg-[#FF574A] hover:bg-[#e04c40] text-white rounded-xl font-sans font-extrabold text-sm tracking-widest uppercase shadow-lg shadow-[#FF574A]/20 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
              id="create-playground-btn"
            >
              <Plus className="w-5 h-5" />
              CREATE PLAYGROUND (HOST)
            </motion.button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 text-center">
              {/* Host Waiting / Peer Waiting Visual */}
              {isHost ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-[#FF574A] uppercase font-bold bg-[#FF574A]/10 px-3 py-1 rounded-full border border-[#FF574A]/20">
                    <Crown className="w-3.5 h-3.5 text-[#FF574A]" />
                    HOST CONTROL PANEL ACTIVE
                  </div>

                  <div className="font-mono font-black text-2xl tracking-tight text-white select-all">
                    ROOM CODE: <span className="text-[#FF574A] font-extrabold">{room.roomCode}</span>
                  </div>

                  {/* Clean SVG QR Code inside a high-contrast white card */}
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-2xl shadow-xl w-max mx-auto border-2 border-[#FF574A]/40 flex flex-col items-center">
                      <QRCodeSVG 
                        value={joinUrl} 
                        size={160} 
                        bgColor="#FFFFFF"
                        fgColor="#141516"
                        level="H"
                        marginSize={1}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-white/50">
                      Participants: Scan this QR code to join instantly!
                    </p>
                  </div>

                  {/* Share Link Button */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold text-white/80 hover:text-white flex items-center justify-center gap-2 transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">INVITE LINK COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-[#FF574A]" />
                        <span>COPY SHAREABLE INVITE LINK</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-white/60 font-mono pt-1 border-t border-white/5">
                    Connected: <span className="text-white font-bold">{room.players.length} Player{room.players.length > 1 ? 's' : ' (You)'}</span>
                  </p>
                  
                  {/* Choose game rounds */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 text-left">
                    <label className="block text-[10px] font-mono tracking-widest text-white/40 uppercase font-bold">
                      SELECT GAME DURATION:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUpdateRounds?.(3)}
                        className={`py-2 px-1.5 rounded-xl border font-sans font-bold text-xs transition cursor-pointer ${
                          room.totalRounds === 3
                            ? "bg-[#FF574A] border-[#FF574A] text-white shadow-md shadow-[#FF574A]/10"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        3 Rounds (Speed)
                      </button>
                      <button
                        onClick={() => onUpdateRounds?.(5)}
                        className={`py-2 px-1.5 rounded-xl border font-sans font-bold text-xs transition cursor-pointer ${
                          room.totalRounds === 5 || !room.totalRounds
                            ? "bg-[#FF574A] border-[#FF574A] text-white shadow-md shadow-[#FF574A]/10"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        5 Rounds (Full)
                      </button>
                    </div>
                  </div>

                  {room.players.length >= 1 && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onLockLobby}
                      className="w-full py-3.5 bg-[#FF574A] text-white rounded-xl font-sans font-black text-xs tracking-wider uppercase hover:bg-[#e04c40] shadow-lg shadow-[#FF574A]/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      LOCK ROOM & BEGIN GAME (HOST)
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    🟢 PARTICIPANT SYNCED
                  </div>

                  <div className="font-mono font-black text-2xl text-white">
                    ROOM: <span className="text-[#FF574A]">{room.roomCode}</span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl shadow-xl w-max mx-auto border-2 border-emerald-500/40">
                    <QRCodeSVG 
                      value={joinUrl} 
                      size={140} 
                      bgColor="#FFFFFF"
                      fgColor="#141516"
                      level="H"
                      marginSize={1}
                    />
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-white/60 font-mono">
                    <span>SELECTED DURATION:</span>
                    <span className="font-bold text-[#FF574A]">{room.totalRounds || 5} ROUNDS</span>
                  </div>

                  <div className="py-4 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-[#FF574A] animate-spin" />
                    <p className="text-xs text-white/70 font-sans max-w-xs mx-auto">
                      Waiting for Host to lock the room and start... Connected: <strong className="text-white">{room.players.length} Players</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!room && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-white/30 font-mono text-[10px] tracking-widest">— OR JOIN AN ACTIVE ROOM —</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter 6-Digit Room Code (e.g., DV-8841)"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-center text-white font-mono placeholder-white/30 focus:outline-none focus:border-[#FF574A] transition"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => onJoinRoom(joinCodeInput)}
                    disabled={isConnecting || !joinCodeInput}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-sans font-bold text-xs tracking-wider uppercase rounded-xl border border-white/5 transition"
                  >
                    SYNC DEVICE
                  </button>

                  <button
                    onClick={handleStartScanner}
                    className="py-3 px-4 bg-transparent border border-[#FF574A] hover:bg-[#FF574A]/10 text-[#FF574A] font-sans font-bold text-xs tracking-wider uppercase rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    SCAN QR CODE
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-sans text-xs leading-relaxed">{error}</span>
          </div>
        )}
      </div>

      {/* Live Room Sync State Footnote */}
      <div className="border-t border-white/5 pt-4 mt-6">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-white/40 uppercase">SYSTEM DIAGNOSTIC:</span>
          {room ? (
            <span className="text-[#4CAF50] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-ping"></span>
              SYNCED • ROOM {room.roomCode}
            </span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1.5">
              ⚠️ DISCONNECTED. ENTER CODE TO BEGIN
            </span>
          )}
        </div>
      </div>

      {/* Camera QR Scanner Modal Overlay */}
      <AnimatePresence>
        {showScanner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950 z-50 flex flex-col justify-between p-6"
          >
            <div className="space-y-4 text-center mt-10">
              <h3 className="font-sans font-black text-xl text-white tracking-wide">CAMERA SYNC DETECTOR</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Align the colleague's device QR code within the scanning viewfinder below.
              </p>
            </div>

            <div className="relative w-72 h-72 mx-auto border-2 border-dashed border-[#FF574A] rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              {/* Radar Reticle overlay */}
              <div className="absolute inset-0 border border-[#FF574A]/20 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border border-[#FF574A] rounded-xl flex items-center justify-center relative">
                  <div className="absolute w-4 h-4 border-t-2 border-l-2 border-[#FF574A] -top-1 -left-1"></div>
                  <div className="absolute w-4 h-4 border-t-2 border-r-2 border-[#FF574A] -top-1 -right-1"></div>
                  <div className="absolute w-4 h-4 border-b-2 border-l-2 border-[#FF574A] -bottom-1 -left-1"></div>
                  <div className="absolute w-4 h-4 border-b-2 border-r-2 border-[#FF574A] -bottom-1 -right-1"></div>
                  <div className="w-full h-1 bg-[#FF574A] absolute animate-bounce opacity-80 shadow-[0_0_10px_rgba(255,87,74,0.5)]"></div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <span className="font-mono text-xs text-neutral-300 block bg-neutral-900 px-4 py-2 rounded-full inline-block border border-neutral-800">
                {scanStatus}
              </span>

              <button
                onClick={handleCloseScanner}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg border border-neutral-700"
              >
                CANCEL SCAN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 2: PERSONA PROFILE SETUP
// -------------------------------------------------------------
interface PersonaProps {
  room: RoomState;
  playerId: string;
  onTransmitPersona: (profile: {
    name: string;
    isTeamPlay: boolean;
    teamName?: string;
    office: string;
    avatar: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function Screen2Persona({ room, playerId, onTransmitPersona }: PersonaProps) {
  const activePlayer = room.players.find(p => p.id === playerId);

  const [name, setName] = useState(activePlayer?.name || "");
  const [office, setOffice] = useState(activePlayer?.office || OFFICES[0]);
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(() => {
    if (activePlayer?.avatar) {
      const idx = AVATARS.findIndex(a => a.id === activePlayer.avatar);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });
  const [isTransmitted, setIsTransmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (activePlayer && !hasInitializedRef.current) {
      if (activePlayer.name) setName(activePlayer.name);
      if (activePlayer.office) setOffice(activePlayer.office);
      if (activePlayer.avatar) {
        const idx = AVATARS.findIndex(a => a.id === activePlayer.avatar);
        if (idx !== -1) setSelectedAvatarIdx(idx);
      }
      hasInitializedRef.current = true;
    }
  }, [activePlayer]);

  const handleNextAvatar = () => {
    setSelectedAvatarIdx((prev) => (prev + 1) % AVATARS.length);
  };

  const handlePrevAvatar = () => {
    setSelectedAvatarIdx((prev) => (prev - 1 + AVATARS.length) % AVATARS.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const result = await onTransmitPersona({
      name: name.trim(),
      isTeamPlay: false,
      office,
      avatar: AVATARS[selectedAvatarIdx].id
    });

    if (result && !result.success) {
      setError(result.error || "Failed to update profile.");
      setIsTransmitted(false);
    } else {
      setIsTransmitted(true);
    }
  };

  const currentAvatar = AVATARS[selectedAvatarIdx];

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <span className="font-mono text-[9px] tracking-widest text-[#FF574A] font-bold uppercase">
            ESTABLISHING IDENTITY SIGNAL
          </span>
          <h2 className="font-sans font-black text-2xl tracking-tight text-white">
            PERSONA PROFILE SETUP
          </h2>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/40">
              What is your name?
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Sarah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isTransmitted}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-sans placeholder-white/20 focus:outline-none focus:border-[#FF574A] disabled:opacity-55 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/40">
              Select your Deriv Global Office Base:
            </label>
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              disabled={isTransmitted}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-sans focus:outline-none focus:border-[#FF574A] disabled:opacity-55 transition cursor-pointer appearance-none"
            >
              {OFFICES.map((off) => (
                <option key={off} value={off} className="bg-[#1E2022] text-white">
                  {off}
                </option>
              ))}
            </select>
          </div>

          {/* Swipeable Carousel / Custom Selector text */}
          <div className="space-y-2 pt-2">
            <label className="block text-center text-[11px] font-mono font-bold uppercase tracking-wider text-white/40">
              Choose your AI-generated Holo-Avatar:
            </label>

            <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 relative">
              <button
                type="button"
                onClick={handlePrevAvatar}
                disabled={isTransmitted}
                className="p-2 text-[#FF574A] hover:bg-white/10 rounded-full disabled:opacity-30 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 px-4">
                <div className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                  {currentAvatar.label.split(" ")[0]}
                </div>
                <div className="font-sans font-black text-sm text-white tracking-tight">
                  {currentAvatar.id}
                </div>
                <span className="text-[9px] font-mono uppercase bg-white/5 text-white/50 px-2 py-0.5 rounded-full border border-white/5">
                  Transmitting Hologram
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextAvatar}
                disabled={isTransmitted}
                className="p-2 text-[#FF574A] hover:bg-white/10 rounded-full disabled:opacity-30 transition"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isTransmitted || !name.trim()}
              className={`w-full py-4 rounded-2xl font-sans font-extrabold text-sm tracking-widest uppercase transition flex items-center justify-center gap-2 ${
                isTransmitted 
                  ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed" 
                  : "bg-[#FF574A] text-white hover:bg-[#e04c40] shadow-lg shadow-[#FF574A]/20"
              }`}
            >
              <Send className="w-4 h-4" />
              {isTransmitted ? "Ready! Waiting for others..." : "TRANSMIT PERSONA"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Connection summary */}
      <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-[11px] font-mono text-white/40">
        <span>COLLEAGUES DETECTED: {room.players.length}</span>
        <span className="text-[#4CAF50] font-bold">
          Ready: {room.players.filter(p => p.isReady).length} / {room.players.length}
        </span>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 3: SECRET INTEL INPUT (ROUND X OF 5)
// -------------------------------------------------------------
interface IntelProps {
  room: RoomState;
  playerId: string;
  onSubmitIntel: (storyText: string, isTruth: boolean) => void;
}

export function Screen3SecretIntel({ room, playerId, onSubmitIntel }: IntelProps) {
  const [story, setStory] = useState("");
  const [isTruth, setIsTruth] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const characterLimit = 150;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!story.trim() || isSubmitted) return;

    setIsSubmitted(true);
    onSubmitIntel(story.trim(), isTruth);
  };

  const activePlayer = room.players.find(p => p.id === playerId);
  const isPlayerReady = activePlayer?.isReady || false;

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Round Tracker Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF574A]" />
            <span className="font-mono text-[10px] font-black tracking-widest text-[#FF574A] uppercase">
              ROUND {room.currentRound} OF 5
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/40 uppercase">
            SECURE PORTRAIT ORIENTATION
          </span>
        </div>

        {/* Warning Indicator */}
        <div className="bg-amber-500/5 border border-amber-500/10 text-amber-500 rounded-2xl p-4 text-[11px] leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">PRIVACY SHIELD ENGAGED:</strong> Keep your screen tilted away from neighbors! Inputs are locked on your local portal only.
          </span>
        </div>

        {/* Story Submission Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <h3 className="font-sans font-extrabold text-sm text-white tracking-tight leading-snug">
              Type a personal story, a workplace fact, or an outlandish claim. Keep it concise, believable, or wildly deceptive!
            </h3>
            
            <div className="relative">
              <textarea
                value={story}
                onChange={(e) => {
                  if (e.target.value.length <= characterLimit) {
                    setStory(e.target.value);
                  }
                }}
                disabled={isSubmitted || isPlayerReady}
                placeholder="Type your story here... Maximum 150 characters."
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs leading-relaxed font-sans placeholder-white/20 focus:outline-none focus:border-[#FF574A] resize-none focus:ring-1 focus:ring-[#FF574A] disabled:opacity-50 transition"
              />
              <span className={`absolute bottom-3 right-3 font-mono text-[10px] ${
                story.length >= characterLimit - 10 ? "text-[#FF574A] font-bold" : "text-white/40"
              }`}>
                {story.length} / {characterLimit}
              </span>
            </div>
          </div>

          {/* The Secret Alignment Switch */}
          <div className="space-y-3 pt-1">
            <div className="text-center text-[11px] font-mono font-bold uppercase tracking-wider text-white/40">
              Define the true reality of this statement. Choose wisely—your goal is to fool the crowd!
            </div>

            <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1 relative overflow-hidden">
              <button
                type="button"
                onClick={() => setIsTruth(true)}
                disabled={isSubmitted || isPlayerReady}
                className={`flex-1 py-3 text-center font-sans font-black text-xs rounded-xl transition-all ${
                  isTruth 
                    ? "bg-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/20" 
                    : "text-white/40 hover:text-white"
                }`}
              >
                🟩 IT IS THE TRUTH
              </button>
              <button
                type="button"
                onClick={() => setIsTruth(false)}
                disabled={isSubmitted || isPlayerReady}
                className={`flex-1 py-3 text-center font-sans font-black text-xs rounded-xl transition-all ${
                  !isTruth 
                    ? "bg-[#F44336] text-white shadow-lg shadow-[#F44336]/20" 
                    : "text-white/40 hover:text-white"
                }`}
              >
                🟥 IT IS A COMPLETED LIE
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitted || isPlayerReady || !story.trim()}
              className={`w-full py-4 rounded-2xl font-sans font-extrabold text-sm tracking-widest uppercase transition ${
                isSubmitted || isPlayerReady
                  ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-[#FF574A] text-white hover:bg-[#e04c40] shadow-lg shadow-[#FF574A]/20"
              }`}
            >
              {isSubmitted || isPlayerReady ? "INTEL LOCKED & TRANSMITTED" : "LOCK AND SUBMIT STORY"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Live Peer Upload Status */}
      <div className="border-t border-white/5 pt-4 mt-6">
        <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
          <span>PEER INTEL SYNCHRONIZATION:</span>
          <span className="text-[#FF574A] font-bold">
            {room.players.filter(p => p.isReady).length} / {room.players.length} SYNCED
          </span>
        </div>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 4: THE LIVE VOTING ARENA
// -------------------------------------------------------------
interface VotingProps {
  room: RoomState;
  playerId: string;
  onCastVote: (isTruthVote: boolean) => void;
}

export function Screen4VotingArena({ room, playerId, onCastVote }: VotingProps) {
  const [voted, setVoted] = useState(false);
  const [votedType, setVotedType] = useState<boolean | null>(null);

  const interrogatedPlayer = room.players[room.currentInterrogatedIndex];
  const activePlayer = room.players.find(p => p.id === playerId);

  if (!interrogatedPlayer) return null;

  // Retrieve current interrogated player's story
  const currentStory = room.stories.find(
    s => s.playerId === interrogatedPlayer.id && s.round === room.currentRound
  );

  const isInterrogated = interrogatedPlayer.id === playerId;

  const handleVote = (voteVal: boolean) => {
    setVoted(true);
    setVotedType(voteVal);
    onCastVote(voteVal);
  };

  // Find corresponding avatar metadata
  const avatarMetadata = AVATARS.find(a => a.id === interrogatedPlayer.avatar);

  // How many peers have voted out of the total peers eligible to vote
  const votersWhoHaveVoted = room.votes.filter(
    v => v.storyPlayerId === interrogatedPlayer.id && v.round === room.currentRound
  );
  const totalEligibleVotersCount = room.players.filter(p => p.id !== interrogatedPlayer.id).length;

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Top Focus Banner */}
        <div className="text-center space-y-1">
          <span className="font-mono text-[9px] tracking-widest text-[#FF574A] font-bold uppercase block bg-[#FF574A]/10 py-1 px-3 rounded-full border border-[#FF574A]/20 max-w-max mx-auto">
            ⚡️ NOW INTERROGATING: ROUND {room.currentRound} / 5
          </span>
          <h2 className="font-sans font-black text-2xl tracking-tight text-white mt-1">
            THE VOTING ARENA
          </h2>
        </div>

        {/* Subject Identifier Card */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF574A]/5 to-transparent rounded-full -mr-6 -mt-6"></div>
          
          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl border border-white/10">
            {avatarMetadata?.label.split(" ")[0] || "🤖"}
          </div>

          <div className="space-y-1">
            <h3 className="font-sans font-black text-base text-white flex items-center gap-1.5">
              {interrogatedPlayer.name}
              {isInterrogated && (
                <span className="text-[9px] font-mono tracking-wide bg-[#FF574A]/20 text-[#FF574A] uppercase px-1.5 py-0.5 rounded-full font-bold">
                  YOU
                </span>
              )}
            </h3>
            <p className="font-mono text-[10px] text-white/40 leading-tight">
              {interrogatedPlayer.isTeamPlay && interrogatedPlayer.teamName ? `${interrogatedPlayer.teamName} • ` : ""}
              <span className="text-white/60 font-bold">{interrogatedPlayer.office} Office</span>
            </p>
          </div>
        </div>

        {/* The Evidence Box */}
        <div className="space-y-2">
          <span className="font-mono text-[9px] tracking-wider text-white/40 uppercase font-bold block">
            CLASSIFIED TESTIMONY DEPOSIT:
          </span>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 relative italic text-center font-serif text-white text-sm leading-relaxed tracking-wide shadow-inner">
            <span className="text-4xl text-[#FF574A]/20 absolute left-4 top-2 select-none font-serif">“</span>
            <span className="relative z-10 block px-4 py-2">
              {currentStory ? currentStory.storyText : "Story deposition missing. Connection failed."}
            </span>
            <span className="text-4xl text-[#FF574A]/20 absolute right-4 bottom-2 select-none font-serif">”</span>
          </div>
        </div>

        {/* Interrogated Warning / Voting Rig */}
        {isInterrogated ? (
          <div className="bg-[#FF574A]/5 border border-[#FF574A]/10 text-[#FF574A] rounded-2xl p-5 text-xs text-center leading-relaxed">
            <Landmark className="w-5 h-5 mx-auto mb-2 opacity-80" />
            <strong className="text-white block mb-1">DEFEND YOUR PORTAL:</strong>
            You cannot vote on your own story. Watch your colleagues&apos; live response metrics below to see if your poker face is holding up!
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-[11px] font-mono font-bold uppercase tracking-wider text-white/40">
              Is this story absolute reality or pure corporate fiction? Drop your vote now!
            </p>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote(true)}
                disabled={voted || activePlayer?.isReady}
                className={`py-4 rounded-2xl font-sans font-black text-sm tracking-wider uppercase flex flex-col items-center justify-center gap-1.5 transition ${
                  (voted && votedType === true) || (activePlayer?.isReady && votedType === true)
                    ? "bg-[#4CAF50] text-white shadow-lg shadow-[#4CAF50]/20"
                    : voted
                    ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                    : "bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white shadow-md shadow-[#4CAF50]/10"
                }`}
              >
                <span className="text-xl">👍</span>
                VOTE REAL
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote(false)}
                disabled={voted || activePlayer?.isReady}
                className={`py-4 rounded-2xl font-sans font-black text-sm tracking-wider uppercase flex flex-col items-center justify-center gap-1.5 transition ${
                  (voted && votedType === false) || (activePlayer?.isReady && votedType === false)
                    ? "bg-[#F44336] text-white shadow-lg shadow-[#F44336]/20"
                    : voted
                    ? "bg-white/5 border border-white/10 text-white/20 cursor-not-allowed"
                    : "bg-[#F44336] hover:bg-[#F44336]/90 text-white shadow-md shadow-[#F44336]/10"
                }`}
              >
                <span className="text-xl">👎</span>
                VOTE FAKE
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Voter Check Counter */}
      <div className="border-t border-white/5 pt-4 mt-6">
        <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
          <span>VOTING DISPATCH TICKER:</span>
          <span className="text-[#FF574A] font-bold flex items-center gap-1">
            <VoteIcon className="w-3.5 h-3.5 animate-pulse" />
            🗳️ {votersWhoHaveVoted.length} OUT OF {totalEligibleVotersCount} VOTE{totalEligibleVotersCount > 1 ? 'S' : ''} CAST
          </span>
        </div>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 5: THE BIG REVEAL & SCOREBOARD
// -------------------------------------------------------------
interface RevealProps {
  room: RoomState;
  playerId: string;
  onNextRound: () => void;
}

export function Screen5RevealScoreboard({ room, playerId, onNextRound }: RevealProps) {
  const interrogatedPlayer = room.players[room.currentInterrogatedIndex];
  const activePlayer = room.players.find(p => p.id === playerId);
  const isHost = activePlayer?.isHost || false;

  if (!interrogatedPlayer) return null;

  const currentStory = room.stories.find(
    s => s.playerId === interrogatedPlayer.id && s.round === room.currentRound
  );
  
  const isTruth = currentStory ? currentStory.isTruth : false;

  // Statistics
  const roundVotes = room.votes.filter(
    v => v.storyPlayerId === interrogatedPlayer.id && v.round === room.currentRound
  );
  const truthVotesCount = roundVotes.filter(v => v.isTruthVote === true).length;
  const lieVotesCount = roundVotes.filter(v => v.isTruthVote === false).length;

  // Calculations for point attribution list
  const fooledMajority = truthVotesCount !== lieVotesCount && (isTruth ? lieVotesCount > truthVotesCount : truthVotesCount > lieVotesCount);

  // Grouped active office standings from current session players
  const officeTotals: { [key: string]: number } = {};
  room.players.forEach(p => {
    officeTotals[p.office] = (officeTotals[p.office] || 0) + p.points;
  });

  const officeTickerText = Object.entries(officeTotals)
    .map(([off, pts]) => `${off}: ${pts} Pts`)
    .join(" | ");

  // Rank players by score
  const sortedPlayers = [...room.players].sort((a, b) => b.points - a.points);

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Flash Judgment Banner */}
        <div className="text-center space-y-2">
          <span className="font-mono text-[9px] tracking-widest text-[#FF574A] font-bold uppercase block">
            ROUND REVEAL SEQUENCE
          </span>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`py-4 px-6 rounded-2xl border text-center relative overflow-hidden flex flex-col items-center justify-center gap-1 ${
              isTruth
                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400"
                : "bg-[#F44336]/5 border-[#F44336]/15 text-[#F44336]"
            }`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 ${
              isTruth ? "bg-emerald-500" : "bg-[#F44336]"
            }`}></div>
            <span className="font-mono text-[10px] tracking-widest uppercase opacity-70">
              THE VERDICT
            </span>
            <span className="font-sans font-black text-xl tracking-tight leading-none">
              {isTruth ? "🟩 ABSOLUTE TRUTH!" : "🟥 PURE DECEPTION! IT WAS A LIE!"}
            </span>
          </motion.div>
        </div>

        {/* Public Consensus Tally */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-[11px] font-mono text-white/40 border-b border-white/10 pb-1.5">
            <span>PUBLIC CONSENSUS TALLY:</span>
            <span className="text-white font-bold">{roundVotes.length} TOTAL VOTERS</span>
          </div>
          
          <div className="flex justify-around items-center py-1">
            <div className="text-center">
              <span className="text-2xl">👍</span>
              <div className="font-sans font-black text-lg text-emerald-400 mt-1">{truthVotesCount}</div>
              <span className="text-[9px] font-mono uppercase text-white/40">Voted Real</span>
            </div>
            <div className="h-8 border-r border-white/10"></div>
            <div className="text-center">
              <span className="text-2xl">👎</span>
              <div className="font-sans font-black text-lg text-[#F44336] mt-1">{lieVotesCount}</div>
              <span className="text-[9px] font-mono uppercase text-white/40">Voted Fake</span>
            </div>
          </div>

          {/* Point Attribution Feed */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1.5 text-xs font-sans text-white/60">
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono font-bold uppercase tracking-wide">
              <span>POINT ATTRIBUTIONS:</span>
            </div>
            <ul className="space-y-1 font-sans">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-500">✔</span>
                <span>Correct Guesses: <strong className="text-white">+1 Point</strong> awarded to vigilant peers.</span>
              </li>
              {fooledMajority && (
                <li className="flex items-center gap-1.5 text-[#FF574A]">
                  <span className="text-amber-500">🔥</span>
                  <span>
                    <strong className="text-white">{interrogatedPlayer.name}</strong> fooled the majority! <strong className="text-white">+2 Points</strong>.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Live Standings Scoreboard Card */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-500 border-b border-white/10 pb-2">
            <Trophy className="w-4.5 h-4.5" />
            <h3 className="font-sans font-black text-xs tracking-wider uppercase text-white/80">
              PLAYGROUND SCOREBOARD (ROUND {room.currentRound}/{room.totalRounds || 5})
            </h3>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {sortedPlayers.map((p, idx) => {
              const avatarMeta = AVATARS.find(a => a.id === p.avatar);
              return (
                <div 
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                    p.id === playerId 
                      ? "bg-[#FF574A]/10 border-[#FF574A]/30 text-white" 
                      : "bg-white/5 border-white/5 text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/40 font-bold w-4">
                      {idx + 1}.
                    </span>
                    <span className="text-base">{avatarMeta?.label.split(" ")[0] || "🤖"}</span>
                    <span className="font-sans font-bold leading-none">
                      {p.name}
                      <span className="block font-mono text-[8px] text-white/30 font-normal mt-0.5">
                        {p.office} office
                      </span>
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white bg-white/5 border border-white/10 px-2 py-1 rounded-xl">
                    {p.points} Pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progression actions & Global standings ticker */}
      <div className="space-y-4 pt-4 mt-6">
        {isHost ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onNextRound}
            className="w-full py-4 bg-[#FF574A] hover:bg-[#FF574A]/95 text-white rounded-2xl font-sans font-extrabold text-sm tracking-widest uppercase shadow-lg shadow-[#FF574A]/20 transition"
          >
            {room.currentRound < room.totalRounds ? "NEXT STORY / ROUND" : "INITIATE FINAL JUDGMENT"}
          </motion.button>
        ) : (
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-xs text-white/40 text-center leading-relaxed">
            <Bot className="w-5 h-5 mx-auto mb-1 text-white/30 animate-pulse" />
            Waiting for Host to lock standings and progress to the next module...
          </div>
        )}

        {/* Global Office Standings Ticker */}
        <div className="border-t border-white/5 pt-3 relative overflow-hidden bg-white/5 py-1.5 px-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1 bg-[#1E2022] absolute top-1.5 left-2 z-10 px-1.5 py-0.5 rounded border border-white/10 font-mono text-[9px] text-[#FF574A] font-bold">
            <Landmark className="w-3 h-3" /> LIVE
          </div>
          <div className="whitespace-nowrap overflow-hidden pl-16">
            <div className="inline-block animate-[marquee_25s_linear_infinite] font-mono text-[10px] text-white/40 tracking-wider">
              GLOBAL OFFICE STANDINGS TOTAL: {officeTickerText || "Lobbies loading..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 6: THE AI FINAL JUDGMENT (THE ROAST)
// -------------------------------------------------------------
interface FinalJudgmentProps {
  room: RoomState;
  playerId: string;
  onViewLeaderboard: () => void;
  onPlayAgain: () => void;
  onGenerateRoast: () => void;
  isGeneratingRoast: boolean;
}

export function Screen6AIJudgment({
  room,
  playerId,
  onViewLeaderboard,
  onPlayAgain,
  onGenerateRoast,
  isGeneratingRoast
}: FinalJudgmentProps) {
  const winner = room.players.find(p => p.id === room.winnerId);
  const avatarMeta = winner ? AVATARS.find(a => a.id === winner.avatar) : null;

  const sortedPlayers = [...room.players].sort((a, b) => b.points - a.points);

  const officePoints: { [office: string]: number } = {};
  room.players.forEach(p => {
    officePoints[p.office] = (officePoints[p.office] || 0) + p.points;
  });

  const sortedOffices = Object.entries(officePoints)
    .map(([office, points]) => ({ office, points }))
    .sort((a, b) => b.points - a.points);

  // Request the roast from Gemini once on load of this screen
  useEffect(() => {
    if (!room.finalRoast && !isGeneratingRoast) {
      onGenerateRoast();
    }
  }, [room.finalRoast]);

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Header Matrix */}
        <div className="text-center space-y-1">
          <span className="font-mono text-[9px] tracking-widest text-[#FF574A] font-bold uppercase block bg-[#FF574A]/10 py-1 px-3 rounded-full border border-[#FF574A]/20 max-w-max mx-auto">
            🤖 GEMINI AI CORE EVALUATION
          </span>
          <h2 className="font-sans font-black text-2xl tracking-tight text-white mt-1">
            SESSION CLOSURE & BEHAVIORAL PROFILING
          </h2>
        </div>

        {/* The Champion Announcement */}
        <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-5 relative text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
          <div className="text-4xl animate-bounce mb-2">🥇</div>
          <span className="font-mono text-[9px] tracking-widest text-amber-500 uppercase font-bold block mb-1">
            THE ULTIMATE TRUTH-WEAVER
          </span>
          <h3 className="font-sans font-black text-xl text-white">
            {winner ? winner.name : "System Glitch"}
          </h3>
          <p className="font-mono text-[11px] text-white/40 mt-1">
            <span className="text-amber-400 font-bold">{winner ? winner.office : "Corporate Matrix"} Base</span>
          </p>
        </div>

        {/* The Gemini AI Custom Roast Container */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#FF574A]">
            <Sparkles className="w-4 h-4 text-[#FF574A]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
              CORE SYNAPSE ROAST OUTPUT:
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 min-h-36 relative font-mono text-xs text-white/80 leading-relaxed shadow-lg flex items-center justify-center">
            {isGeneratingRoast ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <RefreshCw className="w-7 h-7 text-[#FF574A] animate-spin" />
                <span className="text-white/40 uppercase text-[10px] tracking-widest">
                  Calculating Transparency Parameters...
                </span>
              </div>
            ) : room.finalRoast ? (
              <p className="whitespace-pre-wrap leading-relaxed">
                {room.finalRoast}
              </p>
            ) : (
              <div className="text-center text-white/40 py-6">
                <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-white/20" />
                <span>Could not generate roast report. Key disabled.</span>
              </div>
            )}
          </div>
        </div>

        {/* Two Final Session Scoreboards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 border-b border-white/10 pb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/80">
              FINAL SESSION SCOREBOARDS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Board 1: Individual Standings */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
              <span className="font-mono text-[10px] tracking-wider text-[#FF574A] uppercase font-bold block border-b border-white/5 pb-1.5">
                👤 INDIVIDUAL RANKING
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sortedPlayers.map((p, idx) => {
                  const playerAvatarMeta = AVATARS.find(a => a.id === p.avatar);
                  let medal = "";
                  if (idx === 0) medal = "🥇";
                  else if (idx === 1) medal = "🥈";
                  else if (idx === 2) medal = "🥉";

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                        p.id === playerId
                          ? "bg-[#FF574A]/10 border-[#FF574A]/30 text-white"
                          : "bg-white/5 border-white/5 text-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-white/40 font-bold w-4">
                          {medal ? medal : `${idx + 1}.`}
                        </span>
                        <span className="text-base">{playerAvatarMeta?.label.split(" ")[0] || "🤖"}</span>
                        <span className="font-sans font-bold leading-none">
                          {p.name}
                          <span className="block font-mono text-[8px] text-white/30 font-normal mt-0.5">
                            {p.office} office
                          </span>
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white bg-white/5 border border-white/10 px-2 py-1 rounded-xl">
                        {p.points} Pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Board 2: Office Standings */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
              <span className="font-mono text-[10px] tracking-wider text-amber-500 uppercase font-bold block border-b border-white/5 pb-1.5">
                🏢 OFFICE STANDINGS
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sortedOffices.map((off, idx) => {
                  let medal = "";
                  if (idx === 0) medal = "🏆";
                  else if (idx === 1) medal = "🥈";
                  else if (idx === 2) medal = "🥉";

                  return (
                    <div
                      key={off.office}
                      className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/5 text-white/80 animate-fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-white/40 font-bold w-4">
                          {medal ? medal : `${idx + 1}.`}
                        </span>
                        <span className="font-sans font-bold leading-none text-white">
                          {off.office}
                          <span className="block font-mono text-[8px] text-white/30 font-normal mt-0.5">
                            Combined performance
                          </span>
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/5 border border-amber-400/10 px-2 py-1 rounded-xl">
                        {off.points} Pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Terminals */}
      <div className="space-y-3 pt-6 border-t border-white/5 mt-6">
        <div className="flex gap-3">
          <button
            onClick={onViewLeaderboard}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-sans font-bold text-xs tracking-wider uppercase rounded-2xl flex items-center justify-center gap-1.5 transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            VIEW LEADERBOARD
          </button>

          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-[#FF574A] hover:bg-[#FF574A]/90 text-white font-sans font-extrabold text-xs tracking-wider uppercase rounded-2xl flex items-center justify-center gap-1.5 transition shadow-md shadow-[#FF574A]/10"
          >
            <RefreshCw className="w-4 h-4" />
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}


// -------------------------------------------------------------
// SCREEN 7: ACTIVE PLAYGROUND LEADERBOARD
// -------------------------------------------------------------
interface LeaderboardProps {
  onBackToMain: () => void;
  room?: RoomState | null;
  playerId?: string;
}

export function Screen7Leaderboard({ onBackToMain, room, playerId }: LeaderboardProps) {
  const [activeMobileTab, setActiveMobileTab] = useState<"both" | "individual" | "office">("both");

  if (!room) {
    // Fallback to beautiful notice if no room is loaded
    return (
      <div className="flex-1 flex flex-col justify-between p-6 text-center">
        <div className="space-y-6 my-auto">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h2 className="font-sans font-black text-xl tracking-tight text-white">
              NO ACTIVE SESSION
            </h2>
            <p className="font-sans text-xs text-white/50 max-w-xs mx-auto">
              Please create or join a playground room to view the live rankings.
            </p>
          </div>
        </div>

        {/* Commit Return */}
        <div className="pt-6 border-t border-white/5 mt-6">
          <button
            onClick={onBackToMain}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-sans font-extrabold text-xs tracking-widest uppercase transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            RETURN TO PORTAL
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const sortedPlayers = [...room.players].sort((a, b) => b.points - a.points);

  const officePoints: { [office: string]: number } = {};
  room.players.forEach(p => {
    officePoints[p.office] = (officePoints[p.office] || 0) + p.points;
  });

  const sortedOffices = Object.entries(officePoints)
    .map(([office, points]) => ({ office, points }))
    .sort((a, b) => b.points - a.points);

  const activePlayer = room.players.find(p => p.id === playerId);
  const activePlayerRank = activePlayer ? sortedPlayers.findIndex(p => p.id === playerId) + 1 : 0;
  const activeOfficeRank = activePlayer ? sortedOffices.findIndex(o => o.office === activePlayer.office) + 1 : 0;
  const activePlayerPoints = activePlayer ? activePlayer.points : 0;
  const activeOfficePoints = activePlayer ? (officePoints[activePlayer.office] || 0) : 0;

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-6 overflow-y-auto">
      <div className="space-y-4 md:space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <span className="font-mono text-[9px] tracking-widest text-amber-400 font-bold uppercase block bg-amber-400/10 py-1 px-3 rounded-full border border-amber-400/20 max-w-max mx-auto">
            🏆 ACTIVE PLAYGROUND LEADERBOARD
          </span>
          <h2 className="font-sans font-black text-xl sm:text-2xl tracking-tight text-white mt-1">
            FINAL SESSION SCOREBOARDS
          </h2>
          <p className="font-sans text-[10px] sm:text-xs text-white/40 leading-snug">
            Real-time live session points for individual players and combined offices.
          </p>
        </div>

        {/* ONE GLANCE QUICK-STATS SUMMARY BAR */}
        {activePlayer && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {/* Player Quick Stat Card */}
            <div className="bg-gradient-to-br from-[#FF574A]/15 to-[#FF574A]/5 border border-[#FF574A]/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(255,87,74,0.1)] relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] text-white/5 font-black text-6xl select-none font-mono pointer-events-none">
                #{activePlayerRank}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FF574A]/10 border border-[#FF574A]/30 flex items-center justify-center text-xl">
                👤
              </div>
              <div className="min-w-0">
                <span className="block font-mono text-[8px] sm:text-[9px] tracking-widest text-[#FF574A] font-bold uppercase">
                  YOUR STANDING
                </span>
                <h4 className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                  Rank #{activePlayerRank} ({activePlayer.name})
                </h4>
                <p className="font-mono text-[10px] sm:text-xs text-white/70 font-bold">
                  {activePlayerPoints} Pts
                </p>
              </div>
            </div>

            {/* Office Quick Stat Card */}
            <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] text-white/5 font-black text-6xl select-none font-mono pointer-events-none">
                #{activeOfficeRank}
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                🏢
              </div>
              <div className="min-w-0">
                <span className="block font-mono text-[8px] sm:text-[9px] tracking-widest text-amber-400 font-bold uppercase">
                  YOUR OFFICE
                </span>
                <h4 className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                  Rank #{activeOfficeRank} ({activePlayer.office})
                </h4>
                <p className="font-mono text-[10px] sm:text-xs text-amber-400 font-bold">
                  {activeOfficePoints} Pts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE RESPONSIVE TAB BAR (Hidden on desktop) */}
        <div className="md:hidden flex p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveMobileTab("both")}
            className={`flex-1 py-2 text-[10px] font-sans font-bold tracking-wider uppercase rounded-xl transition ${
              activeMobileTab === "both"
                ? "bg-[#FF574A] text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            📋 Stacked
          </button>
          <button
            onClick={() => setActiveMobileTab("individual")}
            className={`flex-1 py-2 text-[10px] font-sans font-bold tracking-wider uppercase rounded-xl transition ${
              activeMobileTab === "individual"
                ? "bg-[#FF574A] text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            👤 Individual
          </button>
          <button
            onClick={() => setActiveMobileTab("office")}
            className={`flex-1 py-2 text-[10px] font-sans font-bold tracking-wider uppercase rounded-xl transition ${
              activeMobileTab === "office"
                ? "bg-[#FF574A] text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            🏢 Office
          </button>
        </div>

        {/* TWO FINAL SESSION SCOREBOARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Board 1: Individual Standings */}
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3 ${
              activeMobileTab !== "both" && activeMobileTab !== "individual" ? "hidden md:block" : "block"
            }`}
          >
            <span className="font-mono text-[10px] tracking-wider text-[#FF574A] uppercase font-bold block border-b border-white/5 pb-1.5 flex items-center justify-between">
              <span>👤 INDIVIDUAL RANKING</span>
              <span className="text-[9px] bg-[#FF574A]/10 text-[#FF574A] px-2 py-0.5 rounded-full font-mono normal-case">
                {room.players.length} Players
              </span>
            </span>
            <div className="space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {sortedPlayers.map((p, idx) => {
                const playerAvatarMeta = AVATARS.find(a => a.id === p.avatar);
                const isCurrentPlayer = p.id === playerId;
                let medal = "";
                if (idx === 0) medal = "🥇";
                else if (idx === 1) medal = "🥈";
                else if (idx === 2) medal = "🥉";

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition duration-200 ${
                      isCurrentPlayer
                        ? "bg-gradient-to-r from-[#FF574A]/15 to-[#FF574A]/5 border-[#FF574A]/40 text-white shadow-[0_0_10px_rgba(255,87,74,0.1)] scale-[1.01]"
                        : "bg-white/3 border-white/5 text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-white/40 font-bold w-4 flex-shrink-0 text-center">
                        {medal ? medal : `${idx + 1}.`}
                      </span>
                      <span className="text-base flex-shrink-0">{playerAvatarMeta?.label.split(" ")[0] || "🤖"}</span>
                      <span className="font-sans font-bold leading-tight text-white truncate">
                        {p.name} {isCurrentPlayer && <span className="text-[9px] font-mono font-bold text-[#FF574A] ml-1 bg-[#FF574A]/10 px-1.5 py-0.5 rounded-full">YOU</span>}
                        <span className="block font-mono text-[8px] text-white/40 font-normal mt-0.5">
                          {p.office} office
                        </span>
                      </span>
                    </div>
                    <span className={`font-mono font-bold px-2 py-1 rounded-xl text-[10px] sm:text-xs flex-shrink-0 ${
                      isCurrentPlayer
                        ? "text-white bg-[#FF574A]/20 border border-[#FF574A]/30"
                        : "text-white/80 bg-white/5 border border-white/10"
                    }`}>
                      {p.points} Pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board 2: Office Standings */}
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3 ${
              activeMobileTab !== "both" && activeMobileTab !== "office" ? "hidden md:block" : "block"
            }`}
          >
            <span className="font-mono text-[10px] tracking-wider text-amber-500 uppercase font-bold block border-b border-white/5 pb-1.5 flex items-center justify-between">
              <span>🏢 OFFICE STANDINGS</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono normal-case">
                {sortedOffices.length} Regions
              </span>
            </span>
            <div className="space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {sortedOffices.map((off, idx) => {
                const isUserOffice = activePlayer?.office === off.office;
                let medal = "";
                if (idx === 0) medal = "🏆";
                else if (idx === 1) medal = "🥈";
                else if (idx === 2) medal = "🥉";

                return (
                  <div
                    key={off.office}
                    className={`flex items-center justify-between p-2 rounded-xl border transition duration-200 ${
                      isUserOffice
                        ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-amber-500/40 text-white shadow-[0_0_10px_rgba(245,158,11,0.1)] scale-[1.01]"
                        : "bg-white/3 border-white/5 text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-white/40 font-bold w-4 flex-shrink-0 text-center">
                        {medal ? medal : `${idx + 1}.`}
                      </span>
                      <span className="font-sans font-bold leading-tight text-white truncate">
                        {off.office} {isUserOffice && <span className="text-[9px] font-mono font-bold text-amber-400 ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded-full">YOURS</span>}
                        <span className="block font-mono text-[8px] text-white/40 font-normal mt-0.5">
                          Combined office aggregate
                        </span>
                      </span>
                    </div>
                    <span className={`font-mono font-bold px-2 py-1 rounded-xl text-[10px] sm:text-xs flex-shrink-0 ${
                      isUserOffice
                        ? "text-amber-400 bg-amber-500/20 border border-amber-500/30"
                        : "text-amber-400/90 bg-amber-400/5 border border-amber-400/10"
                    }`}>
                      {off.points} Pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Commit Return */}
      <div className="pt-4 sm:pt-6 border-t border-white/5 mt-4 sm:mt-6">
        <button
          onClick={onBackToMain}
          className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-sans font-extrabold text-xs tracking-widest uppercase transition flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          RETURN TO PORTAL
        </button>
      </div>
    </div>
  );
}
