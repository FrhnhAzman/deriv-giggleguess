/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple Web Audio API Synthesizer Wrapper for DERIV GIGGLEGUESS
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // Resume context if suspended (browser security policy)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch((err) => console.log("Failed to resume AudioContext:", err));
  }
  
  return audioCtx;
}

// Helper to play a simple sine/triangle wave beep with frequency sweep and volume envelope
function playTone({
  frequencyStart,
  frequencyEnd,
  duration,
  type = "sine",
  gainStart = 0.15,
  gainEnd = 0.001,
  delay = 0,
}: {
  frequencyStart: number;
  frequencyEnd?: number;
  duration: number;
  type?: OscillatorType;
  gainStart?: number;
  gainEnd?: number;
  delay?: number;
}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  setTimeout(() => {
    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequencyStart, ctx.currentTime);
      if (frequencyEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
      }

      gainNode.gain.setValueAtTime(gainStart, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(gainEnd, ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Web Audio playback failed:", e);
    }
  }, delay * 1000);
}

export const playSound = {
  // Rising chime for joining/creating a room
  roomJoined: () => {
    // Elegant arpeggio
    playTone({ frequencyStart: 261.63, duration: 0.15, type: "triangle", delay: 0 }); // C4
    playTone({ frequencyStart: 329.63, duration: 0.15, type: "triangle", delay: 0.08 }); // E4
    playTone({ frequencyStart: 392.00, duration: 0.15, type: "triangle", delay: 0.16 }); // G4
    playTone({ frequencyStart: 523.25, duration: 0.3, type: "sine", gainStart: 0.2, delay: 0.24 }); // C5
  },

  // Interactive high zip/ping sound for submitting secret intel
  secretSubmitted: () => {
    playTone({ frequencyStart: 440.00, frequencyEnd: 880.00, duration: 0.25, type: "sine", gainStart: 0.15 });
  },

  // Snappy double-beep for casting a vote
  voteCast: () => {
    playTone({ frequencyStart: 350, duration: 0.08, type: "sine", gainStart: 0.12 });
    playTone({ frequencyStart: 500, duration: 0.12, type: "sine", gainStart: 0.15, delay: 0.06 });
  },

  // Transition buzz/whoosh sound for rounds and status locking
  roundStarted: () => {
    playTone({ frequencyStart: 180, frequencyEnd: 360, duration: 0.4, type: "triangle", gainStart: 0.2 });
  },

  // Celebratory retro fan-fare for Scoreboard reveal or game over
  scoreboardReveal: () => {
    playTone({ frequencyStart: 392.00, duration: 0.15, type: "sine", delay: 0 }); // G4
    playTone({ frequencyStart: 523.25, duration: 0.15, type: "sine", delay: 0.12 }); // C5
    playTone({ frequencyStart: 659.25, duration: 0.15, type: "sine", delay: 0.24 }); // E5
    playTone({ frequencyStart: 783.99, duration: 0.4, type: "sine", gainStart: 0.2, delay: 0.36 }); // G5
  },
};
