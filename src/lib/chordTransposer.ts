// Musical Chord Transposition & Lyrics Parser for IEQ VILA ANDREZA Worship Ministry

export const MUSICAL_KEYS = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

const NOTE_INDEX_MAP: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function getSemitoneDiff(fromKey: string, toKey: string): number {
  const cleanFrom = fromKey.replace(/m$/, '').trim();
  const cleanTo = toKey.replace(/m$/, '').trim();
  const fromIdx = NOTE_INDEX_MAP[cleanFrom] ?? 0;
  const toIdx = NOTE_INDEX_MAP[cleanTo] ?? 0;
  return (toIdx - fromIdx + 12) % 12;
}

export function transposeSingleNote(note: string, semitones: number, preferFlats: boolean = false): string {
  const idx = NOTE_INDEX_MAP[note];
  if (idx === undefined) return note;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return preferFlats ? FLAT_NOTES[newIdx] : SHARP_NOTES[newIdx];
}

export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return chord;
  const preferFlats = targetKey ? ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Dm', 'Gm', 'Cm', 'Fm'].includes(targetKey) : false;

  // Handle slash chords like G/B or D/F#
  return chord
    .split('/')
    .map((part) => {
      const match = part.match(/^([A-G][#b]?)(.*)$/);
      if (!match) return part;
      const [, rootNote, suffix] = match;
      const transposedRoot = transposeSingleNote(rootNote, semitones, preferFlats);
      return `${transposedRoot}${suffix}`;
    })
    .join('/');
}

/**
 * Transposes all bracketed chords [C], [G/B], [Am7] inside ChordPro content
 */
export function transposeChordProText(content: string, fromKey: string, toKey: string): string {
  const semitones = getSemitoneDiff(fromKey, toKey);
  if (semitones === 0) return content;

  return content.replace(/\[([^\]]+)\]/g, (_full, chordInside) => {
    const transposed = transposeChord(chordInside.trim(), semitones, toKey);
    return `[${transposed}]`;
  });
}

/**
 * Strips all [Chord] markers to return pure lyrics for projection or vocal view
 */
export function stripChordsFromText(content: string): string {
  return content
    .replace(/\[([^\]]+)\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

/**
 * Converts a single line with [Chord] markers into a two-row object: { chordLine, lyricLine }
 */
export interface ParsedChordLine {
  type: 'section' | 'lyric_with_chords' | 'empty';
  sectionTitle?: string;
  chordLine?: string;
  lyricLine?: string;
  segments?: Array<{ chord: string; text: string }>;
}

export function parseChordProLines(content: string): ParsedChordLine[] {
  const lines = content.split('\n');
  return lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      return { type: 'empty' };
    }

    // Check if it's a section header like {Refrão} or [Intro:] or [Refrão]
    if (/^\{.*\}$/.test(trimmed) || /^(Intro|Verso|Primeira Parte|Refrão|Ponte|Final|Coro| Instrumental)[:\s]/i.test(trimmed)) {
      return {
        type: 'section',
        sectionTitle: trimmed.replace(/^\{|\}$/g, ''),
      };
    }

    // Parse segments of [Chord]lyric
    const segments: Array<{ chord: string; text: string }> = [];
    const regex = /\[([^\]]+)\]([^\[]*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Leading text before first chord
    const firstBracket = rawLine.indexOf('[');
    if (firstBracket > 0) {
      segments.push({ chord: '', text: rawLine.slice(0, firstBracket) });
    } else if (firstBracket === -1) {
      segments.push({ chord: '', text: rawLine });
      return {
        type: 'lyric_with_chords',
        lyricLine: rawLine,
        segments,
      };
    }

    while ((match = regex.exec(rawLine)) !== null) {
      segments.push({
        chord: match[1],
        text: match[2] || '',
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawLine.length && firstBracket !== -1) {
      segments.push({ chord: '', text: rawLine.slice(lastIndex) });
    }

    return {
      type: 'lyric_with_chords',
      lyricLine: stripChordsFromText(rawLine),
      segments,
    };
  });
}

/**
 * Splits a song into projection slides (stanzas) for Wall Projection ("Projetar na Parede")
 */
export function getProjectionSlides(content: string): Array<{ label: string; lines: string[] }> {
  const rawBlocks = content.split(/\n\s*\n/);
  const slides: Array<{ label: string; lines: string[] }> = [];

  rawBlocks.forEach((block, idx) => {
    const rawLines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) return;

    let label = `Estrofe ${idx + 1}`;
    const cleanLines: string[] = [];

    rawLines.forEach((line) => {
      if (/^\{.*\}$/.test(line)) {
        label = line.replace(/^\{|\}$/g, '');
      } else if (/^(Intro|Verso|Primeira Parte|Refrão|Ponte|Final|Coro)[:\s]*$/i.test(line)) {
        label = line.replace(/:$/, '');
      } else {
        const stripped = stripChordsFromText(line).trim();
        if (stripped) {
          cleanLines.push(stripped);
        }
      }
    });

    if (cleanLines.length > 0) {
      slides.push({ label, lines: cleanLines });
    }
  });

  return slides;
}
