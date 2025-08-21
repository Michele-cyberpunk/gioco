/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {Blob} from '@google/genai';

export function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // convert float32 -1 to 1 to int16 -32768 to 32767
    int16[i] = data[i] * 32768;
  }

  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const buffer = ctx.createBuffer(
    numChannels,
    data.length / 2 / numChannels,
    sampleRate,
  );

  const dataInt16 = new Int16Array(data.buffer);
  const l = dataInt16.length;
  const dataFloat32 = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0;
  }
  // Extract interleaved channels
  if (numChannels === 0) {
    buffer.copyToChannel(dataFloat32, 0);
  } else {
    for (let i = 0; i < numChannels; i++) {
      const channel = dataFloat32.filter(
        (_, index) => index % numChannels === i,
      );
      buffer.copyToChannel(channel, i);
    }
  }

  return buffer;
}

/**
 * Parses bits per sample and rate from an audio MIME type string.
 * @param mimeType The audio MIME type string (e.g., "audio/L16;rate=24000").
 * @returns An object with "bitsPerSample" and "rate".
 */
function parseAudioMimeType(
  mimeType: string,
): {bitsPerSample: number; rate: number} {
  let bitsPerSample = 16;
  let rate = 24000;

  const parts = mimeType.split(';');
  for (const param of parts) {
    const trimmedParam = param.trim();
    if (trimmedParam.toLowerCase().startsWith('rate=')) {
      try {
        const rateStr = trimmedParam.split('=')[1];
        rate = parseInt(rateStr, 10);
      } catch (e) {
        /* Keep default rate */
      }
    } else if (trimmedParam.startsWith('audio/L')) {
      try {
        bitsPerSample = parseInt(trimmedParam.split('L')[1], 10);
      } catch (e) {
        /* Keep default bitsPerSample */
      }
    }
  }
  return {bitsPerSample, rate};
}

/**
 * Writes a string to a DataView at a specific offset.
 * @param view The DataView to write to.
 * @param offset The offset to start writing at.
 * @param str The string to write.
 */
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Generates a WAV file from raw audio data by adding the appropriate header.
 * @param audioData The raw audio data as a Uint8Array.
 * @param mimeType Mime type of the audio data.
 * @returns A Blob representing the WAV file.
 */
export function convertToWav(
  audioData: Uint8Array,
  mimeType: string,
): globalThis.Blob {
  const {bitsPerSample, rate} = parseAudioMimeType(mimeType);
  const numChannels = 1;
  const dataSize = audioData.length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = rate * blockAlign;
  const chunkSize = 36 + dataSize;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < dataSize; i++) {
    view.setUint8(44 + i, audioData[i]);
  }

  return new Blob([view], {type: 'audio/wav'});
}