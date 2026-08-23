import { createFile } from 'mp4box';
import type { ExtractedAudioTrack } from './videoEngine';

export const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English', en: 'English',
  jpn: 'Japanese', ja: 'Japanese',
  spa: 'Spanish', es: 'Spanish',
  fre: 'French', fra: 'French', fr: 'French',
  ger: 'German', deu: 'German', de: 'German',
  ita: 'Italian', it: 'Italian',
  kor: 'Korean', ko: 'Korean',
  chi: 'Chinese', zho: 'Chinese', zh: 'Chinese',
  por: 'Portuguese', pt: 'Portuguese',
  rus: 'Russian', ru: 'Russian',
  hin: 'Hindi', hi: 'Hindi',
  ara: 'Arabic', ar: 'Arabic',
  ben: 'Bengali', bn: 'Bengali',
  pol: 'Polish', pl: 'Polish',
  tur: 'Turkish', tr: 'Turkish',
  vie: 'Vietnamese', vi: 'Vietnamese',
  ind: 'Indonesian', id: 'Indonesian',
  tha: 'Thai', th: 'Thai',
  swe: 'Swedish', sv: 'Swedish',
  nor: 'Norwegian', no: 'Norwegian',
  dan: 'Danish', da: 'Danish',
  fin: 'Finnish', fi: 'Finnish',
  dut: 'Dutch', nld: 'Dutch', nl: 'Dutch',
  cze: 'Czech', ces: 'Czech', cs: 'Czech',
  gre: 'Greek', ell: 'Greek', el: 'Greek',
  heb: 'Hebrew', he: 'Hebrew',
  ukr: 'Ukrainian', uk: 'Ukrainian',
  hun: 'Hungarian', hu: 'Hungarian',
  rum: 'Romanian', ron: 'Romanian', ro: 'Romanian',
  cat: 'Catalan', ca: 'Catalan',
  tam: 'Tamil', ta: 'Tamil',
  tel: 'Telugu', te: 'Telugu',
  kan: 'Kannada', kn: 'Kannada',
  mal: 'Malayalam', ml: 'Malayalam',
  mar: 'Marathi', mr: 'Marathi',
  pan: 'Punjabi', pa: 'Punjabi',
  urd: 'Urdu', ur: 'Urdu',
  fil: 'Filipino', tl: 'Tagalog',
  msa: 'Malay', ms: 'Malay',
  fas: 'Persian', per: 'Persian', fa: 'Persian',
  und: 'Default Audio',
};

export function getLanguageName(code?: string): string {
  if (!code) return '';
  const clean = code.toLowerCase().trim();
  return LANGUAGE_NAMES[clean] || (code.length === 2 || code.length === 3 ? code.toUpperCase() : code);
}

const SAMPLING_FREQUENCIES: Record<number, number> = {
  96000: 0x0,
  88200: 0x1,
  64000: 0x2,
  48000: 0x3,
  44100: 0x4,
  32000: 0x5,
  24000: 0x6,
  22050: 0x7,
  16000: 0x8,
  12000: 0x9,
  11025: 0xa,
  8000:  0xb,
  7350:  0xc,
};

export function createAdtsHeader(dataLen: number, profile: number, sampleRate: number, channels: number): Uint8Array {
  const freqIdx = SAMPLING_FREQUENCIES[sampleRate] ?? 4;
  const frameLength = dataLen + 7;
  const header = new Uint8Array(7);

  // Syncword 0xFFF (12 bits) + MPEG-4 (0) + Layer 00 (2 bits) + No CRC (1) => 0xFF, 0xF1
  header[0] = 0xFF;
  header[1] = 0xF1;

  // Profile (2 bits) + Freq index (4 bits) + Private (0) + Channel config high bit (1 bit)
  header[2] = ((profile & 0x3) << 6) | ((freqIdx & 0xF) << 2) | ((channels >> 2) & 0x1);

  // Channel config low 2 bits (2 bits) + Original (0) + Home (0) + Copyright (0) + Copyright start (0) + Frame length high 2 bits
  header[3] = ((channels & 0x3) << 6) | ((frameLength >> 11) & 0x3);

  // Frame length middle 8 bits
  header[4] = (frameLength >> 3) & 0xFF;

  // Frame length low 3 bits (3 bits) + Buffer fullness high 5 bits (0x1F)
  header[5] = ((frameLength & 0x7) << 5) | 0x1F;

  // Buffer fullness low 6 bits (0xFC) + No raw data blocks (00)
  header[6] = 0xFC;

  return header;
}

export function safeDecodeAudioData(audioCtx: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const res = audioCtx.decodeAudioData(
        buffer,
        (decoded) => resolve(decoded),
        (err) => reject(err || new Error('Failed to decode audio data'))
      );
      if (res && typeof (res as any).then === 'function') {
        (res as any).then(resolve).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const length = buffer.length;

  let result: Float32Array;
  if (numChannels === 2) {
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    result = new Float32Array(length * 2);
    for (let i = 0; i < length; i++) {
      result[i * 2] = ch0[i];
      result[i * 2 + 1] = ch1[i];
    }
  } else if (numChannels === 1) {
    result = buffer.getChannelData(0);
  } else {
    result = new Float32Array(length * numChannels);
    for (let ch = 0; ch < numChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        result[i * numChannels + ch] = data[i];
      }
    }
  }

  const dataByteLength = result.length * (bitDepth / 8);
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;
  const outBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(outBuffer);

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

export function isMp4OrMov(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(4), view.getUint8(5), view.getUint8(6), view.getUint8(7));
  return magic === 'ftyp' || magic === 'moov';
}

export function isMatroskaOrWebm(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const u8 = new Uint8Array(buffer, 0, 4);
  return u8[0] === 0x1A && u8[1] === 0x45 && u8[2] === 0xDF && u8[3] === 0xA3;
}

/**
 * Demux audio tracks from MP4 / MOV containers using MP4Box
 */
export async function demuxMp4AudioTracks(
  arrayBuffer: ArrayBuffer,
  audioCtx: AudioContext
): Promise<ExtractedAudioTrack[] | null> {
  return new Promise((resolve) => {
    try {
      const ab = arrayBuffer.slice(0);
      (ab as any).fileStart = 0;

      const mp4boxfile = createFile();
      const trackSamplesMap = new Map<number, { info: any; samples: any[] }>();

      mp4boxfile.onError = (err) => {
        console.warn('MP4Box error:', err);
        resolve(null);
      };

      mp4boxfile.onReady = async (info: any) => {
        const audioTracks = info.audioTracks;
        if (!audioTracks || audioTracks.length === 0) {
          resolve(null);
          return;
        }

        for (const track of audioTracks) {
          trackSamplesMap.set(track.id, { info: track, samples: [] });
          mp4boxfile.setExtractionOptions(track.id, track, { nbSamples: 1000000 });
        }

        mp4boxfile.start();
      };

      mp4boxfile.onSamples = (id: number, _user: any, samples: any[]) => {
        const entry = trackSamplesMap.get(id);
        if (entry) {
          entry.samples.push(...samples);
        }
      };

      // When all samples are gathered, convert to audio buffers
      const finalizeExtraction = async () => {
        try {
          const extractedTracks: ExtractedAudioTrack[] = [];
          let trackIndex = 0;

          for (const [id, entry] of trackSamplesMap.entries()) {
            trackIndex++;
            const trackInfo = entry.info;
            const sampleRate = trackInfo.audio?.sample_rate || 44100;
            const channels = trackInfo.audio?.channel_count || 2;
            const samples = entry.samples;

            if (samples.length === 0) continue;

            // Frame AAC samples with ADTS headers
            const totalBytes = samples.reduce((acc, s) => acc + s.size + 7, 0);
            const adtsBuffer = new Uint8Array(totalBytes);
            let offset = 0;

            for (const sample of samples) {
              const header = createAdtsHeader(sample.size, 1, sampleRate, channels);
              adtsBuffer.set(header, offset);
              offset += 7;
              const sampleBytes = new Uint8Array(sample.data.buffer, sample.data.byteOffset, sample.size);
              adtsBuffer.set(sampleBytes, offset);
              offset += sample.size;
            }

            try {
              const decodedBuffer = await safeDecodeAudioData(audioCtx, adtsBuffer.buffer.slice(0, totalBytes));
              const wavBlob = audioBufferToWav(decodedBuffer);

              const rawLang = trackInfo.language && trackInfo.language !== 'und' ? trackInfo.language : '';
              const langName = getLanguageName(rawLang);
              const customName = trackInfo.name && trackInfo.name !== 'SoundHandler' ? trackInfo.name : '';

              let trackTitle = '';
              if (customName && langName) {
                trackTitle = `${customName} (${langName})`;
              } else if (customName) {
                trackTitle = customName;
              } else if (langName) {
                trackTitle = trackIndex === 1 && audioTracksCount(trackSamplesMap) > 1
                  ? `${langName} (Original Audio)`
                  : `${langName} (Dub Audio)`;
              } else {
                trackTitle = `Audio Track ${trackIndex}`;
              }

              const channelLabel = channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : `${channels} Channels`;
              const codecLabel = trackInfo.codec ? trackInfo.codec.toUpperCase().split('.')[0] : 'AAC';

              extractedTracks.push({
                id: `mp4-track-${id}`,
                name: trackTitle,
                description: `${langName ? langName + ' · ' : ''}${channelLabel} · ${codecLabel} · ${(sampleRate / 1000).toFixed(1)} kHz`,
                language: langName || undefined,
                codec: codecLabel,
                blob: wavBlob,
                duration: decodedBuffer.duration,
                sampleRate: decodedBuffer.sampleRate,
                channels: decodedBuffer.numberOfChannels,
              });
            } catch (decodeErr) {
              console.warn(`Failed to decode MP4 track ${id}:`, decodeErr);
            }
          }

          if (extractedTracks.length > 0) {
            resolve(extractedTracks);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.warn('Error during MP4 track extraction finalization:', e);
          resolve(null);
        }
      };

      mp4boxfile.appendBuffer(ab);
      mp4boxfile.flush();

      // Give event loop tick to finish sample dispatch
      setTimeout(() => {
        finalizeExtraction();
      }, 50);
    } catch (e) {
      console.warn('MP4 demuxer exception:', e);
      resolve(null);
    }
  });
}

function audioTracksCount(map: Map<number, any>): number {
  return map.size;
}

// ----------------------------------------------------
// EBML / Matroska (MKV, WebM) Parser & Demuxer
// ----------------------------------------------------

interface EbmlTrack {
  trackNumber: number;
  trackType: number;
  codecId: string;
  name?: string;
  language?: string;
  codecPrivate?: Uint8Array;
  audio: {
    samplingFrequency?: number;
    channels?: number;
    bitDepth?: number;
  };
}

function readVint(buf: Uint8Array, offset: number): { value: number; length: number } | null {
  const firstByte = buf[offset];
  if (firstByte === undefined) return null;
  let len = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && len < 8) {
    len++;
    mask >>= 1;
  }
  if (len > 8) return null;
  let val = firstByte & (mask - 1);
  for (let i = 1; i < len; i++) {
    val = val * 256 + buf[offset + i];
  }
  return { value: val, length: len };
}

function readElementId(buf: Uint8Array, offset: number): { id: number; length: number } | null {
  const firstByte = buf[offset];
  if (firstByte === undefined) return null;
  let len = 1;
  let mask = 0x80;
  while ((firstByte & mask) === 0 && len < 8) {
    len++;
    mask >>= 1;
  }
  let id = 0;
  for (let i = 0; i < len; i++) {
    id = id * 256 + buf[offset + i];
  }
  return { id, length: len };
}

function readUint(buf: Uint8Array, offset: number, length: number): number {
  let val = 0;
  for (let i = 0; i < length; i++) {
    val = val * 256 + buf[offset + i];
  }
  return val;
}

function readFloat(buf: Uint8Array, offset: number, length: number): number {
  const view = new DataView(buf.buffer, buf.byteOffset + offset, length);
  if (length === 4) return view.getFloat32(0);
  if (length === 8) return view.getFloat64(0);
  return 0;
}

function readUtf8(buf: Uint8Array, offset: number, length: number): string {
  const sub = buf.subarray(offset, offset + length);
  return new TextDecoder('utf-8').decode(sub);
}

function encodeVint(val: number): Uint8Array {
  if (val < 0x7F) return new Uint8Array([0x80 | val]);
  if (val < 0x3FFF) return new Uint8Array([0x40 | (val >> 8), val & 0xFF]);
  if (val < 0x1FFFFF) return new Uint8Array([0x20 | (val >> 16), (val >> 8) & 0xFF, val & 0xFF]);
  if (val < 0x0FFFFFFF) return new Uint8Array([0x10 | (val >> 24), (val >> 16) & 0xFF, (val >> 8) & 0xFF, val & 0xFF]);
  const arr = new Uint8Array(8);
  const view = new DataView(arr.buffer);
  view.setBigUint64(0, BigInt(val));
  arr[0] = arr[0] | 0x01;
  return arr;
}

function encodeElement(idHex: string, dataBuffer: Uint8Array): Uint8Array {
  const idBytes = new Uint8Array(idHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const sizeBytes = encodeVint(dataBuffer.length);
  const res = new Uint8Array(idBytes.length + sizeBytes.length + dataBuffer.length);
  res.set(idBytes, 0);
  res.set(sizeBytes, idBytes.length);
  res.set(dataBuffer, idBytes.length + sizeBytes.length);
  return res;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

/**
 * Demux audio tracks from MKV / WebM containers
 */
export async function demuxMatroskaAudioTracks(
  arrayBuffer: ArrayBuffer,
  audioCtx: AudioContext
): Promise<ExtractedAudioTrack[] | null> {
  try {
    const buf = new Uint8Array(arrayBuffer);
    let pos = 0;
    const len = buf.length;

    let segmentStart = 0;
    let segmentEnd = len;

    // Scan top-level elements
    while (pos < len) {
      const idInfo = readElementId(buf, pos);
      if (!idInfo) break;
      const sizeInfo = readVint(buf, pos + idInfo.length);
      if (!sizeInfo) break;
      const elStart = pos + idInfo.length + sizeInfo.length;
      const elSize = sizeInfo.value;

      if (idInfo.id === 0x18538067) { // Segment
        segmentStart = elStart;
        segmentEnd = elSize === 0x01ffffffffffffff ? len : elStart + elSize;
        break;
      }
      pos = elStart + elSize;
    }

    if (segmentStart === 0) return null;

    // Scan inside segment for Tracks (0x1654AE6B)
    pos = segmentStart;
    const tracks: EbmlTrack[] = [];
    const rawTrackEntries = new Map<number, Uint8Array>();

    while (pos < segmentEnd && pos < len) {
      const idInfo = readElementId(buf, pos);
      if (!idInfo) break;
      const sizeInfo = readVint(buf, pos + idInfo.length);
      if (!sizeInfo) break;
      const elStart = pos + idInfo.length + sizeInfo.length;
      const elSize = sizeInfo.value;

      if (idInfo.id === 0x1654AE6B) { // Tracks
        let tPos = elStart;
        const tEnd = elStart + elSize;
        while (tPos < tEnd) {
          const entryId = readElementId(buf, tPos);
          if (!entryId) break;
          const entrySize = readVint(buf, tPos + entryId.length);
          if (!entrySize) break;
          const entryStart = tPos + entryId.length + entrySize.length;
          const entryContentSize = entrySize.value;

          if (entryId.id === 0xAE) { // TrackEntry
            const trackEntryBytes = buf.subarray(entryStart, entryStart + entryContentSize);
            const track: EbmlTrack = {
              trackNumber: 1,
              trackType: 0,
              codecId: '',
              audio: {},
            };

            let subPos = entryStart;
            const subEnd = entryStart + entryContentSize;
            while (subPos < subEnd) {
              const subId = readElementId(buf, subPos);
              if (!subId) break;
              const subSize = readVint(buf, subPos + subId.length);
              if (!subSize) break;
              const cStart = subPos + subId.length + subSize.length;
              const cSize = subSize.value;

              if (subId.id === 0xD7) track.trackNumber = readUint(buf, cStart, cSize);
              else if (subId.id === 0x83) track.trackType = readUint(buf, cStart, cSize);
              else if (subId.id === 0x86) track.codecId = readUtf8(buf, cStart, cSize);
              else if (subId.id === 0x536E) track.name = readUtf8(buf, cStart, cSize);
              else if (subId.id === 0x22B59C) track.language = readUtf8(buf, cStart, cSize);
              else if (subId.id === 0x63A2) track.codecPrivate = buf.subarray(cStart, cStart + cSize);
              else if (subId.id === 0xE1) { // Audio Settings
                let aPos = cStart;
                const aEnd = cStart + cSize;
                while (aPos < aEnd) {
                  const aId = readElementId(buf, aPos);
                  if (!aId) break;
                  const aSize = readVint(buf, aPos + aId.length);
                  if (!aSize) break;
                  const acStart = aPos + aId.length + aSize.length;
                  const acSize = aSize.value;
                  if (aId.id === 0xB5) track.audio.samplingFrequency = readFloat(buf, acStart, acSize);
                  else if (aId.id === 0x9F) track.audio.channels = readUint(buf, acStart, acSize);
                  else if (aId.id === 0x6264) track.audio.bitDepth = readUint(buf, acStart, acSize);
                  aPos = acStart + acSize;
                }
              }
              subPos = cStart + cSize;
            }

            if (track.trackType === 2) { // Audio Track
              tracks.push(track);
              rawTrackEntries.set(track.trackNumber, trackEntryBytes);
            }
          }
          tPos = entryStart + entryContentSize;
        }
        break;
      }
      pos = elStart + elSize;
    }

    if (tracks.length === 0) return null;

    const extractedAudioTracks: ExtractedAudioTrack[] = [];
    let audioIndex = 0;

    for (const track of tracks) {
      audioIndex++;
      const sampleRate = track.audio.samplingFrequency || 48000;
      const channels = track.audio.channels || 2;
      const codec = track.codecId;
      const rawLang = track.language && track.language !== 'und' ? track.language : '';
      const langName = getLanguageName(rawLang);
      const customName = track.name || '';

      let trackTitle = '';
      if (customName && langName) {
        trackTitle = `${customName} (${langName})`;
      } else if (customName) {
        trackTitle = customName;
      } else if (langName) {
        trackTitle = audioIndex === 1 && tracks.length > 1
          ? `${langName} (Original Audio)`
          : `${langName} (Dub Audio)`;
      } else {
        trackTitle = `Audio Track ${audioIndex}`;
      }

      // Case 1: AAC in MKV (A_AAC)
      if (codec.includes('AAC')) {
        const aacFrames: Uint8Array[] = [];

        // Scan clusters for track's SimpleBlocks
        let cScanPos = segmentStart;
        while (cScanPos < segmentEnd && cScanPos < len) {
          const idInfo = readElementId(buf, cScanPos);
          if (!idInfo) break;
          const sizeInfo = readVint(buf, cScanPos + idInfo.length);
          if (!sizeInfo) break;
          const elStart = cScanPos + idInfo.length + sizeInfo.length;
          const elSize = sizeInfo.value;

          if (idInfo.id === 0x1F43B675) { // Cluster
            let bPos = elStart;
            const bEnd = elStart + elSize;
            while (bPos < bEnd && bPos < len) {
              const bId = readElementId(buf, bPos);
              if (!bId) break;
              const bSize = readVint(buf, bPos + bId.length);
              if (!bSize) break;
              const bStart = bPos + bId.length + bSize.length;
              const bContentSize = bSize.value;

              if (bId.id === 0xA3) { // SimpleBlock
                const trkVint = readVint(buf, bStart);
                if (trkVint && trkVint.value === track.trackNumber) {
                  const headerSize = trkVint.length + 3; // track vint + timecode (2) + flags (1)
                  const payload = buf.subarray(bStart + headerSize, bStart + bContentSize);
                  const adts = createAdtsHeader(payload.length, 1, sampleRate, channels);
                  aacFrames.push(adts, payload);
                }
              }
              bPos = bStart + bContentSize;
            }
          }
          cScanPos = elStart + elSize;
        }

        if (aacFrames.length > 0) {
          const fullAac = concatUint8Arrays(aacFrames);
          try {
            const decodedBuffer = await safeDecodeAudioData(audioCtx, fullAac.buffer);
            const wavBlob = audioBufferToWav(decodedBuffer);
            extractedAudioTracks.push({
              id: `mkv-track-${track.trackNumber}`,
              name: trackTitle,
              description: `${langName ? langName + ' · ' : ''}${channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : channels + ' Channels'} · AAC · ${(sampleRate / 1000).toFixed(1)} kHz`,
              language: langName || undefined,
              codec: 'AAC',
              blob: wavBlob,
              duration: decodedBuffer.duration,
              sampleRate: decodedBuffer.sampleRate,
              channels: decodedBuffer.numberOfChannels,
            });
            continue;
          } catch (e) {
            console.warn(`Failed to decode MKV AAC track ${track.trackNumber}:`, e);
          }
        }
      }

      // Case 2: Opus / Vorbis / Generic in WebM container (A_OPUS, A_VORBIS)
      if (codec.includes('OPUS') || codec.includes('VORBIS')) {
        const ebmlHeader = encodeElement('1a45dfa3', concatUint8Arrays([
          encodeElement('4286', new Uint8Array([1])),
          encodeElement('42f7', new Uint8Array([1])),
          encodeElement('42f2', new Uint8Array([4])),
          encodeElement('42f3', new Uint8Array([8])),
          encodeElement('4282', new TextEncoder().encode('webm')),
          encodeElement('4287', new Uint8Array([2])),
          encodeElement('4285', new Uint8Array([2])),
        ]));

        const rawEntry = rawTrackEntries.get(track.trackNumber);
        if (!rawEntry) continue;

        // Rewrite TrackNumber to 1 inside TrackEntry
        const entryCopy = new Uint8Array(rawEntry);
        let ep = 0;
        while (ep < entryCopy.length) {
          const subId = readElementId(entryCopy, ep);
          if (!subId) break;
          const subSz = readVint(entryCopy, ep + subId.length);
          if (!subSz) break;
          const contentS = ep + subId.length + subSz.length;
          if (subId.id === 0xD7) {
            entryCopy[contentS] = 1;
          }
          ep = contentS + subSz.value;
        }

        const trackElement = encodeElement('ae', entryCopy);
        const tracksElement = encodeElement('1654ae6b', trackElement);

        const infoElement = encodeElement('1549a966', concatUint8Arrays([
          encodeElement('2ad7b1', new Uint8Array([0x0f, 0x42, 0x40])),
          encodeElement('4d80', new TextEncoder().encode('NovaTools')),
          encodeElement('5741', new TextEncoder().encode('NovaTools')),
        ]));

        const clusters: Uint8Array[] = [];
        let cScanPos = segmentStart;
        while (cScanPos < segmentEnd && cScanPos < len) {
          const idInfo = readElementId(buf, cScanPos);
          if (!idInfo) break;
          const sizeInfo = readVint(buf, cScanPos + idInfo.length);
          if (!sizeInfo) break;
          const elStart = cScanPos + idInfo.length + sizeInfo.length;
          const elSize = sizeInfo.value;

          if (idInfo.id === 0x1F43B675) { // Cluster
            let bPos = elStart;
            const bEnd = elStart + elSize;
            let clusterTimecodeBuf: Uint8Array | null = null;
            const clusterBlocks: Uint8Array[] = [];

            while (bPos < bEnd && bPos < len) {
              const bId = readElementId(buf, bPos);
              if (!bId) break;
              const bSize = readVint(buf, bPos + bId.length);
              if (!bSize) break;
              const bStart = bPos + bId.length + bSize.length;
              const bContentSize = bSize.value;

              if (bId.id === 0xE7) {
                clusterTimecodeBuf = encodeElement('e7', buf.subarray(bStart, bStart + bContentSize));
              } else if (bId.id === 0xA3) { // SimpleBlock
                const trkVint = readVint(buf, bStart);
                if (trkVint && trkVint.value === track.trackNumber) {
                  const blockPayload = buf.subarray(bStart + trkVint.length, bStart + bContentSize);
                  const rewrittenBlock = new Uint8Array(1 + blockPayload.length);
                  rewrittenBlock[0] = 0x81; // Track 1 VINT
                  rewrittenBlock.set(blockPayload, 1);
                  clusterBlocks.push(encodeElement('a3', rewrittenBlock));
                }
              }
              bPos = bStart + bContentSize;
            }

            if (clusterBlocks.length > 0) {
              const clusterContent = concatUint8Arrays([
                clusterTimecodeBuf || encodeElement('e7', new Uint8Array([0])),
                ...clusterBlocks,
              ]);
              clusters.push(encodeElement('1f43b675', clusterContent));
            }
          }
          cScanPos = elStart + elSize;
        }

        if (clusters.length > 0) {
          const segmentContent = concatUint8Arrays([infoElement, tracksElement, ...clusters]);
          const segmentElement = encodeElement('18538067', segmentContent);
          const fullWebm = concatUint8Arrays([ebmlHeader, segmentElement]);

          try {
            const decodedBuffer = await safeDecodeAudioData(audioCtx, fullWebm.buffer);
            const wavBlob = audioBufferToWav(decodedBuffer);
            const codecDisplay = codec.replace('A_', '');
            extractedAudioTracks.push({
              id: `mkv-track-${track.trackNumber}`,
              name: trackTitle,
              description: `${langName ? langName + ' · ' : ''}${channels === 1 ? 'Mono' : channels === 2 ? 'Stereo' : channels + ' Channels'} · ${codecDisplay} · ${(sampleRate / 1000).toFixed(1)} kHz`,
              language: langName || undefined,
              codec: codecDisplay,
              blob: wavBlob,
              duration: decodedBuffer.duration,
              sampleRate: decodedBuffer.sampleRate,
              channels: decodedBuffer.numberOfChannels,
            });
            continue;
          } catch (e) {
            console.warn(`Failed to decode MKV Opus/Vorbis track ${track.trackNumber}:`, e);
          }
        }
      }
    }

    return extractedAudioTracks.length > 0 ? extractedAudioTracks : null;
  } catch (e) {
    console.warn('Matroska demuxer exception:', e);
    return null;
  }
}
