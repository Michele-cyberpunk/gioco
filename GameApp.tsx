import React, { useState, useCallback } from 'react';
import { StartScreen } from './public/components/StartScreen';
import { CharacterSelectionScreen } from './public/components/CharacterSelectionScreen';
import { GameScreen } from './public/components/GameScreen';
import { LoadingScreen } from './public/components/LoadingScreen';
import { VideoCutscene } from './public/components/VideoCutscene';
import { Scene, Character } from './types';
import { 
    startNewStory, 
    initializeCharacters, 
    generateStory, 
    assembleVideoPrompt,
    assembleImagePrompt,
    generateImage, 
    generateVideo 
} from './utils/gemini';
import { DNDGameManager } from './utils/dnd-integration';
import { GeminiDNDBridge } from './utils/gemini-dnd-bridge';
import { generateSpeech } from './utils/tts';

type GameState = 'start' | 'character-creation' | 'playing' | 'loading';
type Language = 'it' | 'en';

export const GameApp: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('start');
    const [textLanguage, setTextLanguage] = useState<Language>('it');
    const [voiceLanguage, setVoiceLanguage] = useState<Language>('it');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [characterVisuals, setCharacterVisuals] = useState<string[]>([]);
    const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
    
    const [storyHistory, setStoryHistory] = useState<{ it: string; en: string; }[]>([]);
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [showCutscene, setShowCutscene] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [chapter, setChapter] = useState(1);
    const [sceneInChapter, setSceneInChapter] = useState(1);
    
    // D&D System Integration
    const [geminiDndBridge, setGeminiDndBridge] = useState<GeminiDNDBridge | null>(null);

    const handleStartGame = (languages: { textLanguage: Language, voiceLanguage: Language }) => {
        setTextLanguage(languages.textLanguage);
        setVoiceLanguage(languages.voiceLanguage);
        setGameState('character-creation');
    };

    const handleCharacterCreationComplete = async (createdCharacters: Character[], operatorObjective: string) => {
        setLoadingMessage('Forging your heroes...');
        setGameState('loading');
        setCharacters(createdCharacters);
        startNewStory();
        setChapter(1);
        setSceneInChapter(1);
        setActiveCharacterIndex(0);

        const visuals = await initializeCharacters(createdCharacters);
        setCharacterVisuals(visuals);
        
        // Initialize D&D system with characters
        const bridge = new GeminiDNDBridge(createdCharacters);
        setGeminiDndBridge(bridge);
        console.log('🎲 D&D system initialized with characters:', createdCharacters.map(c => c.name));

        setLoadingMessage('Weaving the threads of fate...');
        
        const scene = await generateStory(createdCharacters, visuals, operatorObjective, textLanguage, undefined, 1, 1, 0);
        setCurrentScene(scene);
        setStoryHistory([scene.story]);
        
        setLoadingMessage('Crafting the cinematic...');

        const videoPrompt = assembleVideoPrompt(scene.videoPromptData);
        const imagePrompt = assembleImagePrompt(scene);

        const [image, videoUrl] = await Promise.all([
            generateImage(imagePrompt),
            generateVideo(videoPrompt)
        ]);

        setCurrentImage(image);
        setCurrentVideoUrl(videoUrl);

        if (videoUrl) {
            setShowCutscene(true);
        } else {
            setGameState('playing');
        }
    };

    const handleAction = async (action: string, roll: number) => {
        setLoadingMessage('The dice are cast...');
        setGameState('loading');
        setCurrentImage(null);
        setCurrentVideoUrl(null);
        
        // D&D Combat Integration
        const currentCharacter = characters[activeCharacterIndex];
        
        // Execute D&D mechanics 
        let combatResults = null;
        if (geminiDndBridge) {
            try {
                console.log(`🎲 Processing D&D action for ${currentCharacter.name}: ${action} (roll: ${roll})`);
                
                combatResults = await geminiDndBridge.processAction(currentCharacter.name, action, roll);
                console.log('⚔️ Combat results:', combatResults);
                
                // Update character stats based on D&D results
                if (combatResults.characterUpdates) {
                    setCharacters(prev => {
                        const updated = [...prev];
                        combatResults.characterUpdates.forEach((update: any) => {
                            const charIndex = updated.findIndex(c => c.name === update.characterName);
                            if (charIndex !== -1) {
                                updated[charIndex] = { ...updated[charIndex], ...update.stats };
                            }
                        });
                        return updated;
                    });
                }
            } catch (error) {
                console.error('❌ D&D system error:', error);
            }
        }
        
        const isEndOfChapter = sceneInChapter === 5;

        let nextScene = sceneInChapter + 1;
        let nextChapter = chapter;
        if (nextScene > 5) {
            nextScene = 1;
            nextChapter += 1;
        }

        // CORREZIONE: Cambia il personaggio attivo PRIMA di generare la storia
        const nextActiveCharacterIndex = (activeCharacterIndex + 1) % characters.length;
        setActiveCharacterIndex(nextActiveCharacterIndex);
        
        const operatorObjective = ""; // Not needed for subsequent turns
        
        // Enhanced story generation with D&D context
        const actionContext = {
            action,
            roll,
            combatResults: combatResults?.narrative || null,
            mechanicalEffects: combatResults?.mechanicalEffects || null
        };
        
        const scene = await generateStory(characters, characterVisuals, operatorObjective, textLanguage, actionContext, nextChapter, nextScene, nextActiveCharacterIndex);
        
        if (scene.updatedVisuals && scene.updatedVisuals.length > 0) {
            const newVisuals = [...characterVisuals];
            scene.updatedVisuals.forEach(update => {
                const charIndex = characters.findIndex(c => c.name === update.characterName);
                if (charIndex !== -1) {
                    console.log(`Updating visual for ${update.characterName}: ${update.newVisualDescription.substring(0, 50)}...`);
                    newVisuals[charIndex] = update.newVisualDescription;
                }
            });
            setCharacterVisuals(newVisuals);
        }

        setChapter(nextChapter);
        setSceneInChapter(nextScene);
        setCurrentScene(scene);
        setStoryHistory(prev => [...prev, scene.story]);

        setLoadingMessage(isEndOfChapter ? 'Crafting the chapter cinematic...' : 'Painting the scene...');
        
        const imagePrompt = assembleImagePrompt(scene);

        const imagePromise = generateImage(imagePrompt);
        const videoPromise = isEndOfChapter
            ? generateVideo(assembleVideoPrompt(scene.videoPromptData))
            : Promise.resolve(null);

        const [image, videoUrl] = await Promise.all([imagePromise, videoPromise]);

        setCurrentImage(image);
        setCurrentVideoUrl(videoUrl);
        
        if (videoUrl) {
            setShowCutscene(true);
        } else {
            setGameState('playing');
        }
    };
    
    const handleRestart = () => {
        setGameState('start');
        setCharacters([]);
        setCharacterVisuals([]);
        setStoryHistory([]);
        setCurrentScene(null);
        setCurrentImage(null);
        setCurrentVideoUrl(null);
        setShowCutscene(false);
        setChapter(1);
        setSceneInChapter(1);
        setActiveCharacterIndex(0);
        
        // Reset D&D system
        setGeminiDndBridge(null);
        console.log('🎲 D&D system reset');
    };

    const handleGenerateSpeech = useCallback(async (text: string): Promise<string | null> => {
        try {
            return await generateSpeech(text, voiceLanguage);
        } catch (error) {
            console.error("Speech generation failed in GameApp:", error);
            return null;
        }
    }, [voiceLanguage]);


    const renderContent = () => {
        const showGameScreen = gameState === 'playing' || (gameState === 'loading' && currentScene);
        return (
            <>
                {gameState === 'start' && <StartScreen onStartGame={handleStartGame} />}
                {gameState === 'character-creation' && <CharacterSelectionScreen onStartGame={handleCharacterCreationComplete} />}
                {showGameScreen && characters.length > 0 && (
                    <GameScreen 
                        storyHistory={storyHistory} 
                        currentImage={currentImage} 
                        currentScene={currentScene} 
                        characterStatus={currentScene?.characterStatus ?? null} 
                        onAction={handleAction} 
                        onRestart={handleRestart}
                        onGenerateSpeech={handleGenerateSpeech}
                        chapter={chapter}
                        sceneInChapter={sceneInChapter}
                        activeCharacter={characters[activeCharacterIndex]}
                        textLanguage={textLanguage}
                        voiceLanguage={voiceLanguage}
                    />
                )}
                {gameState === 'loading' && <LoadingScreen message={loadingMessage} />}
                {showCutscene && currentVideoUrl && (
                    <VideoCutscene 
                        url={currentVideoUrl} 
                        onEnd={() => {
                            setShowCutscene(false);
                            setGameState('playing');
                        }} 
                    />
                )}
            </>
        );
    };

    return (
        <main>
            {renderContent()}
        </main>
    );
};
