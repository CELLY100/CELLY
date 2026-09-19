import fs from 'fs';
import path from 'path';

/**
 * Generates a valid, musical 16-bit 44.1kHz stereo PCM WAV file
 * with real rhythmic kick, hi-hats, bassline, and melodic chords.
 * This gives every beat actual playable audio previews without external network dependencies!
 */
export function generateBeatAudioWav(
  bpm: number,
  baseFrequency: number,
  genre: string,
  durationSeconds = 16
): Buffer {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const beatSec = 60 / bpm;
  const sixteenthSec = beatSec / 4;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const current16th = Math.floor(t / sixteenthSec);
    const sub16thTime = (t % sixteenthSec) / sixteenthSec;
    const beatTime = (t % beatSec) / beatSec;

    let left = 0;
    let right = 0;

    // 1. Kick Drum on beats 0, 2 (or trap pattern)
    const kickHit = (current16th % 16 === 0) || (current16th % 16 === 10) || (genre.includes('Drill') && (current16th % 16 === 6));
    if (kickHit) {
      const kickTime = t % (beatSec * (kickHit ? 2 : 1));
      if (kickTime < 0.25) {
        const kickPitch = 120 * Math.exp(-kickTime * 25) + 40;
        const kickEnv = Math.exp(-kickTime * 12);
        const kickSample = Math.sin(2 * Math.PI * kickPitch * kickTime) * kickEnv * 0.45;
        left += kickSample;
        right += kickSample;
      }
    }

    // 2. Snare / Clap on beat 2 and 4 (current16th 4, 12 or 8)
    const isSnare = (current16th % 16 === 4) || (current16th % 16 === 12);
    if (isSnare && sub16thTime < 0.25) {
      const noise = (Math.random() * 2 - 1) * Math.exp(-sub16thTime * 18) * 0.22;
      const snap = Math.sin(2 * Math.PI * 220 * sub16thTime) * Math.exp(-sub16thTime * 30) * 0.2;
      left += (noise + snap) * 0.85;
      right += (noise + snap) * 0.95;
    }

    // 3. Hi-Hats (every 16th with subtle velocity accent and rolls)
    const hatTime = sub16thTime;
    if (hatTime < 0.08) {
      const hatVelocity = (current16th % 2 === 0) ? 0.12 : 0.07;
      const hatSample = (Math.random() * 2 - 1) * Math.exp(-hatTime * 50) * hatVelocity;
      left += hatSample * 0.7;
      right += hatSample * 1.1;
    }

    // 4. Bassline / 808
    const bassNote = baseFrequency * ((current16th % 8 < 4) ? 0.5 : 0.75);
    const bassEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * (1 / beatSec) * t);
    const bassSample = Math.sin(2 * Math.PI * bassNote * t) * 0.25 * bassEnv;
    // Saturation
    left += Math.tanh(bassSample * 1.5) * 0.8;
    right += Math.tanh(bassSample * 1.5) * 0.8;

    // 5. Ambient Melodic Chord / Pluck
    const chordPattern = [1, 1.2, 1.5, 1.8];
    const chordIdx = Math.floor((t / (beatSec * 2)) % 4);
    const melodyFreq = baseFrequency * chordPattern[chordIdx];
    const melodyEnv = Math.exp(-((t % (beatSec * 0.5)) / (beatSec * 0.5)) * 4);
    const melodySample = (
      Math.sin(2 * Math.PI * melodyFreq * t) * 0.15 +
      Math.sin(2 * Math.PI * (melodyFreq * 2) * t) * 0.06
    ) * melodyEnv;

    left += melodySample * 0.6;
    right += melodySample * 0.9;

    // Master Limiting / Clamping
    left = Math.max(-1, Math.min(1, left * 0.85));
    right = Math.max(-1, Math.min(1, right * 0.85));

    buffer.writeInt16LE(Math.floor(left * 32767), offset);
    buffer.writeInt16LE(Math.floor(right * 32767), offset + 2);
    offset += 4;
  }

  return buffer;
}

export function ensureSampleAudioFiles(publicAudioDir: string) {
  if (!fs.existsSync(publicAudioDir)) {
    fs.mkdirSync(publicAudioDir, { recursive: true });
  }

  const sampleTracks = [
    { filename: 'beat_midnight_drift.wav', bpm: 140, baseFreq: 73.42, genre: 'Trap' }, // D
    { filename: 'beat_gotham_nights.wav', bpm: 142, baseFreq: 92.50, genre: 'Drill' }, // F#
    { filename: 'beat_silk_smoke.wav', bpm: 92, baseFreq: 65.41, genre: 'R&B' }, // C
    { filename: 'beat_chronicles.wav', bpm: 88, baseFreq: 98.00, genre: 'Boom Bap' }, // G
    { filename: 'beat_aura.wav', bpm: 130, baseFreq: 110.00, genre: 'Melodic Trap' }, // A
    { filename: 'beat_dynasty.wav', bpm: 138, baseFreq: 82.41, genre: 'Cinematic' }, // E
    { filename: 'mastering_demo_before.wav', bpm: 120, baseFreq: 87.31, genre: 'Demo Unmastered' },
    { filename: 'mastering_demo_after.wav', bpm: 120, baseFreq: 87.31, genre: 'Demo Mastered' },
  ];

  for (const track of sampleTracks) {
    const filePath = path.join(publicAudioDir, track.filename);
    if (!fs.existsSync(filePath)) {
      const wavBuffer = generateBeatAudioWav(track.bpm, track.baseFreq, track.genre, 18);
      fs.writeFileSync(filePath, wavBuffer);
    }
  }
}
