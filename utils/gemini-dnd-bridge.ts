import { Character, Scene, Item } from '../types';
import { DNDGameManager, ActionResult } from './dnd-integration';
import { 
    performAttack, 
    calculateCombatStats, 
    rollD20, 
    getAbilityModifier, 
    getProficiencyBonus 
} from './combat';
import { 
    addItemToInventory, 
    createItemFromTemplate, 
    generateRandomLoot, 
    ITEM_TEMPLATES 
} from './inventory';
import { 
    castSpell, 
    useClassAbility, 
    SPELLS_DATABASE, 
    CLASS_ABILITIES 
} from './abilities';
import { 
    performSkillCheck, 
    levelUpCharacter, 
    DIFFICULTY_CLASSES 
} from './game-rules';

// Integrazione tra il sistema D&D e l'AI Gemini esistente
export class GeminiDNDBridge {
    private characters: Character[];
    
    constructor(characters: Character[]) {
        this.characters = characters;
    }
    
    // Metodo di istanza per processare azioni con stato
    async processAction(characterName: string, action: string, roll: number) {
        const activeCharacterIndex = this.characters.findIndex(c => c.name === characterName);
        if (activeCharacterIndex === -1) {
            throw new Error(`Character ${characterName} not found`);
        }
        
        const result = GeminiDNDBridge.processPlayerAction(
            this.characters,
            activeCharacterIndex,
            action,
            roll
        );
        
        // Aggiorna i personaggi localmente
        this.characters = result.characterUpdates;
        
        return {
            narrative: result.narrativePrompts.join(' '),
            mechanicalEffects: {
                itemsGained: result.itemsGenerated,
                dndResults: result.dndResults
            },
            characterUpdates: result.characterUpdates.map((char, index) => ({
                characterName: char.name,
                stats: {
                    hp: char.hp,
                    maxHp: char.maxHp,
                    inventory: char.inventory,
                    level: char.level
                }
            }))
        };
    }
    
    // Processa l'azione del giocatore e genera contenuto per Gemini AI
    static processPlayerAction(
        characters: Character[],
        activeCharacterIndex: number,
        action: string,
        roll: number,
        scene?: Scene
    ): {
        dndResults: ActionResult[];
        narrativePrompts: string[];
        itemsGenerated: Item[];
        characterUpdates: Character[];
    } {
        const activeCharacter = characters[activeCharacterIndex];
        const dndResults: ActionResult[] = [];
        const narrativePrompts: string[] = [];
        const itemsGenerated: Item[] = [];
        const updatedCharacters = [...characters];
        
        // 1. Applica le conseguenze del roll
        const rollConsequences = DNDGameManager.applyRollConsequences(
            activeCharacter, 
            action, 
            roll
        );
        
        if (rollConsequences.success) {
            dndResults.push({
                success: true,
                message: rollConsequences.consequences.join(' '),
                itemsGained: rollConsequences.rewards
            });
            
            const enhancedPrompt = this.generateDetailedSuccessPrompt(activeCharacter, action, roll, rollConsequences);
            narrativePrompts.push(enhancedPrompt);
        } else {
            dndResults.push({
                success: false,
                message: rollConsequences.consequences.join(' ')
            });
            
            const enhancedPrompt = this.generateDetailedFailurePrompt(activeCharacter, action, roll, rollConsequences);
            narrativePrompts.push(enhancedPrompt);
        }
        
        // 2. Determina il tipo di scena e genera loot appropriato
        const sceneType = this.determineSceneType(action);
        const sceneLoot = DNDGameManager.generateSceneLoot(activeCharacter.level, sceneType);
        
        sceneLoot.forEach(lootMessage => {
            narrativePrompts.push(`Loot found: ${lootMessage}`);
            
            // Crea oggetti dal loot trovato
            const itemKey = this.mapLootMessageToItemKey(lootMessage);
            if (itemKey && ITEM_TEMPLATES[itemKey]) {
                const item = createItemFromTemplate(itemKey, 'loot');
                const addResult = addItemToInventory(activeCharacter, item);
                if (addResult.success) {
                    itemsGenerated.push(item);
                }
            }
        });
        
        // 3. Controlla level up automatico
        const levelUpMessages = DNDGameManager.autoLevelUp(activeCharacter, 1); // scene placeholder
        if (levelUpMessages.length > 0) {
            narrativePrompts.push(`Level up! ${levelUpMessages.join(' ')}`);
        }
        
        // 4. Aggiorna statistiche combat
        const combatStats = calculateCombatStats(activeCharacter);
        narrativePrompts.push(`Current AC: ${combatStats.armorClass}, Attack bonus: +${combatStats.attackBonus}`);
        
        return {
            dndResults,
            narrativePrompts,
            itemsGenerated,
            characterUpdates: updatedCharacters
        };
    }
    
    // Genera prompt specifici per diversi tipi di azioni
    static generateActionPrompts(
        character: Character,
        action: string,
        roll: number
    ): string[] {
        const prompts: string[] = [];
        
        // Analizza il tipo di azione
        if (this.isAttackAction(action)) {
            prompts.push(this.generateCombatPrompts(character, action, roll));
        } else if (this.isSkillAction(action)) {
            prompts.push(this.generateSkillPrompts(character, action, roll));
        } else if (this.isSpellAction(action)) {
            prompts.push(this.generateSpellPrompts(character, action, roll));
        } else {
            prompts.push(this.generateGeneralPrompts(character, action, roll));
        }
        
        return prompts;
    }
    
    // Suggerisci azioni appropriate basate sulla situazione
    static generateActionSuggestions(
        character: Character,
        scene: Scene,
        situationType: 'combat' | 'exploration' | 'social'
    ): string[] {
        const suggestions = DNDGameManager.suggestActions(character, scene, situationType);
        
        // Aggiungi dettagli D&D alle suggerimenti
        const enhancedSuggestions = suggestions.map(suggestion => {
            if (suggestion.includes('Attack')) {
                const weapons = character.inventory.filter(item => 
                    item.type === 'weapon' && item.tags.includes('equipped')
                );
                if (weapons.length > 0) {
                    return `${suggestion} with ${weapons[0].name} (${weapons[0].description})`;
                }
            }
            
            if (suggestion.includes('Cast')) {
                const availableSpells = this.getAvailableSpells(character);
                if (availableSpells.length > 0) {
                    return `${suggestion}: ${availableSpells.slice(0, 3).join(', ')}`;
                }
            }
            
            return suggestion;
        });
        
        return enhancedSuggestions;
    }
    
    // Integra gli oggetti D&D con la generazione di prompt video/immagini
    static enhanceVideoPromptWithEquipment(
        character: Character,
        basePrompt: string
    ): string {
        let enhancedPrompt = basePrompt;
        
        // Aggiungi armi equipaggiate
        const equippedWeapon = character.inventory.find(item => 
            item.type === 'weapon' && item.tags.includes('equipped')
        );
        if (equippedWeapon) {
            enhancedPrompt += `, wielding a ${equippedWeapon.name.toLowerCase()}`;
        }
        
        // Aggiungi armatura
        const equippedArmor = character.inventory.find(item => 
            item.type === 'armor' && !item.properties.includes('shield') && item.tags.includes('equipped')
        );
        if (equippedArmor) {
            enhancedPrompt += `, wearing ${equippedArmor.name.toLowerCase()}`;
        }
        
        // Aggiungi scudo
        const equippedShield = character.inventory.find(item => 
            item.type === 'armor' && item.properties.includes('shield') && item.tags.includes('equipped')
        );
        if (equippedShield) {
            enhancedPrompt += `, carrying a ${equippedShield.name.toLowerCase()}`;
        }
        
        // Aggiungi effetti magici visibili
        const magicalItems = character.inventory.filter(item => 
            item.properties.includes('magical') && item.tags.includes('equipped')
        );
        magicalItems.forEach(item => {
            if (item.effects.includes('light')) {
                enhancedPrompt += `, surrounded by magical light`;
            }
            if (item.effects.includes('fire_damage')) {
                enhancedPrompt += `, with flames flickering around their weapon`;
            }
            if (item.effects.includes('cold_damage')) {
                enhancedPrompt += `, with frost emanating from their weapon`;
            }
        });
        
        return enhancedPrompt;
    }
    
    // Genera statistiche per il sistema di narrazione AI
    static generateCharacterStatistics(character: Character): {
        combatReadiness: number; // 0-100
        magicalPower: number; // 0-100
        socialInfluence: number; // 0-100
        exploration: number; // 0-100
        overallPower: number; // 0-100
    } {
        const stats = calculateCombatStats(character);
        const totalInventoryValue = character.inventory.reduce((sum, item) => sum + item.value, 0);
        const magicalItems = character.inventory.filter(item => item.properties.includes('magical')).length;
        
        // Calcola metriche normalizzate
        const combatReadiness = Math.min(100, (stats.armorClass - 10) * 5 + stats.attackBonus * 3 + character.hp / character.maxHp * 20);
        const magicalPower = Math.min(100, magicalItems * 15 + (stats.spellAttackBonus || 0) * 5);
        const socialInfluence = Math.min(100, getAbilityModifier(character.abilityScores.CHA) * 10 + 50);
        const exploration = Math.min(100, getAbilityModifier(character.abilityScores.WIS) * 8 + getAbilityModifier(character.abilityScores.INT) * 7 + 30);
        const overallPower = Math.min(100, character.level * 8 + totalInventoryValue / 100);
        
        return {
            combatReadiness,
            magicalPower,
            socialInfluence,
            exploration,
            overallPower
        };
    }
    
    // === FUNZIONI PRIVATE DI SUPPORTO ===
    
    private static determineSceneType(action: string): 'combat' | 'exploration' | 'social' {
        const lowerAction = action.toLowerCase();
        
        if (lowerAction.includes('attack') || lowerAction.includes('fight') || lowerAction.includes('cast') || lowerAction.includes('defend')) {
            return 'combat';
        } else if (lowerAction.includes('search') || lowerAction.includes('investigate') || lowerAction.includes('climb') || lowerAction.includes('sneak')) {
            return 'exploration';
        } else {
            return 'social';
        }
    }
    
    private static mapLootMessageToItemKey(lootMessage: string): string | null {
        const lowerMessage = lootMessage.toLowerCase();
        
        // Mappa messaggi di loot a chiavi di oggetti
        if (lowerMessage.includes('healing potion')) return 'healing_potion';
        if (lowerMessage.includes('sword')) return 'longsword';
        if (lowerMessage.includes('bow')) return 'shortbow';
        if (lowerMessage.includes('armor')) return 'leather_armor';
        if (lowerMessage.includes('rope')) return 'rope_hemp';
        if (lowerMessage.includes('tools')) return 'thieves_tools';
        if (lowerMessage.includes('torch')) return 'torch';
        if (lowerMessage.includes('dagger')) return 'dagger';
        if (lowerMessage.includes('shield')) return 'shield';
        
        return null;
    }
    
    private static isAttackAction(action: string): boolean {
        const lowerAction = action.toLowerCase();
        return lowerAction.includes('attack') || lowerAction.includes('strike') || lowerAction.includes('hit') || lowerAction.includes('swing');
    }
    
    private static isSkillAction(action: string): boolean {
        const lowerAction = action.toLowerCase();
        const skillWords = ['stealth', 'sneak', 'climb', 'jump', 'persuade', 'investigate', 'search', 'perception', 'insight'];
        return skillWords.some(skill => lowerAction.includes(skill));
    }
    
    private static isSpellAction(action: string): boolean {
        const lowerAction = action.toLowerCase();
        return lowerAction.includes('cast') || lowerAction.includes('spell') || lowerAction.includes('magic');
    }
    
    private static generateCombatPrompts(character: Character, action: string, roll: number): string {
        const combatStats = calculateCombatStats(character);
        const weapon = character.inventory.find(item => item.type === 'weapon' && item.tags.includes('equipped'));
        
        let prompt = `Combat action: ${action} (rolled ${roll}). `;
        prompt += `Character has AC ${combatStats.armorClass}, attack bonus +${combatStats.attackBonus}. `;
        
        if (weapon) {
            prompt += `Using ${weapon.name} - ${weapon.description}. `;
        }
        
        if (roll >= 15) {
            prompt += `High roll suggests successful combat maneuver with possible additional effects.`;
        } else if (roll <= 5) {
            prompt += `Low roll suggests combat failure with possible negative consequences.`;
        }
        
        return prompt;
    }
    
    private static generateSkillPrompts(character: Character, action: string, roll: number): string {
        let prompt = `Skill-based action: ${action} (rolled ${roll}). `;
        
        // Determina la skill più probabile
        let skill = 'Athletics';
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes('stealth') || lowerAction.includes('sneak')) skill = 'Stealth';
        else if (lowerAction.includes('investigate') || lowerAction.includes('search')) skill = 'Investigation';
        else if (lowerAction.includes('persuade')) skill = 'Persuasion';
        else if (lowerAction.includes('climb')) skill = 'Athletics';
        
        const skillCheck = performSkillCheck(character, skill as any, 15);
        prompt += `${skill} check result: ${skillCheck.total} vs DC 15. `;
        
        if (roll >= 18) {
            prompt += `Exceptional skill performance with creative benefits.`;
        } else if (roll <= 3) {
            prompt += `Skill attempt fails with complications.`;
        }
        
        return prompt;
    }
    
    private static generateSpellPrompts(character: Character, action: string, roll: number): string {
        const stats = calculateCombatStats(character);
        let prompt = `Magic action: ${action} (rolled ${roll}). `;
        
        if (stats.spellAttackBonus) {
            prompt += `Spell attack bonus: +${stats.spellAttackBonus}, spell save DC: ${stats.spellSaveDC}. `;
        }
        
        const availableSpells = this.getAvailableSpells(character);
        if (availableSpells.length > 0) {
            prompt += `Available spells: ${availableSpells.slice(0, 3).join(', ')}. `;
        }
        
        return prompt;
    }
    
    private static generateGeneralPrompts(character: Character, action: string, roll: number): string {
        return `General action: ${action} (rolled ${roll}). Character level ${character.level}, HP ${character.hp}/${character.maxHp}.`;
    }
    
    private static getAvailableSpells(character: Character): string[] {
        const classSpells: Record<string, string[]> = {
            'wizard': ['fire_bolt', 'magic_missile', 'shield', 'fireball', 'lightning_bolt'],
            'cleric': ['sacred_flame', 'cure_wounds', 'healing_word'],
            'sorcerer': ['fire_bolt', 'magic_missile', 'fireball', 'haste'],
            'warlock': ['eldritch_blast', 'charm_person'],
            'bard': ['minor_illusion', 'healing_word', 'charm_person']
        };
        
        const spellIds = classSpells[character.klass.toLowerCase()] || [];
        return spellIds.map(id => SPELLS_DATABASE[id]?.name).filter(Boolean);
    }
    
    // Genera prompt dettagliato per azione riuscita
    private static generateDetailedSuccessPrompt(
        character: Character, 
        action: string, 
        roll: number, 
        rollConsequences: any
    ): string {
        let prompt = `🎲 SUCCESSO D&D: ${character.name}'s "${action}" succeeded with roll ${roll}! `;
        
        // Aggiungi dettagli del personaggio
        const combatStats = calculateCombatStats(character);
        prompt += `[Character Stats: Level ${character.level}, AC ${combatStats.armorClass}, HP ${character.hp}/${character.maxHp}] `;
        
        // Aggiungi dettagli dell'equipaggiamento
        const equippedWeapon = character.inventory.find(item => 
            item.type === 'weapon' && item.tags.includes('equipped')
        );
        if (equippedWeapon) {
            prompt += `[Weapon: ${equippedWeapon.name} - ${equippedWeapon.description}] `;
        }
        
        // Aggiungi conseguenze specifiche
        prompt += `Consequences: ${rollConsequences.consequences.join(', ')}. `;
        
        // Suggerisci elementi narrativi basati sul roll
        if (roll >= 19) {
            prompt += `CRITICAL SUCCESS: Describe exceptional results with cinematic flair. `;
        } else if (roll >= 15) {
            prompt += `HIGH SUCCESS: Include impressive execution and potential bonus effects. `;
        }
        
        return prompt;
    }
    
    // Genera prompt dettagliato per azione fallita
    private static generateDetailedFailurePrompt(
        character: Character, 
        action: string, 
        roll: number, 
        rollConsequences: any
    ): string {
        let prompt = `🎲 FALLIMENTO D&D: ${character.name}'s "${action}" failed with roll ${roll}. `;
        
        // Aggiungi conseguenze
        prompt += `Consequences: ${rollConsequences.consequences.join(', ')}. `;
        
        // Suggerisci elementi narrativi basati sul roll
        if (roll <= 2) {
            prompt += `CRITICAL FAILURE: Describe catastrophic results with dramatic consequences. `;
        } else if (roll <= 5) {
            prompt += `LOW FAILURE: Include significant setbacks and complications. `;
        } else {
            prompt += `MINOR FAILURE: Describe missed opportunity but avoid major penalties. `;
        }
        
        return prompt;
    }
}

// Funzioni di utilità per l'integrazione con il sistema esistente
export const integrateDNDWithGemini = {
    // Arricchisce il prompt di sistema con informazioni D&D
    enhanceSystemPrompt: (basePrompt: string, characters: Character[]): string => {
        let enhancedPrompt = basePrompt;
        
        enhancedPrompt += "\n\n=== D&D INTEGRATION INSTRUCTIONS ===\n";
        enhancedPrompt += "You have access to a complete D&D 5e system. When narrating:\n";
        enhancedPrompt += "- Reference character equipment and abilities accurately\n";
        enhancedPrompt += "- Incorporate combat mechanics naturally into the story\n";
        enhancedPrompt += "- Generate appropriate loot based on encounter difficulty\n";
        enhancedPrompt += "- Track character progression and level-appropriate challenges\n";
        
        characters.forEach((char, index) => {
            const stats = GeminiDNDBridge.generateCharacterStatistics(char);
            const combatInfo = calculateCombatStats(char);
            
            enhancedPrompt += `\nCharacter ${index + 1} - ${char.name} (Level ${char.level} ${char.race} ${char.klass}):\n`;
            enhancedPrompt += `- Combat: AC ${combatInfo.armorClass}, Attack +${combatInfo.attackBonus}, HP ${char.hp}/${char.maxHp}\n`;
            enhancedPrompt += `- Power Level: ${stats.overallPower}/100, Combat Readiness: ${stats.combatReadiness}/100\n`;
            
            const equippedItems = char.inventory.filter(item => item.tags.includes('equipped'));
            if (equippedItems.length > 0) {
                enhancedPrompt += `- Equipment: ${equippedItems.map(item => item.name).join(', ')}\n`;
            }
        });
        
        return enhancedPrompt;
    },
    
    // Processa i risultati dell'AI per estrarre informazioni D&D
    processAIResponse: (response: string, characters: Character[]): {
        extractedActions: string[];
        suggestedDCs: number[];
        itemReferences: string[];
    } => {
        const extractedActions: string[] = [];
        const suggestedDCs: number[] = [];
        const itemReferences: string[] = [];
        
        // Pattern recognition per azioni
        const actionPatterns = [
            /attempt to (\w+)/gi,
            /tries to (\w+)/gi,
            /rolls? for (\w+)/gi
        ];
        
        actionPatterns.forEach(pattern => {
            const matches = response.match(pattern);
            if (matches) {
                extractedActions.push(...matches);
            }
        });
        
        // Estrai riferimenti a DC
        const dcPattern = /DC\s*(\d+)/gi;
        const dcMatches = response.match(dcPattern);
        if (dcMatches) {
            dcMatches.forEach(match => {
                const dc = parseInt(match.replace(/DC\s*/i, ''));
                if (!isNaN(dc)) suggestedDCs.push(dc);
            });
        }
        
        // Estrai riferimenti a oggetti
        Object.values(ITEM_TEMPLATES).forEach(template => {
            if (response.toLowerCase().includes(template.name.toLowerCase())) {
                itemReferences.push(template.name);
            }
        });
        
        return {
            extractedActions,
            suggestedDCs,
            itemReferences
        };
    }
};