


import { ASSETS } from "./gameConfig";

let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer> = {};
let bgmSource: AudioBufferSourceNode | null = null;
const missingAudioAssets: string[] = [];

export const getMissingAudioAssets = () => [...missingAudioAssets];

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const loadAudioAssets = async (): Promise<void> => {
    // Initialize context (it might stay suspended until user interaction, which is fine for decoding)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const promises = Object.entries(ASSETS.sounds).map(([key, url]) => {
        const cleanUrl = url.trim();
        return fetch(cleanUrl)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.arrayBuffer();
            })
            .then(arrayBuffer => audioCtx!.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                audioBuffers[key] = audioBuffer;
                console.log(`[Audio] Loaded: ${key}`);
            })
            .catch(e => {
                console.warn(`[Audio] Failed to load sound: ${cleanUrl} (${key}). Using synthesis fallback.`);
                missingAudioAssets.push(`${cleanUrl} (Key: ${key})`);
            });
    });

    await Promise.all(promises);
};

export const updateAssetAudio = async (key: string, buffer: ArrayBuffer) => {
    initAudio();
    if (audioCtx) {
        try {
            const audioBuffer = await audioCtx.decodeAudioData(buffer);
            audioBuffers[key] = audioBuffer;
            console.log(`[Audio] Hot-swapped sound: ${key}`);
            
            // Remove from missing list if it was there
            const missingIndex = missingAudioAssets.findIndex(str => str.includes(`(Key: ${key})`));
            if (missingIndex > -1) {
                missingAudioAssets.splice(missingIndex, 1);
            }

            if (key === "bgm" && bgmSource) {
                startMusic();
            }
        } catch (e) {
            console.warn(`[Audio] Failed to decode hot-swapped sound: ${key}`, e);
        }
    }
};

export const startMusic = () => {
    if (!audioCtx || !audioBuffers["bgm"]) return;
    
    if (bgmSource) {
        try { bgmSource.stop(); } catch(e){}
    }
    
    bgmSource = audioCtx.createBufferSource();
    bgmSource.buffer = audioBuffers["bgm"];
    bgmSource.loop = true;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.3; 
    
    bgmSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    bgmSource.start();
};

export const playSound = (type: "eat" | "die" | "win" | "levelup" | "dash" | "frenzy" | "combo" | "zap" | "explode" | "shield" | "suction" | "powerup" | "freeze") => {
  if (!audioCtx) return;

  const buffer = audioBuffers[type];
  if (buffer) {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      return;
  }

  // --- Fallback Synthesis (Only runs if file is missing) ---
  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch (type) {
    case "eat":
      const oscEat = audioCtx.createOscillator();
      oscEat.connect(gainNode);
      oscEat.type = "triangle";
      oscEat.frequency.setValueAtTime(400 + Math.random() * 200, now);
      oscEat.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      oscEat.start(now);
      oscEat.stop(now + 0.1);
      break;

    case "die":
      const oscDie = audioCtx.createOscillator();
      oscDie.connect(gainNode);
      oscDie.type = "sawtooth";
      oscDie.frequency.setValueAtTime(150, now);
      oscDie.frequency.linearRampToValueAtTime(30, now + 1.0);
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
      oscDie.start(now);
      oscDie.stop(now + 1.0);
      break;

    case "levelup":
      const oscLvl = audioCtx.createOscillator();
      oscLvl.connect(gainNode);
      oscLvl.type = "sine";
      oscLvl.frequency.setValueAtTime(300, now);
      oscLvl.frequency.linearRampToValueAtTime(600, now + 0.2);
      oscLvl.frequency.linearRampToValueAtTime(900, now + 0.4);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
      oscLvl.start(now);
      oscLvl.stop(now + 0.6);
      break;

    case "dash":
      const oscDash = audioCtx.createOscillator();
      oscDash.connect(gainNode);
      oscDash.type = "square";
      oscDash.frequency.setValueAtTime(100, now);
      oscDash.frequency.linearRampToValueAtTime(50, now + 0.2);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      oscDash.start(now);
      oscDash.stop(now + 0.2);
      break;

    case "frenzy":
      const oscFrenzy = audioCtx.createOscillator();
      oscFrenzy.connect(gainNode);
      oscFrenzy.type = "square";
      oscFrenzy.frequency.setValueAtTime(800, now);
      oscFrenzy.frequency.setValueAtTime(1200, now + 0.1);
      oscFrenzy.frequency.setValueAtTime(800, now + 0.2);
      oscFrenzy.frequency.setValueAtTime(1200, now + 0.3);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
      oscFrenzy.start(now);
      oscFrenzy.stop(now + 0.4);
      break;
      
    case "combo":
      const oscCombo = audioCtx.createOscillator();
      oscCombo.connect(gainNode);
      oscCombo.type = "sine";
      oscCombo.frequency.setValueAtTime(500, now);
      oscCombo.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
      oscCombo.start(now);
      oscCombo.stop(now + 0.15);
      break;

    case "win":
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const noteGain = audioCtx!.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx!.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.15;
        noteGain.gain.setValueAtTime(0, start);
        noteGain.gain.linearRampToValueAtTime(0.2, start + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, start + 1.5);
        osc.start(start);
        osc.stop(start + 1.5);
      });
      break;

    case "zap":
        const oscZap = audioCtx.createOscillator();
        oscZap.connect(gainNode);
        oscZap.type = "sawtooth";
        oscZap.frequency.setValueAtTime(200, now);
        oscZap.frequency.linearRampToValueAtTime(800, now + 0.1);
        oscZap.frequency.linearRampToValueAtTime(200, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        oscZap.start(now);
        oscZap.stop(now + 0.3);
        break;

    case "explode":
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);
        noiseFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        noise.start(now);
        break;

    case "shield":
        const oscShield = audioCtx.createOscillator();
        oscShield.connect(gainNode);
        oscShield.type = "sine";
        oscShield.frequency.setValueAtTime(300, now);
        oscShield.frequency.linearRampToValueAtTime(500, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        oscShield.start(now);
        oscShield.stop(now + 0.3);
        break;

    case "suction":
        const sBufferSize = audioCtx.sampleRate * 0.3;
        const sBuffer = audioCtx.createBuffer(1, sBufferSize, audioCtx.sampleRate);
        const sData = sBuffer.getChannelData(0);
        for (let i = 0; i < sBufferSize; i++) {
            sData[i] = Math.random() * 2 - 1;
        }
        const sNoise = audioCtx.createBufferSource();
        sNoise.buffer = sBuffer;
        const sFilter = audioCtx.createBiquadFilter();
        sFilter.type = 'lowpass';
        sFilter.frequency.setValueAtTime(800, now);
        sFilter.frequency.linearRampToValueAtTime(200, now + 0.3);
        sNoise.connect(sFilter);
        sFilter.connect(gainNode);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        sNoise.start(now);
        break;
    
    case "powerup":
        const oscPower = audioCtx.createOscillator();
        oscPower.connect(gainNode);
        oscPower.type = "triangle";
        oscPower.frequency.setValueAtTime(440, now);
        oscPower.frequency.linearRampToValueAtTime(880, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        oscPower.start(now);
        oscPower.stop(now + 0.2);
        break;

    case "freeze":
        const oscFreeze = audioCtx.createOscillator();
        oscFreeze.connect(gainNode);
        oscFreeze.type = "sine";
        oscFreeze.frequency.setValueAtTime(1000, now);
        oscFreeze.frequency.linearRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscFreeze.start(now);
        oscFreeze.stop(now + 0.5);
        break;
  }
};
