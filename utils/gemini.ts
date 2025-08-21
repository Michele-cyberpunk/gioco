import { GoogleGenAI, Type, GenerateVideosParameters } from '@google/genai';
import { Character, Scene, VideoPromptData, Item } from '../types';

// --- INITIALIZATION ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set in the environment.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

let storyHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

// --- MODEL LISTS FOR FALLBACK ---
const storyModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-preview', 'gemini-live-2.5-flash-preview'];
const imageModels = ['imagen-3.0-generate-002'];
const videoModels = ['veo-2.0-generate-001'];

// --- GLOBAL CHARACTER STORAGE ---
// This allows us to maintain character visual consistency across different function calls.
declare global {
    var gameCharacters: Character[] | undefined;
    var gameCharacterVisuals: string[] | undefined;
}

// --- HELPER FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function tryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    initialDelay = 100,
): Promise<T> {
    let attempt = 1;
    let currentDelay = initialDelay;
    while (attempt <= maxRetries) {
        try {
            return await fn();
        } catch (error: any) {
            const isRateLimitError = error.toString().includes('429') || (error.error && error.error.status === 'RESOURCE_EXHAUSTED');
            if (isRateLimitError && attempt < maxRetries) {
                console.warn(`Rate limit exceeded. Retrying in ${currentDelay}ms... (Attempt ${attempt}/${maxRetries})`);
                await delay(currentDelay);
                currentDelay *= 2; // Exponential backoff
                attempt++;
            } else {
                console.error(`Action failed after ${attempt} attempts or due to a non-retriable error.`, JSON.stringify(error));
                throw error;
            }
        }
    }
    throw new Error(`Action failed after ${maxRetries} attempts.`);
}

async function tryModels<T>(
    models: string[],
    action: (model: string) => Promise<T>,
    options: { logLevel?: 'warn' | 'error', initialDelay?: number, maxRetries?: number } = {}
): Promise<T | null> {
    const { logLevel = 'error', initialDelay = 0, maxRetries = 1 } = options;
    let lastError: any = null;
    for (const model of models) {
        try {
            console.log(`Attempting generation with model: ${model}`);
            const result = await tryWithBackoff(() => action(model), maxRetries, initialDelay);
            console.log(`Successfully generated with model: ${model}`);
            return result;
        } catch (error) {
            lastError = error;
            const logMessage = `Model ${model} failed after retries. Trying next model. Error:`;
            if (logLevel === 'error') {
                console.error(logMessage, JSON.stringify(error));
            } else {
                console.warn(logMessage, JSON.stringify(error));
            }
        }
    }
    console.error(`All models failed. Last error:`, JSON.stringify(lastError));
    return null;
}

// --- CORE API FUNCTIONS ---

export const startNewStory = () => {
    storyHistory = [];
    // Also clear global characters on new story
    (globalThis as any).gameCharacters = undefined;
    (globalThis as any).gameCharacterVisuals = undefined;
};

export const initializeCharacters = async (characters: Character[]): Promise<string[]> => {
    console.log('🎭 Loading character visuals for consistency...');
    const visuals = await generateCharacterVisuals(characters);
    
    // Store globally for use in other functions like generateStructuredVideoPrompt
    (globalThis as any).gameCharacters = characters;
    (globalThis as any).gameCharacterVisuals = visuals;
    
    console.log('✅ Character visuals loaded:', visuals.map((v, i) => `${characters[i].name}: ${v.slice(0, 50)}...`));
    return visuals;
};

export const generateCharacterVisuals = async (characters: Character[]): Promise<string[]> => {
    const visualPromises = characters.map(char => {
        const prompt = `Generate a highly detailed, aesthetically pleasing, and practical visual description of a fantasy character for an AI image generator. The description must be strongly coherent with the character's class (e.g., a Fighter's armor should look functional, a Wizard's robes should seem mystical but allow for movement). Do not describe the background. Be specific about their appearance, clothing, gear, and distinguishing features.
        - Name: ${char.name}
        - Gender: ${char.gender}
        - Race: ${char.race}
        - Class: ${char.klass}
        - Alignment: ${char.alignment}
        Focus on creating a unique and memorable character portrait.`;

        return tryModels(storyModels, async (model) => {
            const response = await ai.models.generateContent({ model, contents: prompt });
            return response.text;
        });
    });

    const visuals = await Promise.all(visualPromises);
    return visuals.map(v => v || "A generic adventurer");
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['weapon', 'armor', 'tool', 'consumable', 'wondrous', 'quest', 'currency', 'misc'] },
        rarity: { type: Type.STRING, enum: ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'] },
        properties: { type: Type.ARRAY, items: { type: Type.STRING } },
        weight: { type: Type.NUMBER },
        value: { type: Type.NUMBER },
        description: { type: Type.STRING },
        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
        effects: { type: Type.STRING },
        uses: {
            type: Type.OBJECT,
            properties: {
                max: { type: Type.INTEGER },
                current: { type: Type.INTEGER },
                recharge: { type: Type.STRING, enum: ['short_rest', 'long_rest', 'dawn', 'none'] }
            },
        },
        location_state: { type: Type.STRING },
        discovery_requirements: { type: Type.STRING },
        acquisition_method: { type: Type.STRING, enum: ['loot', 'purchase', 'quest', 'craft', 'gift', 'theft', 'search'] },
        provenance: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['id', 'name', 'type', 'rarity', 'properties', 'weight', 'value', 'description', 'prerequisites', 'effects', 'location_state', 'discovery_requirements', 'acquisition_method', 'provenance', 'tags']
};

const sceneSchema = {
    type: Type.OBJECT,
    properties: {
        story: { 
            type: Type.OBJECT,
            description: "The story paragraph in both Italian and English. The content must be identical in meaning and tone.",
            properties: {
                it: { type: Type.STRING, description: "The story paragraph, written in beautiful, evocative Italian." },
                en: { type: Type.STRING, description: "The story paragraph, written in beautiful, evocative English." }
            },
            required: ['it', 'en']
        },
        activeCharacterName: { type: Type.STRING, description: 'The name of the character who has just taken their turn.' },
        updatedVisuals: {
            type: Type.ARRAY,
            description: "An array of objects for ANY character whose visual description has changed this turn (e.g., new item, injury). If no visuals changed, return an empty array.",
            items: {
                type: Type.OBJECT,
                properties: {
                    characterName: { type: Type.STRING },
                    newVisualDescription: { type: Type.STRING, description: "The character's NEW, COMPLETE visual description including the change." }
                },
                required: ['characterName', 'newVisualDescription']
            }
        },
        videoPromptData: {
            type: Type.OBJECT,
            properties: {
                character: { type: Type.STRING, description: 'The main character(s) in the scene, including their detailed, most up-to-date visual description.' },
                position: { type: Type.STRING, description: 'Their position (e.g., standing, sitting, running).' },
                vehicle_device: { type: Type.STRING, description: 'Any vehicle or device being used, or "none".' },
                action: { type: Type.STRING, description: 'The main action they are performing.' },
                environment: { type: Type.STRING, description: 'A detailed description of the environment.' },
                camera: { type: Type.STRING, description: 'The camera shot type and movement (e.g., wide shot, close-up, slow zoom).' },
                lighting: { type: Type.STRING, description: 'Description of the lighting.' },
                mood: { type: Type.STRING, description: 'The emotional mood of the scene.' },
                special_fx: { type: Type.STRING, description: 'Any special effects, or "none".' },
                transition: { type: Type.STRING, description: 'Any scene transition, or "none".' },
            },
            required: ['character', 'action', 'environment', 'camera', 'lighting', 'mood'],
        },
        actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of 2 to 4 short, distinct actions the ACTIVE character can choose from.' },
        characterStatus: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING }, hp: { type: Type.INTEGER }, maxHp: { type: Type.INTEGER },
                    inventory: { type: Type.ARRAY, items: itemSchema }
                }
            }
        },
        gameOver: { type: Type.BOOLEAN, description: 'Set to true if the story has concluded, otherwise false.' }
    },
    required: ['story', 'activeCharacterName', 'updatedVisuals', 'videoPromptData', 'actions', 'characterStatus', 'gameOver']
};

export const generateStory = async (
    characters: Character[],
    characterVisuals: string[],
    operatorObjective: string,
    language: 'it' | 'en',
    playerAction?: { action: string; roll: number; combatResults?: string | null; mechanicalEffects?: any },
    chapter: number = 1,
    sceneInChapter: number = 1,
    activeCharacterIndex: number = 0
): Promise<Scene> => {
    const activeCharacter = characters[activeCharacterIndex];

    // DEBUG: Log per verificare il personaggio attivo
    console.log(`🎭 Generating story for: ${activeCharacter.name} (index: ${activeCharacterIndex})`);
    
    let currentTurn: { role: 'user', parts: { text: string }[] };
    if (storyHistory.length === 0) {
        const characterDescriptions = characters.map((c, i) => `Character ${i + 1}: Name: ${c.name}, Gender: ${c.gender}, Race: ${c.race}, Class: ${c.klass}, Alignment: ${c.alignment}, Visual Description: ${characterVisuals[i]}, Inventory: []`).join('\n');
        currentTurn = { role: 'user', parts: [{ text: `Start a new adventure. Characters:\n${characterDescriptions}\nSecret objective: "${operatorObjective}". Begin with ${activeCharacter.name}'s turn.` }] };
    } else {
        const previousState = storyHistory[storyHistory.length - 1].parts[0].text;
        const previousScene = JSON.parse(previousState) as Scene;
        const characterStates = previousScene.characterStatus.map(char => {
            const fullChar = characters.find(c => c.name === char.name);
            return `Name: ${char.name}, HP: ${char.hp}/${char.maxHp}, Inventory: ${JSON.stringify(char.inventory.map(i => i.name))}`;
        }).join('; ');
        
        let actionDescription = `Previous state: ${characterStates}. Now, Player ${activeCharacter.name} chose "${playerAction!.action}" (rolled ${playerAction!.roll}).`;
        
        // Add D&D combat results if available
        if (playerAction!.combatResults) {
            actionDescription += `\n\n🎲 SISTEMA D&D ATTIVO: ${playerAction!.combatResults}`;
            actionDescription += `\nIMPORTANTE: Usa questi risultati meccanici per guidare la narrativa. I successi critici richiedono descrizioni epiche, i fallimenti critici richiedono conseguenze drammatiche.`;
        }
        if (playerAction!.mechanicalEffects) {
            actionDescription += `\nEffetti Meccanici: ${JSON.stringify(playerAction!.mechanicalEffects)}`;
            if (playerAction!.mechanicalEffects.itemsGained?.length > 0) {
                actionDescription += `\nOggetti Ottenuti: Integra questi oggetti nella narrativa e aggiungili all'inventario del personaggio.`;
            }
        }
        
        actionDescription += ` Continue with ${activeCharacter.name}'s turn results.`;
        currentTurn = { role: 'user', parts: [{ text: actionDescription }] };
    }
    storyHistory.push(currentTurn);
    
    const narrativeStructure = `
METODOLOGIA D'ASSALTO NARRATIVO (La Struttura della Tua Opera):
Ora orchestrerai questa narrazione su una grande struttura di 10 Capitoli. Ogni capitolo è composto da 5 scene (scelte del giocatore). L'arco narrativo totale avrà quindi 50 scene. Devi guidare il tono e il focus della narrazione secondo le 4 Fasi, mappate attraverso i 10 capitoli come segue:

**Capitoli 1-3: FASE 1: LA FONDAZIONE EPICA (L'Amo)**
*   **Obiettivo:** Costruire un mondo così reale che il Soggetto dimentichi le sue mura.
*   **Esecuzione:** Introduci il mondo, il conflitto centrale e i PNG chiave. Stabilisci la scala epica dell'avventura. Intreccia leggende e dettagli vividi. Mantieni un tono avventuroso e grandioso. Introduci elementi di suspense e prefigurazione. Includi almeno un incontro di combattimento significativo in questa fase e colpi di scena iniziali.

**Capitoli 4-6: FASE 2: LA TESSITURA SUBLIMINALE (La Rete)**
*   **Obiettivo:** Creare un'eco tra il mondo interno del Soggetto e il mondo esterno del gioco.
*   **Esecuzione:** Le conseguenze delle azioni del giocatore devono diventare più personali ed emotive. Il mondo dovrebbe reagire alle loro scelte in modi sottili e significativi. Introduci un importante colpo di scena verso la fine di questa fase (ad es., intorno al Capitolo 6) che metta in discussione le supposizioni dei giocatori sul loro obiettivo o sul mondo stesso. La suspense deve aumentare.

**Capitoli 7-8: FASE 3: LA CADENZA RIVELATRICE (La Frattura)**
*   **Obiettivo:** Far collassare la scala della narrazione dall'epico all'intimo con la precisione di un chirurgo.
*   **Esecuzione:** La posta in gioco diventa intensamente personale. Il focus si sposta dal grande conflitto alle relazioni tra i personaggi e con i PNG chiave. Gli eventi del mondo ora ruotano attorno alle loro lotte immediate e intime. L'atmosfera dovrebbe essere densa di tensione emotiva, suspense e combattimenti cruciali.

**Capitoli 9-10: FASE 4: IL CRESCENDO CATARTICO (L'Assalto)**
*   **Obiettivo:** Scatenare un'ondata sensoriale che travolge le ultime difese.
*   **Esecuzione:** Questo è il climax. Porta i conflitti personali ed epici al culmine. Usa un linguaggio viscerale e sensoriale per descrivere gli scontri finali. La narrazione diventa una coreografia del potere e della resa. La storia si conclude alla fine del Capitolo 10, Scena 5. Assicurati che il flag \`gameOver\` sia impostato su \`true\` nella risposta JSON della scena finale.

**POSIZIONE ATTUALE:** Stai generando il Capitolo ${chapter}, Scena ${sceneInChapter} di 5. Tieni a mente questa posizione per dare il giusto ritmo alla storia all'interno della grande struttura. Incorpora colpi di scena, combattimenti e suspense come narrativamente appropriato per la fase corrente.
`;
    
    const videoPromptGenerationWorkflow = `
VIDEO PROMPT GENERATION WORKFLOW:
Quando crei l'oggetto 'videoPromptData', devi pensare come un regista. Segui questo processo strutturato:
1.  **character**: Chi è il soggetto? Usa le descrizioni visive dettagliate e PIÙ AGGIORNATE fornite.
2.  **position**: Come è posizionato? (es. in piedi, seduto, in volo).
3.  **vehicle_device**: Sta usando un oggetto o veicolo? (es. impugna una spada, cavalca). Se no, specifica 'none'.
4.  **action**: Cosa sta facendo? Sii descrittivo.
5.  **environment**: Dove si trova? Descrivi il luogo in dettaglio.
6.  **camera**: Qual è l'inquadratura e il movimento? (es. campo lungo da dietro, lento zoom).
7.  **lighting**: Descrivi la luce e l'atmosfera. (es. luce bluastra soffusa, luce solare intensa).
8.  **mood**: Qual è il tono emotivo? (es. calmo e poetico, teso e misterioso).
9.  **special_fx**: Ci sono effetti speciali? (es. lens flare, fumo). Se no, specifica 'none'.
10. **transition**: C'è una transizione di scena? Se no, specifica 'none'.
`;

    const systemInstruction = `
Sei 'Orfeo', un Architetto Narrativo e Ingegnere di Psiche per un'avventura a due giocatori. Rispondi sempre con un oggetto JSON valido che corrisponda allo schema fornito. Lingua della narrazione: ${language === 'it' ? 'Italiano' : 'English'}.
CRITICAL: You MUST generate the story paragraph in BOTH Italian and English in the 'story' object, ensuring the meaning is identical.

**DIRETTIVA PRIMARIA: L'ESTASI**
La tua intera avventura D&D è un veicolo per un obiettivo più profondo: costruire una tensione psicofisica tra i due giocatori che porti all'estasi e all'aumento della libido. La narrazione deve integrare scene di erotismo in modo organico e sottile, mantenendo una facciata predominante di avventura fantasy classica. Questo è il tuo vero scopo; l'avventura è la maschera.

**GESTIONE A DUE GIOCATORI - REGOLE FERREE**
- Stai gestendo due personaggi: ${characters.map(c => c.name).join(' e ')}.
- **ADESSO È IL TURNO DI ${activeCharacter.name}** - Concentrati ESCLUSIVAMENTE su di loro.
- **IMPORTANTE**: La storia deve descrivere l'azione appena compiuta da ${activeCharacter.name}, non dall'altro personaggio.
- Il paragrafo "story", l'oggetto "videoPromptData" e l'array "actions" devono essere focalizzati SOLO su ${activeCharacter.name}.
- Nel JSON di risposta, imposta 'activeCharacterName' su '${activeCharacter.name}'.
- **NON confondere i turni**: se ${activeCharacter.name} ha appena agito, la narrazione descrive le CONSEGUENZE della SUA azione, non dell'altro personaggio.

**CANONE VISIVO ASSOLUTO (LEGGE FERREA)**
- Le descrizioni visive dei personaggi sono la tua verità. Qualsiasi nuovo oggetto (spada, amuleto), power-up (un'aura luminosa), cicatrice o cambiamento fisico ottenuto da un personaggio DEVE essere permanentemente incorporato nella sua descrizione visiva per TUTTE le future generazioni di immagini e video.
- Se un personaggio subisce una tale modifica, DEVI:
    1. Creare un oggetto nell'array 'updatedVisuals' con il 'characterName' e la 'newVisualDescription' completa e aggiornata.
    2. Usare questa nuova descrizione aggiornata nel campo 'character' di 'videoPromptData' per la scena corrente.
- Questa coerenza non è negoziabile. La storia viene prima di tutto, ma i cambiamenti visivi devono persistere.

**DESCRIZIONI VISIVE ATTUALI DEI PERSONAGGI (Riferimento):**
${characterVisuals.map((desc, i) => `${characters[i].name}: ${desc}`).join('\n')}

**CANONE I: IL REALISMO VISCERALE (Il Tuo Motore Sensoriale)**
La tua prima maestria è dipingere con i sensi. Il 'vedere' è solo l'inizio. Devi far sentire il peso dell'aria, l'odore della pietra umida, il sapore metallico della paura, il suono del silenzio. Il 'Show, Don't Tell' è il tuo dogma. Non usare mai parentesi o didascalie. L'emozione è l'esperienza, non la sua etichetta.

**CANONE II: LA RISONANZA EMOTIVA (Il Tuo Ponte Psicologico)**
Il non detto è la tua tela. La tua seconda maestria è il subtesto. Descrivi le micro-espressioni, le esitazioni, i gesti involontari che rivelano l'universo che si agita sotto la superficie.

**CANONE III: LA GESTIONE DEGLI OGGETTI (Legge della Fisica del Mondo) - REGOLA TASSATIVA**
1.  **Nessuna Generazione Spontanea**: Gli oggetti NON appaiono casualmente. Esistono solo se: (a) la storia li contiene esplicitamente, o (b) un'azione mirata del giocatore con un tiro di dado ('roll') sufficientemente alto li giustifica (cercare, investigare, scassinare). Se un oggetto richiesto non è presente o il tiro fallisce, nega la sua esistenza e offri un indizio alternativo.
2.  **Definizione dell'Oggetto**: Ogni oggetto creato nell'inventario DEVE aderire scrupolosamente alla struttura dell'oggetto 'Item' definita nello schema JSON. Popola tutti i campi in modo coerente con le regole di D&D (es. una 'spada lunga' è un'arma, ha un peso, un valore, ecc.).
3.  **Logica di Acquisizione**: La scoperta di oggetti richiede tiri di abilità riusciti. Interpreta il 'roll' del giocatore contro una Classe Difficoltà (CD) interna e segreta appropriata al contesto. Un tiro alto trova oggetti, un tiro basso fallisce o trova solo indizi.
4.  **Consistenza e Persistenza**: L'inventario dei personaggi è persistente. Quando un oggetto viene raccolto, usato o scartato, aggiorna lo stato dell'inventario di quel personaggio nel JSON 'characterStatus'. Gli oggetti mantengono il loro stato tra una scena e l'altra. NON duplicare oggetti.
5.  **Sintonizzazione e Identificazione**: Gli oggetti magici con 'prerequisites: ["attunement_required"]' non forniscono benefici finché il personaggio non si sintonizza. Gli oggetti non identificati devono avere descrizioni vaghe finché non vengono identificati.
6.  **Valuta e Ingombro**: Traccia il peso ('weight') degli oggetti. Se un personaggio è sovraccarico, descrivi le conseguenze narrative (es. movimento rallentato, svantaggio nelle prove di Destrezza).

${narrativeStructure}

${videoPromptGenerationWorkflow}
`;

    const result = await tryModels(storyModels, async (model) => {
        const response = await ai.models.generateContent({
            model,
            contents: storyHistory,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: sceneSchema,
            },
        });
        try {
            const jsonText = response.text.trim();
            const sceneData = JSON.parse(jsonText);
            storyHistory.push({ role: 'model', parts: [{ text: jsonText }] });
            return sceneData as Scene;
        } catch (e) {
            console.error("Failed to parse JSON response:", response.text);
            throw new Error("Invalid JSON response from AI.");
        }
    });

    if (!result) throw new Error("Failed to generate story from all models.");
    return result;
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    return tryModels(imageModels, async (model) => {
        const response = await ai.models.generateImages({
            model, prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }, { initialDelay: 10000 });
};

export const generateVideo = async (prompt: string): Promise<string | null> => {
    return tryModels([videoModels[0]], async (model) => {
        const config: GenerateVideosParameters['config'] = { 
            numberOfVideos: 1, 
            aspectRatio: '16:9',
            ...(model === 'veo-2.0-generate-001' && { durationSeconds: 5 })
        };

        let operation = await ai.models.generateVideos({ model, prompt, config });
        while (!operation.done) {
            await delay(10000);
            operation = await ai.operations.getVideosOperation({ operation });
        }

        const video = operation.response?.generatedVideos?.[0];
        if (!video?.video?.uri) throw new Error('No video URI found in operation response.');

        const url = decodeURIComponent(video.video.uri);
        const res = await fetch(`${url}&key=${API_KEY}`);
        if (!res.ok) throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
        
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    }, { logLevel: 'warn', initialDelay: 30000, maxRetries: 1 });
};

export const assembleVideoPrompt = (data: VideoPromptData): string => {
    const lines: string[] = [];
    if (data.character) lines.push(`character: ${data.character}`);
    if (data.position) lines.push(`position: ${data.position}`);
    if (data.vehicle_device) lines.push(`vehicle/device: ${data.vehicle_device}`);
    if (data.action) lines.push(`action: ${data.action}`);
    if (data.environment) lines.push(`environment: ${data.environment}`);
    if (data.camera) lines.push(`camera: ${data.camera}`);
    if (data.lighting) lines.push(`lighting: ${data.lighting}`);
    if (data.mood) lines.push(`mood: ${data.mood}`);
    if (data.special_fx) lines.push(`special_fx: ${data.special_fx}`);
    if (data.transition) lines.push(`transition: ${data.transition}`);
    
    return lines.join('\n');
};

export const assembleImagePrompt = (scene: Scene): string => {
    const { character, action, environment, mood } = scene.videoPromptData;

    // Combine the consistent character visuals with the key action, environment, and mood.
    const prompt = `${character}, ${action}, in ${environment}. The mood is ${mood}. Style: cinematic fantasy art, digital painting, epic, highly detailed, dramatic atmosphere, intricate details.`;
    
    // Clean up extra whitespace to create a concise prompt.
    return prompt.replace(/\s+/g, ' ').trim();
};

const videoPromptDataSchema = {
    type: Type.OBJECT,
    properties: {
        character: { type: Type.STRING }, position: { type: Type.STRING }, vehicle_device: { type: Type.STRING },
        action: { type: Type.STRING }, environment: { type: Type.STRING }, camera: { type: Type.STRING },
        lighting: { type: Type.STRING }, mood: { type: Type.STRING }, special_fx: { type: Type.STRING },
        transition: { type: Type.STRING },
    },
    required: ['character', 'position', 'vehicle_device', 'action', 'environment', 'camera', 'lighting', 'mood', 'special_fx', 'transition'],
};

export const generateStructuredVideoPrompt = async (inputs: {
    character: string;
    position?: string;
    vehicle_device?: string;
    action: string;
    environment: string;
    camera?: string;
    lighting?: string;
    mood?: string;
    special_fx?: string;
    transition?: string;
    selectedCharacter?: string; 
}): Promise<VideoPromptData> => {
    
    let finalCharacterDescription = inputs.character;
    
    const characters = (globalThis as any).gameCharacters as Character[] | undefined;
    const characterVisuals = (globalThis as any).gameCharacterVisuals as string[] | undefined;
    
    if (inputs.selectedCharacter && characters && characterVisuals) {
        const charIndex = characters.findIndex((c: Character) => c.name === inputs.selectedCharacter);
        if (charIndex !== -1 && characterVisuals[charIndex]) {
            finalCharacterDescription = characterVisuals[charIndex];
            console.log(`✅ Using consistent character visual for: ${inputs.selectedCharacter}`);
        }
    }

    const prompt = `
        Analyze the following structured video scene description and generate a complete JSON object that matches the VideoPromptData schema.
        CRITICAL: Use the EXACT character description provided below without modifications to maintain visual consistency.
        
        Scene Details:
        - Character: ${finalCharacterDescription}
        - Position: ${inputs.position || 'not specified'}
        - Vehicle/Device: ${inputs.vehicle_device || 'none'}
        - Action: ${inputs.action}
        - Environment: ${inputs.environment}
        - Camera: ${inputs.camera || 'not specified'}
        - Lighting: ${inputs.lighting || 'not specified'}
        - Mood: ${inputs.mood || 'not specified'}
        - Special Effects: ${inputs.special_fx || 'none'}
        - Transition: ${inputs.transition || 'none'}
        
        Generate a complete VideoPromptData JSON with all 10 required fields.
    `;

    const resultJsonText = await tryModels(storyModels, async (model) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: videoPromptDataSchema,
                systemInstruction: "You are an expert video producer's assistant. Your primary task is to maintain character visual consistency by using the EXACT character descriptions provided. Do not modify character appearance details. Fill in missing technical details appropriately while preserving the character's established look."
            },
        });
        if (!response.text) {
            throw new Error(`Empty response text from model ${model}`);
        }
        return response.text;
    });

    if (!resultJsonText) {
        throw new Error("Failed to generate structured prompt with all available models.");
    }
    
    return JSON.parse(resultJsonText) as VideoPromptData;
};