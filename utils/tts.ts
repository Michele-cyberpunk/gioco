import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY;

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Parses bits per sample and rate from an audio MIME type string.
 * @param mimeType The audio MIME type string (e.g., "audio/L16;rate=24000").
 * @returns An object with "bitsPerSample" and "rate".
 */
function parseAudioMimeType(mimeType: string): { bitsPerSample: number; rate: number } {
    let bitsPerSample = 16;
    let rate = 24000;

    const parts = mimeType.split(';');
    for (const param of parts) {
        const trimmedParam = param.trim();
        if (trimmedParam.toLowerCase().startsWith('rate=')) {
            try {
                const rateStr = trimmedParam.split('=')[1];
                rate = parseInt(rateStr, 10);
            } catch (e) { /* Keep default rate */ }
        } else if (trimmedParam.startsWith('audio/L')) {
            try {
                bitsPerSample = parseInt(trimmedParam.split('L')[1], 10);
            } catch (e) { /* Keep default bitsPerSample */ }
        }
    }
    return { bitsPerSample, rate };
}

/**
 * Generates a WAV file from raw audio data by adding the appropriate header.
 * @param audioData The raw audio data as a Uint8Array.
 * @param mimeType Mime type of the audio data.
 * @returns A Blob representing the WAV file.
 */
function convertToWav(audioData: Uint8Array, mimeType: string): Blob {
    const { bitsPerSample, rate } = parseAudioMimeType(mimeType);
    const numChannels = 1;
    const dataSize = audioData.length;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = rate * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(view: DataView, offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // true for little-endian
    writeString(view, 8, 'WAVE');
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    // Write audio data
    audioData.forEach((byte, i) => view.setUint8(44 + i, byte));

    return new Blob([view], { type: 'audio/wav' });
}


export const generateSpeech = async (text: string, language: 'it' | 'en'): Promise<string | null> => {
    if (!API_KEY) {
        console.error("API_KEY is not set");
        return null;
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const ttsModel = 'gemini-2.5-flash-preview-tts';
    const voiceName = language === 'it' ? 'Kore' : 'Aoede';
    
    try {
        console.log(`Attempting TTS with model: ${ttsModel}`);

        const config: any = {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
            },
        };

        const response = await ai.models.generateContent({
            model: ttsModel,
            contents: text,
            config,
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];

        if (part && 'inlineData' in part && part.inlineData) {
            const audioData = decode(part.inlineData.data);
            const mimeType = part.inlineData.mimeType;
            
            console.log(`Successfully generated speech with model: ${ttsModel}`);

            let blob: Blob;
            if (mimeType && mimeType.startsWith('audio/L')) {
                blob = convertToWav(audioData, mimeType);
            } else {
                blob = new Blob([audioData], { type: mimeType || 'audio/webm' });
            }
            
            return URL.createObjectURL(blob);
        } else {
            throw new Error("TTS response did not contain audio data.");
        }

    } catch (error) {
        console.error(`TTS model ${ttsModel} failed. Error:`, error);
        throw error;
    }
};
