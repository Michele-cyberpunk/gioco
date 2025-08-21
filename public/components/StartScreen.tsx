/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

type Language = 'it' | 'en';

interface StartScreenProps {
  onStartGame: (languages: { textLanguage: Language, voiceLanguage: Language }) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const [textLanguage, setTextLanguage] = useState<Language>('it');
  const [voiceLanguage, setVoiceLanguage] = useState<Language>('it');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({ textLanguage, voiceLanguage });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-400 text-transparent bg-clip-text text-shadow mb-4">
          Gemini's Grimoire
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          An AI-powered Dungeons & Dragons adventure. Your fate is unwritten. The story is yours to command.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
           <div className="flex flex-col sm:flex-row gap-8 mb-8">
              <div className="w-48">
                <label htmlFor="text-language-select" className="block text-lg text-gray-300 mb-2">Text Language</label>
                <select 
                  id="text-language-select" 
                  value={textLanguage}
                  onChange={(e) => setTextLanguage(e.target.value as Language)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-lg text-gray-200 focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="w-48">
                <label htmlFor="voice-language-select" className="block text-lg text-gray-300 mb-2">Voice Language</label>
                <select 
                  id="voice-language-select" 
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value as Language)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-lg text-gray-200 focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                </select>
              </div>
           </div>
          <button
            type="submit"
            className="px-8 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 active:bg-yellow-800"
          >
            Begin Your Adventure
          </button>
        </form>
      </div>
    </div>
  );
};
