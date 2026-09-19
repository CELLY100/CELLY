export const MAJOR_KEYS = [
  'C Major',
  'C# Major',
  'D Major',
  'D# Major',
  'E Major',
  'F Major',
  'F# Major',
  'G Major',
  'G# Major',
  'A Major',
  'A# Major',
  'B Major',
] as const;

export const MINOR_KEYS = [
  'C Minor',
  'C# Minor',
  'D Minor',
  'D# Minor',
  'E Minor',
  'F Minor',
  'F# Minor',
  'G Minor',
  'G# Minor',
  'A Minor',
  'A# Minor',
  'B Minor',
] as const;

export const MUSICAL_KEYS = [
  ...MAJOR_KEYS,
  ...MINOR_KEYS,
] as const;

export type MajorKey = (typeof MAJOR_KEYS)[number];
export type MinorKey = (typeof MINOR_KEYS)[number];
export type MusicalKey = (typeof MUSICAL_KEYS)[number];

/**
 * Intelligent parser to detect musical key from uploaded audio filenames
 * (e.g., "Drake_Beat_140BPM_C#_Minor.wav", "Summer_Vibes_F#Major.mp3", "808_A#m.wav")
 */
export function parseKeyFromFilename(filename: string): MusicalKey | null {
  if (!filename) return null;
  const clean = filename.replace(/\.[^/.]+$/, '').toLowerCase();

  const patterns: { key: MusicalKey; regex: RegExp }[] = [
    // Sharps Minor (check minor first before major)
    { key: 'C# Minor', regex: /(?:c#|c\s*sharp|db)[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'D# Minor', regex: /(?:d#|d\s*sharp|eb)[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'F# Minor', regex: /(?:f#|f\s*sharp|gb)[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'G# Minor', regex: /(?:g#|g\s*sharp|ab)[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'A# Minor', regex: /(?:a#|a\s*sharp|bb)[_\s-]*(?:min(?:or)?|m\b)/i },

    // Sharps Major
    { key: 'C# Major', regex: /(?:c#|c\s*sharp|db)[_\s-]*(?:maj(?:or)?|\b)/i },
    { key: 'D# Major', regex: /(?:d#|d\s*sharp|eb)[_\s-]*(?:maj(?:or)?|\b)/i },
    { key: 'F# Major', regex: /(?:f#|f\s*sharp|gb)[_\s-]*(?:maj(?:or)?|\b)/i },
    { key: 'G# Major', regex: /(?:g#|g\s*sharp|ab)[_\s-]*(?:maj(?:or)?|\b)/i },
    { key: 'A# Major', regex: /(?:a#|a\s*sharp|bb)[_\s-]*(?:maj(?:or)?|\b)/i },

    // Naturals Minor
    { key: 'C Minor', regex: /\bc[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'D Minor', regex: /\bd[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'E Minor', regex: /\be[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'F Minor', regex: /\bf[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'G Minor', regex: /\bg[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'A Minor', regex: /\ba[_\s-]*(?:min(?:or)?|m\b)/i },
    { key: 'B Minor', regex: /\bb[_\s-]*(?:min(?:or)?|m\b)/i },

    // Naturals Major
    { key: 'C Major', regex: /\bc[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'D Major', regex: /\bd[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'E Major', regex: /\be[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'F Major', regex: /\bf[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'G Major', regex: /\bg[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'A Major', regex: /\ba[_\s-]*(?:maj(?:or)?)\b/i },
    { key: 'B Major', regex: /\bb[_\s-]*(?:maj(?:or)?)\b/i },
  ];

  for (const { key, regex } of patterns) {
    if (regex.test(clean)) {
      return key;
    }
  }

  return null;
}

/**
 * Intelligent parser to detect BPM tempo from audio filenames
 * (e.g. "Song_140BPM.wav", "Beat_132_bpm.mp3")
 */
export function parseBpmFromFilename(filename: string): number | null {
  if (!filename) return null;
  const match = filename.match(/\b([6-9]\d|1\d\d|2[0-2]\d)\s*(?:bpm)?\b/i);
  if (match && match[1]) {
    const val = parseInt(match[1], 10);
    if (val >= 60 && val <= 220) {
      return val;
    }
  }
  return null;
}


