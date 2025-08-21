/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useRef, useEffect, useState} from 'react';
import {Scene, Character, CharacterStatus as CharacterStatusType} from '../../types';
import { D20 } from './D20';
import { CharacterStatusDisplay } from './CharacterStatus';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from './icons';

type Language = 'it' | 'en';

interface GameScreenProps {
  storyHistory: { it: string; en: string }[];
  currentImage: string | null;
  currentScene: Scene | null;
  characterStatus: CharacterStatusType[] | null;
  onAction: (action: string, roll: number) => void;
  onRestart: () => void;
  onGenerateSpeech: (text: string) => Promise<string | null>;
  chapter: number;
  sceneInChapter: number;
  activeCharacter: Character;
  textLanguage: Language;
  voiceLanguage: Language;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  storyHistory,
  currentImage,
  currentScene,
  characterStatus,
  onAction,
  onRestart,
  onGenerateSpeech,
  chapter,
  sceneInChapter,
  activeCharacter,
  textLanguage,
  voiceLanguage,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  useEffect(() => {
    const latestStory = storyHistory[storyHistory.length - 1];
    if (latestStory && !isMuted) {
      playAudio(latestStory[voiceLanguage]);
    }
  }, [storyHistory, isMuted, voiceLanguage]);
  
  useEffect(() => {
    if (storyContainerRef.current) {
        storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
    }
  }, [storyHistory]);

  // When a new scene loads, reset the action state
  useEffect(() => {
    setSelectedAction(null);
    setIsRolling(false);
    setDiceResult(null);
  }, [currentScene]);

  const playAudio = async (text: string) => {
    setIsAudioLoading(true);
    try {
      const audioUrl = await onGenerateSpeech(text);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    } catch (error) {
      console.error("Failed to generate or play speech:", error);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleRoll = () => {
    if (!selectedAction || isRolling || diceResult !== null) return;

    setIsRolling(true);
    setDiceResult(null);

    const roll = Math.floor(Math.random() * 20) + 1;

    // Roll animation duration
    setTimeout(() => {
      setIsRolling(false);
      setDiceResult(roll);
      
      // Wait a moment for the user to see the result before continuing
      setTimeout(() => {
        onAction(selectedAction, roll);
      }, 1500);

    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
        const newMutedState = !prev;
        if (audioRef.current) {
            audioRef.current.muted = newMutedState;
            if (newMutedState) {
                audioRef.current.pause();
            }
        }
        return newMutedState;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 md:p-8">
      <audio ref={audioRef} hidden onEnded={() => {
        if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
      }} />
      <header className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-400 text-transparent bg-clip-text text-shadow">
          Gemini's Grimoire
        </h1>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full items-start">
        {/* Image and Actions Column */}
        <div className="flex flex-col gap-4">
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700">
            {currentImage ? (
              <img
                key={currentImage}
                src={currentImage}
                alt={currentScene?.videoPromptData.action || 'A scene from the adventure.'}
                className="w-full h-full object-cover animate-fade-in"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-800">
                <p className="text-gray-500">Painting the scene...</p>
              </div>
            )}
          </div>
          <CharacterStatusDisplay status={characterStatus} />
          <div className="parchment p-4 rounded-lg flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">Actions for {activeCharacter.name}</h2>
            {currentScene?.gameOver ? (
              <div className="text-center">
                 <p className="mb-4">The adventure has ended.</p>
                 <button onClick={onRestart} className="btn-action">
                    Play Again
                 </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {!selectedAction ? (
                  <>
                    <p className="text-center mb-2">What do you do?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {(currentScene?.actions || []).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedAction(action)}
                          className="btn-action"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 animate-fade-in w-full">
                     <p className="text-center italic">Action: "{selectedAction}"</p>
                     <D20 rolling={isRolling} result={diceResult} />
                     <button
                       onClick={handleRoll}
                       disabled={isRolling || diceResult !== null}
                       className="btn-action w-48"
                     >
                       {isRolling ? 'Rolling...' : (diceResult ? `You rolled a ${diceResult}!` : 'Roll for it!')}
                     </button>
                     <button
                       onClick={() => setSelectedAction(null)}
                       disabled={isRolling || diceResult !== null}
                       className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
                     >
                       (Choose a different action)
                     </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Story Column */}
        <div className="parchment p-6 rounded-lg flex flex-col h-[80vh] lg:h-auto">
          <div className="w-full flex justify-between items-center mb-4 border-b-2 border-gray-400 pb-2">
            <div>
              <h2 className="text-2xl font-bold">Your Story</h2>
              <p className="text-sm text-gray-500 italic">Chapter {chapter} - Part {sceneInChapter} of 5</p>
            </div>
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <SpeakerXMarkIcon className="w-6 h-6" /> : <SpeakerWaveIcon className="w-6 h-6" />}
            </button>
          </div>
          <div ref={storyContainerRef} className="flex-1 w-full overflow-y-auto pr-2 space-y-4">
            {storyHistory.length === 0 ? (
                <p className="italic text-gray-500 animate-fade-in">The bard clears his throat, ready to weave a new tale...</p>
            ) : (
                storyHistory.map((paragraph, index) => (
                    <p key={index} className="animate-fade-in leading-relaxed">
                        {paragraph[textLanguage]}
                    </p>
                ))
            )}
          </div>
          {isAudioLoading && (
            <div className="text-center pt-2">
              <p className="text-sm text-yellow-500 mt-2 animate-pulse">The bard is clearing his throat...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};