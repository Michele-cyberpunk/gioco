/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface VideoCutsceneProps {
  url: string;
  onEnd: () => void;
}

export const VideoCutscene: React.FC<VideoCutsceneProps> = ({ url, onEnd }) => {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="aspect-w-16 aspect-h-9 bg-black rounded-t-md overflow-hidden">
          <video
            key={url}
            className="w-full h-full"
            src={url}
            controls
            autoPlay
            loop
            aria-label="Cinematic cutscene"
          />
        </div>
        <div className="p-4 text-center">
            <button
              onClick={onEnd}
              className="px-8 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
                Continue Adventure
            </button>
        </div>
      </div>
    </div>
  );
};
