/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createBlob as createAudioBlob, decode, decodeAudioData} from '../utils';

@customElement('gdm-live-audio-chat')
export class GdmLiveAudioChat extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() private selectedVoice = 'Kore';
  @state() private chatMode: 'voice' | 'text' = 'voice';
  @state() private terminalLog = '';

  private client: GoogleGenAI;
  private session: Session;
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

  private voices = [
    {name: 'Kore (Femminile, Italiano)', value: 'Kore'},
    {name: 'Puck (Maschile, Italiano)', value: 'Puck'},
    {name: 'Aoede (Female, English)', value: 'Aoede'},
    {name: 'Narratrice (Female, English)', value: 'Calypso'},
    {name: 'Interlocutore (Male, English)', value: 'Orus'},
    {name: 'Zephyr (Male, English)', value: 'Zephyr'},
  ];

  static styles = css`
    #status {
      position: absolute;
      bottom: 2vh;
      right: 2vw;
      z-index: 10;
      text-align: right;
      color: white;
      font-family: sans-serif;
      font-size: 12px;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 5vh;
      right: 2vw;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-direction: row;
      gap: 8px;

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      #startButton[disabled],
      #stopButton[disabled] {
        display: none;
      }
    }

    .selector {
      display: flex;
      gap: 4px;
      align-items: center;
      color: white;
      font-family: sans-serif;
      font-size: 12px;

      label {
        white-space: nowrap;
      }

      select {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      select:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    .terminal-container {
      position: absolute;
      top: 5vh;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 700px;
      height: 70vh;
      background: rgba(10, 10, 15, 0.85);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(10px);
      border: 1px solid #444;
      z-index: 5;
      font-family: 'Courier New', Courier, monospace;
      color: #0f0;
    }

    .terminal-log {
      flex-grow: 1;
      overflow-y: auto;
      padding: 15px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 14px;
    }

    .terminal-log::-webkit-scrollbar {
      width: 8px;
    }
    .terminal-log::-webkit-scrollbar-track {
      background: #222;
    }
    .terminal-log::-webkit-scrollbar-thumb {
      background: #555;
    }
    .terminal-log::-webkit-scrollbar-thumb:hover {
      background: #777;
    }

    .terminal-input {
      display: flex;
      padding: 5px 15px 10px 15px;
      border-top: 1px solid #444;
      align-items: center;
    }

    .terminal-input .prompt {
      font-size: 14px;
      white-space: nowrap;
      margin-right: 8px;
    }

    .terminal-input input {
      flex-grow: 1;
      background: transparent;
      border: none;
      color: #0f0;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      padding: 5px;
      outline: none;
      caret-color: #0f0;
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  connectedCallback() {
    super.connectedCallback();
    this.initAudio();
    this.initSession();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    try {
      // Clean up session
      if (this.session) {
        try {
          if (typeof this.session.close === 'function') {
            this.session.close();
          }
        } catch (error) {
          console.warn('Error closing session during cleanup:', error);
        }
        this.session = null;
      }
      
      // Clean up audio sources
      for (const source of this.sources.values()) {
        try {
          source.stop();
        } catch (error) {
          console.warn('Error stopping audio source during cleanup:', error);
        }
      }
      this.sources.clear();
      
      // Stop recording if active
      if (this.isRecording) {
        this.stopRecording();
      }
      
      console.log('Component cleanup completed');
    } catch (error) {
      console.error('Error during component cleanup:', error);
    }
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

    this.initSession();
  }

  private async playAudio(audioData: {data?: string; mimeType?: string}) {
    if (!audioData.data) {
      return;
    }
    this.nextStartTime = Math.max(
      this.nextStartTime,
      this.outputAudioContext.currentTime,
    );

    const audioBuffer = await decodeAudioData(
      decode(audioData.data),
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

  private async initSession() {
    try {
      const metadataResponse = await fetch('./metadata.json');
      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
      }
      
      const metadataText = await metadataResponse.text();
      if (!metadataText.trim()) {
        throw new Error('Empty metadata response');
      }
      
      let metadata;
      try {
        metadata = JSON.parse(metadataText);
      } catch (parseError) {
        throw new Error(`Invalid JSON in metadata: ${parseError.message}`);
      }
      
      const systemInstruction = metadata.prompt || 'You are a helpful AI assistant for a text adventure game.';
      if (!systemInstruction.trim()) {
        throw new Error('Empty system instruction in metadata');
      }

      const model = 'gemini-2.5-flash-preview-native-audio-dialog';
      
      let inputModalities: Modality[];
      let responseModalities: Modality[];

      const baseConfig: any = {
        systemInstruction: {parts: [{text: systemInstruction}]},
      };

      if (this.chatMode === 'voice') {
        baseConfig.speechConfig = {
          voiceConfig: {prebuiltVoiceConfig: {voiceName: this.selectedVoice}},
        };
        inputModalities = [Modality.AUDIO];
        responseModalities = [Modality.AUDIO];
      } else {
        inputModalities = [Modality.TEXT];
        responseModalities = [Modality.AUDIO, Modality.TEXT];
      }

      const sessionConfig = {
        ...baseConfig,
        inputModalities,
        responseModalities,
      };

      try {
        this.session = await this.client.live.connect({
          model: model,
          callbacks: {
            onopen: () => {
              this.updateStatus('Opened');
            },
            onmessage: async (message: LiveServerMessage) => {
              try {
                const modelTurn = message.serverContent?.modelTurn;
                if (modelTurn?.parts) {
                  for (const part of modelTurn.parts) {
                    if (part.text && this.chatMode === 'text') {
                      this.terminalLog += part.text;
                    }
                    if (part.inlineData) {
                      this.playAudio(part.inlineData);
                    }
                  }
                }

                const interrupted = message.serverContent?.interrupted;
                if (interrupted) {
                  for (const source of this.sources.values()) {
                    source.stop();
                    this.sources.delete(source);
                  }
                  this.nextStartTime = 0;
                }
              } catch (error) {
                console.error('Error processing message:', error);
                if (error.message.includes('ReadableStreamDefaultController')) {
                  console.warn('Stream controller error detected, attempting to reinitialize session');
                  this.updateError('Connection interrupted, attempting to reconnect...');
                  this.reset();
                  setTimeout(() => this.initSession(), 1000);
                } else {
                  this.updateError(`Message processing failed: ${error.message}`);
                }
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('Session error:', e);
              if (e.message && e.message.includes('ReadableStreamDefaultController')) {
                console.warn('Stream controller error in session, attempting recovery');
                this.updateError('Connection error detected, attempting to recover...');
                this.reset();
                setTimeout(() => this.initSession(), 2000);
              } else if (e.message && e.message.includes('INVALID_ARGUMENT')) {
                this.updateError('Invalid request parameters. Please check API configuration.');
              } else {
                this.updateError(e.message || 'Unknown session error');
              }
            },
            onclose: (e: CloseEvent) => {
              this.updateStatus('Close:' + e.reason);
            },
          },
          config: sessionConfig,
        });
      } catch (e) {
        console.error('Session initialization error:', e);
        this.updateError(`Session initialization failed: ${e.message}`);
        this.session = null;
      }
    } catch (metadataError) {
      console.error('Metadata loading error:', metadataError);
      this.updateError(`Failed to load configuration: ${metadataError.message}`);
      this.session = null;
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
    this.status = '';
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
        const pcmData = inputBuffer.getChannelData(0);
        if (this.session && typeof this.session.sendRealtimeInput === 'function') {
          try {
            this.session.sendRealtimeInput({media: createAudioBlob(pcmData)});
          } catch (error) {
            console.error('Error sending audio data:', error);
            this.updateError(`Audio transmission failed: ${error.message}`);
            this.stopRecording();
          }
        } else {
          console.error('Session not initialized or invalid');
          this.updateError('Audio session is not properly initialized');
          this.stopRecording();
        }
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording... Capturing PCM chunks.');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording) {
      return;
    }

    this.updateStatus('Stopping recording...');
    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.onaudioprocess = null;
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('Recording stopped. Click Start to begin again.');
  }

  private reset() {
    try {
      this.stopRecording();
      
      // Clean up session
      if (this.session) {
        try {
          if (typeof this.session.close === 'function') {
            this.session.close();
          }
        } catch (error) {
          console.warn('Error closing session:', error);
        }
        this.session = null;
      }
      
      // Clean up audio sources
      for (const source of this.sources.values()) {
        try {
          source.stop();
        } catch (error) {
          console.warn('Error stopping audio source:', error);
        }
      }
      this.sources.clear();
      
      // Reset state
      this.terminalLog = '';
      this.nextStartTime = 0;
      this.isRecording = false;
      
      this.initSession();
      this.updateStatus('Session cleared.');
      console.log('Session reset completed successfully');
    } catch (error) {
      console.error('Error during reset:', error);
      this.updateError(`Reset failed: ${error.message}`);
    }
  }

  private handleVoiceChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedVoice = select.value;
    if (!this.isRecording) {
      this.reset();
    }
  }

  private handleModeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.chatMode = select.value as 'voice' | 'text';
    this.terminalLog = '';
    if (this.isRecording) {
      this.stopRecording();
    }
    this.reset();
  }

  private handleSendMessage(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input');
    if (!input) return;
    const text = input.value.trim();
    if (text && this.session && typeof this.session.sendRealtimeInput === 'function') {
      try {
        this.terminalLog += `message > ${text}\n`;
        this.session.sendRealtimeInput({text});
        input.value = '';
      } catch (error) {
        console.error('Error sending text message:', error);
        this.updateError(`Message sending failed: ${error.message}`);
      }
    } else if (!this.session) {
      console.error('Session not initialized or invalid');
      this.updateError('Cannot send message: session not properly initialized');
    }
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('terminalLog') && this.chatMode === 'text') {
      const terminalEl = (this as any).shadowRoot?.querySelector('.terminal-log');
      if (terminalEl) {
        terminalEl.scrollTop = terminalEl.scrollHeight;
      }
    }
  }

  render() {
    return html`
      <div>
        ${this.chatMode === 'text'
          ? html`
              <div class="terminal-container">
                <pre class="terminal-log">${this.terminalLog}</pre>
                <form class="terminal-input" @submit=${this.handleSendMessage}>
                  <span class="prompt">message > </span>
                  <input
                    type="text"
                    autocomplete="off"
                    aria-label="Terminal message input" />
                </form>
              </div>
            `
          : ''}
        <div class="controls">
          <div class="selector">
            <label for="mode-select">Modalità:</label>
            <select
              id="mode-select"
              @change=${this.handleModeChange}
              .value=${this.chatMode}>
              <option value="voice">Conversazione</option>
              <option value="text">Chat di testo</option>
            </select>
          </div>
          <div class="selector">
            <label for="voice-select">Voce:</label>
            <select
              id="voice-select"
              @change=${this.handleVoiceChange}
              ?disabled=${this.isRecording}>
              ${this.voices.map(
                (voice) =>
                  html`<option
                    value=${voice.value}
                    ?selected=${this.selectedVoice === voice.value}>
                    ${voice.name}
                  </option>`,
              )}
            </select>
          </div>
          ${this.chatMode === 'voice'
            ? html`
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
              `
            : ''}
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
          </div>
          <div id="status"> ${this.status || this.error} </div>
        </div>
      `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio-chat': GdmLiveAudioChat;
  }
}
