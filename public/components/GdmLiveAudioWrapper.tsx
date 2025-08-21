import React, { useEffect, useRef } from 'react';
import { GdmLiveAudioChat } from './GdmLiveAudio'; // Import the Lit component

export const GdmLiveAudioWrapper: React.FC = () => {
  const ref = useRef<GdmLiveAudioChat>(null);

  useEffect(() => {
    // The import of GdmLiveAudio should register the element automatically.
    // We can add a check for debugging purposes.
    if (!customElements.get('gdm-live-audio-chat')) {
      console.warn('gdm-live-audio-chat custom element might not be registered yet.');
    }
  }, []);

  return (
    <div className="audio-wrapper">
      <gdm-live-audio-chat ref={ref}></gdm-live-audio-chat>
    </div>
  );
};
