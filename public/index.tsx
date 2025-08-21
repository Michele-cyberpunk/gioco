/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Chat, GoogleGenAI, Part} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {convertToWav, createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = 'Initializing...';
  @state() error = '';

  private client: GoogleGenAI;
  private chat: Chat;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();
  private inputAudioChunks: Float32Array[] = [];

  @state() private receivedAudioChunks: Uint8Array[] = [];
  @state() private lastMimeType = '';

  static styles = css`
    #status {
      position: absolute;
      bottom: 5vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 10vh;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        width: 64px;
        height: 64px;
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        &[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      #startButton[disabled],
      #stopButton[disabled] {
        display: none;
      }
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initChat();
  }

  private async initChat() {
    this.updateStatus('Initializing chat...');
    let systemInstruction = '';
    try {
      const response = await fetch('/metadata.json');
      const metadata = await response.json();
      systemInstruction = metadata.prompt;
    } catch (e) {
      console.error('Failed to load metadata.json', e);
      this.updateError('Could not load system prompt.');
      return;
    }

    const model = 'gemini-2.5-flash';

    try {
      this.chat = this.client.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      this.updateStatus('Ready');
    } catch (e) {
      console.error(e);
      this.updateError(e.message);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 256;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0).slice();
        this.inputAudioChunks.push(pcmData);
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording...');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording) return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioChunks.length > 0) {
      this.updateStatus('Processing audio...');
      const totalLength = this.inputAudioChunks.reduce(
        (acc, val) => acc + val.length,
        0,
      );
      const concatenatedData = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of this.inputAudioChunks) {
        concatenatedData.set(chunk, offset);
        offset += chunk.length;
      }
      this.inputAudioChunks = []; // Clear buffer
      this.sendAudio(concatenatedData);
    } else {
      this.updateStatus('No audio recorded. Click Start to begin again.');
    }
  }

  private async sendAudio(audioData: Float32Array) {
    this.updateStatus('Sending audio to Gemini...');
    try {
      const audioBlob = createBlob(audioData);
      const audioPart: Part = {
        inlineData: {
          data: audioBlob.data,
          mimeType: audioBlob.mimeType,
        },
      };

      const responseStream = await this.chat.sendMessageStream({
        message: [audioPart],
      });

      this.updateStatus('Receiving response...');
      this.receivedAudioChunks = [];
      this.lastMimeType = '';

      // Stop any currently playing audio from a previous turn.
      for (const source of this.sources.values()) {
        source.stop();
        this.sources.delete(source);
      }
      this.nextStartTime = 0;
      let firstChunk = true;

      for await (const chunk of responseStream) {
        if (firstChunk) {
          this.updateStatus('Playing response...');
          firstChunk = false;
        }

        const part = chunk.candidates?.[0]?.content?.parts?.[0];
        if (part && 'inlineData' in part) {
          const audio = part.inlineData;
          const audioDataBytes = decode(audio.data);
          this.receivedAudioChunks.push(audioDataBytes);
          this.lastMimeType = audio.mimeType;
          await this.playAudioChunk(audioDataBytes);
        }
      }
      this.updateStatus('Ready. Click Start to speak again.');
    } catch (e) {
      console.error(e);
      this.updateError(e.message);
      this.updateStatus('Error. Please try again.');
    }
  }

  private async playAudioChunk(audioDataBytes: Uint8Array) {
    this.nextStartTime = Math.max(
      this.nextStartTime,
      this.outputAudioContext.currentTime,
    );

    const audioBuffer = await decodeAudioData(
      audioDataBytes,
      this.outputAudioContext,
      24000,
      1,
    );
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });

    source.start(this.nextStartTime);
    this.nextStartTime = this.nextStartTime + audioBuffer.duration;
    this.sources.add(source);
  }

  private reset() {
    // Stop any playing audio
    for (const source of this.sources.values()) {
      source.stop();
      this.sources.delete(source);
    }
    this.nextStartTime = 0;

    // Stop recording without sending audio
    if (this.isRecording) {
      this.isRecording = false; // Prevent onaudioprocess from adding more chunks
      if (this.scriptProcessorNode && this.sourceNode) {
        this.scriptProcessorNode.disconnect();
        this.sourceNode.disconnect();
      }
      this.scriptProcessorNode = null;
      this.sourceNode = null;
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
    }

    this.inputAudioChunks = []; // discard buffered audio
    this.initChat();
    this.updateStatus('Session cleared.');
    this.receivedAudioChunks = [];
    this.lastMimeType = '';
  }

  private downloadAudio() {
    if (this.receivedAudioChunks.length === 0) {
      return;
    }

    const totalLength = this.receivedAudioChunks.reduce(
      (acc, value) => acc + value.length,
      0,
    );
    const concatenatedData = new Uint8Array(totalLength);

    let offset = 0;
    for (const chunk of this.receivedAudioChunks) {
      concatenatedData.set(chunk, offset);
      offset += chunk.length;
    }

    const blob = convertToWav(concatenatedData, this.lastMimeType);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'gemini-response.wav';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  render() {
    return html`
      <div>
        <div class="controls">
          <button
            id="resetButton"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#ffffff">
              <path
                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="downloadButton"
            @click=${this.downloadAudio}
            ?disabled=${this.receivedAudioChunks.length === 0}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#ffffff">
              <path
                d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
            </svg>
          </button>
          <button
            id="startButton"
            @click=${this.startRecording}
            ?disabled=${this.isRecording}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#c80000"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" />
            </svg>
          </button>
          <button
            id="stopButton"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#000000"
              xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" rx="15" />
            </svg>
          </button>
        </div>

        <div id="status"> ${this.error || this.status} </div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}