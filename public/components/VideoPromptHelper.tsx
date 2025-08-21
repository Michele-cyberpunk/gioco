import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { generateStructuredVideoPrompt } from '../../utils/gemini';
import { VideoPromptData, Character } from '../../types';
import { LoadingScreen } from './LoadingScreen';

const formLabelStyle = "block text-sm font-bold text-yellow-400 mb-2";
const formInputStyle = "w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow duration-200 placeholder-gray-500 text-sm";
const formSelectStyle = formInputStyle + " appearance-none";

const initialInputs: Omit<VideoPromptData, 'character'> & { freeCharacter: string, selectedCharacter: string } = {
    freeCharacter: '',
    selectedCharacter: '',
    position: '',
    vehicle_device: '',
    action: '',
    environment: '',
    camera: '',
    lighting: '',
    mood: '',
    special_fx: '',
    transition: '',
};

export const VideoPromptHelper: React.FC = () => {
    const [inputs, setInputs] = useState(initialInputs);
    const [existingCharacters, setExistingCharacters] = useState<Character[]>([]);
    const [structuredPrompt, setStructuredPrompt] = useState<VideoPromptData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const characters = (globalThis as any).gameCharacters as Character[] | undefined;
        if (characters) {
            setExistingCharacters(characters);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = useMemo(() => {
        return inputs.action.trim() !== '' && inputs.environment.trim() !== '' && (inputs.freeCharacter.trim() !== '' || inputs.selectedCharacter !== '');
    }, [inputs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsGenerating(true);
        setError(null);
        setStructuredPrompt(null);
        setCopySuccess(false);

        try {
            const geminiInputs = {
                ...inputs,
                character: inputs.freeCharacter,
            };
            const result = await generateStructuredVideoPrompt(geminiInputs);
            setStructuredPrompt(result);
        } catch (err) {
            console.error("Error generating structured prompt:", err);
            setError("Failed to generate the prompt. Please check the console and try again.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const formattedPrompt = useMemo(() => {
        if (!structuredPrompt) return '';
        return Object.entries(structuredPrompt)
            .map(([key, value]) => `${key.replace(/_/g, '-')}: ${value}`)
            .join('\n');
    }, [structuredPrompt]);

    const handleCopyToClipboard = useCallback(() => {
        if (!formattedPrompt) return;
        navigator.clipboard.writeText(formattedPrompt).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    }, [formattedPrompt]);

    return (
        <>
            {isGenerating && <LoadingScreen message="Structuring your cinematic prompt..." />}
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 md:p-8 animate-fade-in">
                <div className="w-full max-w-7xl">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-400 text-transparent bg-clip-text text-shadow">
                            AI Video Prompt Helper
                        </h1>
                        <p className="text-gray-400 mt-2">Describe your scene using the fields below to generate a structured prompt for the AI.</p>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div className="md:col-span-2">
                                    <label htmlFor="selectedCharacter" className={formLabelStyle}>Use Consistent Character (Optional)</label>
                                    <select id="selectedCharacter" name="selectedCharacter" value={inputs.selectedCharacter} onChange={handleInputChange} className={formSelectStyle}>
                                        <option value="">-- Describe a new character below --</option>
                                        {existingCharacters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="freeCharacter" className={formLabelStyle}>Character Description</label>
                                    <textarea id="freeCharacter" name="freeCharacter" rows={3} className={formInputStyle} value={inputs.freeCharacter} onChange={handleInputChange} placeholder="Describe the character if not selected above..." disabled={!!inputs.selectedCharacter} required={!inputs.selectedCharacter} />
                                </div>
                                
                                <div className="md:col-span-2"><label htmlFor="action" className={formLabelStyle}>Action</label><textarea id="action" name="action" rows={2} className={formInputStyle} value={inputs.action} onChange={handleInputChange} placeholder="e.g., Drawing a glowing sword" required /></div>
                                <div className="md:col-span-2"><label htmlFor="environment" className={formLabelStyle}>Environment</label><textarea id="environment" name="environment" rows={2} className={formInputStyle} value={inputs.environment} onChange={handleInputChange} placeholder="e.g., A misty forest at dusk" required /></div>
                                
                                <div><label htmlFor="position" className={formLabelStyle}>Position</label><input id="position" name="position" type="text" className={formInputStyle} value={inputs.position} onChange={handleInputChange} placeholder="e.g., Kneeling" /></div>
                                <div><label htmlFor="camera" className={formLabelStyle}>Camera</label><input id="camera" name="camera" type="text" className={formInputStyle} value={inputs.camera} onChange={handleInputChange} placeholder="e.g., Low-angle close-up" /></div>
                                <div><label htmlFor="lighting" className={formLabelStyle}>Lighting</label><input id="lighting" name="lighting" type="text" className={formInputStyle} value={inputs.lighting} onChange={handleInputChange} placeholder="e.g., Backlit by a full moon" /></div>
                                <div><label htmlFor="mood" className={formLabelStyle}>Mood</label><input id="mood" name="mood" type="text" className={formInputStyle} value={inputs.mood} onChange={handleInputChange} placeholder="e.g., Tense, mysterious" /></div>
                                <div><label htmlFor="vehicle_device" className={formLabelStyle}>Vehicle / Device</label><input id="vehicle_device" name="vehicle_device" type="text" className={formInputStyle} value={inputs.vehicle_device} onChange={handleInputChange} placeholder="e.g., Holding a magical orb" /></div>
                                <div><label htmlFor="special_fx" className={formLabelStyle}>Special FX</label><input id="special_fx" name="special_fx" type="text" className={formInputStyle} value={inputs.special_fx} onChange={handleInputChange} placeholder="e.g., Floating magical particles" /></div>
                                <div className="md:col-span-2"><label htmlFor="transition" className={formLabelStyle}>Transition</label><input id="transition" name="transition" type="text" className={formInputStyle} value={inputs.transition} onChange={handleInputChange} placeholder="e.g., Fade to black" /></div>
                            </div>

                            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 flex flex-col">
                                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Generated AI Prompt</h2>
                                <div className="flex-1 bg-gray-900 rounded p-4 h-96 relative">
                                    <pre className="whitespace-pre-wrap text-gray-200 h-full overflow-y-auto pr-2 text-sm">
                                        {formattedPrompt || "Your structured prompt will appear here..."}
                                    </pre>
                                    {structuredPrompt && (
                                         <button type="button" onClick={handleCopyToClipboard} className="absolute top-3 right-3 px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-bold transition-colors duration-200 hover:bg-yellow-700">
                                            {copySuccess ? 'Copied!' : 'Copy'}
                                         </button>
                                    )}
                                </div>
                                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <button
                                type="submit"
                                disabled={!isFormValid || isGenerating}
                                className="px-12 py-4 rounded-lg bg-yellow-600 text-white font-bold text-xl transition-all duration-200 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:enabled:bg-yellow-700 hover:enabled:shadow-xl transform hover:enabled:scale-105 active:enabled:scale-95 active:enabled:bg-yellow-800"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Prompt'}
                            </button>
                            {!isFormValid && !isGenerating && <p className="text-xs text-red-400 mt-2">Please fill out Action, Environment, and Character to generate a prompt.</p>}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
