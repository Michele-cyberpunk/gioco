import { Character, Scene } from '../types';
import { 
    performAttack, 
    calculateCombatStats, 
    performHealing, 
    performAbilityCheck,
    performSavingThrow 
} from './combat';
import { 
    addItemToInventory, 
    createItemFromTemplate, 
    useConsumableItem,
    generateRandomLoot,
    equipItem,
    ITEM_TEMPLATES 
} from './inventory';
import { 
    castSpell, 
    useClassAbility, 
    shortRest, 
    longRest,
    SPELLS_DATABASE,
    CLASS_ABILITIES 
} from './abilities';
import { 
    performSkillCheck, 
    levelUpCharacter, 
    rollInitiative,
    deathSavingThrow,
    getMovementSpeed,
    DIFFICULTY_CLASSES 
} from './game-rules';

// Interfacce per l'integrazione
export interface CombatAction {
    type: 'attack' | 'spell' | 'ability' | 'item' | 'skill' | 'other';
    description: string;
    target?: string;
    itemId?: string;
    spellId?: string;
    abilityId?: string;
    skillName?: string;
    dc?: number;
}

export interface ActionResult {
    success: boolean;
    message: string;
    damage?: number;
    healing?: number;
    effectsApplied?: string[];
    itemsGained?: string[];
}

// Classe principale per gestire le azioni D&D nel gioco
export class DNDGameManager {
    
    // Esegue un'azione di combattimento
    static executeAction(
        actor: Character, 
        action: CombatAction, 
        target?: Character,
        scene?: Scene
    ): ActionResult {
        switch (action.type) {
            case 'attack':
                return this.handleAttackAction(actor, target, action);
                
            case 'spell':
                return this.handleSpellAction(actor, target, action);
                
            case 'ability':
                return this.handleAbilityAction(actor, target, action);
                
            case 'item':
                return this.handleItemAction(actor, target, action);
                
            case 'skill':
                return this.handleSkillAction(actor, action);
                
            default:
                return {
                    success: false,
                    message: `Unknown action type: ${action.type}`
                };
        }
    }
    
    // Gestisce attacchi
    private static handleAttackAction(
        attacker: Character, 
        target?: Character, 
        action?: CombatAction
    ): ActionResult {
        if (!target) {
            return { success: false, message: 'No target specified for attack' };
        }
        
        // Trova l'arma equipaggiata
        const weapon = attacker.inventory.find(item => 
            item.type === 'weapon' && item.tags.includes('equipped')
        );
        
        const result = performAttack(attacker, target, weapon);
        
        let message = result.hit 
            ? `${attacker.name} hits ${target.name} for ${result.damage} damage!`
            : `${attacker.name} misses ${target.name}!`;
        
        if (result.criticalHit) {
            message += ' CRITICAL HIT!';
        }
        
        return {
            success: result.hit,
            message,
            damage: result.damage,
            effectsApplied: result.statusEffects?.map(e => e.name)
        };
    }
    
    // Gestisce incantesimi
    private static handleSpellAction(
        caster: Character, 
        target?: Character, 
        action?: CombatAction
    ): ActionResult {
        if (!action?.spellId) {
            return { success: false, message: 'No spell specified' };
        }
        
        const spell = SPELLS_DATABASE[action.spellId];
        if (!spell) {
            return { success: false, message: `Spell ${action.spellId} not found` };
        }
        
        // Usa slot di livello appropriato (semplificato)
        const slotLevel = spell.level || 1;
        const result = castSpell(caster, action.spellId, slotLevel, target);
        
        return {
            success: result.success,
            message: result.message,
            damage: result.damage,
            healing: result.healing
        };
    }
    
    // Gestisce abilità di classe
    private static handleAbilityAction(
        actor: Character, 
        target?: Character, 
        action?: CombatAction
    ): ActionResult {
        if (!action?.abilityId) {
            return { success: false, message: 'No ability specified' };
        }
        
        const result = useClassAbility(actor, action.abilityId, target);
        
        return {
            success: result.success,
            message: result.message,
            healing: result.effect?.healing
        };
    }
    
    // Gestisce uso oggetti
    private static handleItemAction(
        actor: Character, 
        target?: Character, 
        action?: CombatAction
    ): ActionResult {
        if (!action?.itemId) {
            return { success: false, message: 'No item specified' };
        }
        
        const result = useConsumableItem(actor, action.itemId);
        
        return {
            success: result.success,
            message: result.message
        };
    }
    
    // Gestisce controlli di abilità
    private static handleSkillAction(actor: Character, action: CombatAction): ActionResult {
        if (!action.skillName || !action.dc) {
            return { success: false, message: 'Skill check requires skill name and DC' };
        }
        
        const result = performSkillCheck(
            actor, 
            action.skillName as any, 
            action.dc
        );
        
        return {
            success: result.success,
            message: `${action.skillName} check: ${result.details}`
        };
    }
    
    // Genera loot automatico per la scena
    static generateSceneLoot(characterLevel: number, sceneType: 'combat' | 'exploration' | 'social'): string[] {
        const lootMessages: string[] = [];
        
        if (sceneType === 'combat') {
            // Loot dopo combattimento
            const rarityChance = Math.random();
            let rarity: 'common' | 'uncommon' | 'rare' = 'common';
            
            if (rarityChance < 0.05 && characterLevel >= 5) rarity = 'rare';
            else if (rarityChance < 0.2 && characterLevel >= 3) rarity = 'uncommon';
            
            const loot = generateRandomLoot(characterLevel, rarity);
            loot.forEach(item => {
                lootMessages.push(`Found: ${item.name} (${item.rarity})`);
            });
            
        } else if (sceneType === 'exploration') {
            // Loot da esplorazione
            if (Math.random() < 0.3) { // 30% chance
                const utilityItems = ['rope_hemp', 'thieves_tools', 'healing_potion'];
                const randomItem = utilityItems[Math.floor(Math.random() * utilityItems.length)];
                lootMessages.push(`Discovered: ${ITEM_TEMPLATES[randomItem].name}`);
            }
        }
        
        return lootMessages;
    }
    
    // Applica conseguenze basate sul roll del giocatore
    static applyRollConsequences(
        character: Character, 
        action: string, 
        roll: number
    ): { success: boolean; consequences: string[]; rewards?: string[] } {
        const consequences: string[] = [];
        const rewards: string[] = [];
        
        // Roll molto alto (18-20)
        if (roll >= 18) {
            consequences.push('Exceptional success!');
            
            // Possibile loot bonus
            if (Math.random() < 0.4) {
                const bonusLoot = generateRandomLoot(character.level, 'common');
                bonusLoot.forEach(item => {
                    addItemToInventory(character, item);
                    rewards.push(`Bonus loot: ${item.name}`);
                });
            }
            
            // Possibile healing
            if (character.hp < character.maxHp && Math.random() < 0.3) {
                const healing = performHealing(character, Math.floor(character.maxHp * 0.1));
                if (healing > 0) {
                    consequences.push(`Recovered ${healing} HP from success`);
                }
            }
            
            return { success: true, consequences, rewards };
        }
        
        // Roll alto (15-17)
        else if (roll >= 15) {
            consequences.push('Strong success!');
            return { success: true, consequences, rewards };
        }
        
        // Roll medio (10-14)
        else if (roll >= 10) {
            consequences.push('Partial success with complications');
            return { success: true, consequences, rewards };
        }
        
        // Roll basso (6-9)
        else if (roll >= 6) {
            consequences.push('Failure with minor consequences');
            
            // Possibile danno minimo
            if (Math.random() < 0.3) {
                const damage = Math.min(3, Math.floor(character.maxHp * 0.1));
                character.hp = Math.max(0, character.hp - damage);
                consequences.push(`Took ${damage} damage from failure`);
            }
            
            return { success: false, consequences, rewards };
        }
        
        // Roll molto basso (1-5)
        else {
            consequences.push('Critical failure!');
            
            // Conseguenze serie
            const damage = Math.min(5, Math.floor(character.maxHp * 0.15));
            character.hp = Math.max(0, character.hp - damage);
            consequences.push(`Took ${damage} damage from critical failure`);
            
            // Possibile perdita di oggetto non importante
            if (Math.random() < 0.2) {
                const nonEssentialItems = character.inventory.filter(item => 
                    !item.tags.includes('equipped') && 
                    item.rarity === 'common' &&
                    item.type !== 'weapon' &&
                    item.type !== 'armor'
                );
                
                if (nonEssentialItems.length > 0) {
                    const lostItem = nonEssentialItems[Math.floor(Math.random() * nonEssentialItems.length)];
                    character.inventory = character.inventory.filter(item => item.id !== lostItem.id);
                    consequences.push(`Lost ${lostItem.name} in the chaos`);
                }
            }
            
            return { success: false, consequences, rewards };
        }
    }
    
    // Sistema di rest automatico
    static performRest(character: Character, restType: 'short' | 'long'): string[] {
        if (restType === 'short') {
            return shortRest(character);
        } else {
            return longRest(character);
        }
    }
    
    // Controlla se il personaggio può level up
    static checkLevelUp(character: Character, currentScene: number): boolean {
        // Level up ogni 5 scene per semplicità
        const expectedLevel = Math.floor(currentScene / 5) + 1;
        return character.level < expectedLevel && character.level < 10;
    }
    
    // Auto-level up se appropriato
    static autoLevelUp(character: Character, currentScene: number): string[] {
        if (this.checkLevelUp(character, currentScene)) {
            return levelUpCharacter(character);
        }
        return [];
    }
    
    // Suggerisce azioni basate sulla situazione
    static suggestActions(
        character: Character, 
        scene: Scene,
        situationType: 'combat' | 'exploration' | 'social'
    ): string[] {
        const suggestions: string[] = [];
        
        // Azioni sempre disponibili
        if (character.hp < character.maxHp * 0.5) {
            suggestions.push('Use healing potion');
            suggestions.push('Take defensive stance');
        }
        
        if (situationType === 'combat') {
            suggestions.push('Attack with weapon');
            
            // Suggerisci incantesimi se applicabile
            if (['wizard', 'sorcerer', 'cleric'].includes(character.klass.toLowerCase())) {
                suggestions.push('Cast a spell');
            }
            
            // Suggerisci abilità di classe
            const classAbilities = CLASS_ABILITIES[character.klass] || [];
            const usableAbilities = classAbilities.filter(ability => 
                character.level >= ability.level &&
                (!ability.uses || ability.uses.current > 0)
            );
            
            usableAbilities.forEach(ability => {
                suggestions.push(`Use ${ability.name}`);
            });
        }
        
        if (situationType === 'exploration') {
            suggestions.push('Search the area carefully');
            suggestions.push('Check for traps');
            suggestions.push('Look for hidden passages');
        }
        
        if (situationType === 'social') {
            suggestions.push('Try to persuade');
            suggestions.push('Attempt deception');
            suggestions.push('Use intimidation');
            suggestions.push('Show insight');
        }
        
        return suggestions;
    }
    
    // Calcola statistiche di combattimento per display
    static getCharacterCombatInfo(character: Character): {
        stats: ReturnType<typeof calculateCombatStats>;
        conditions: string[];
        actionEconomy: {
            canTakeAction: boolean;
            canTakeBonusAction: boolean;
            canTakeReaction: boolean;
        };
    } {
        const stats = calculateCombatStats(character);
        
        // Per ora, nessuna condizione attiva (da implementare sistema condizioni persistenti)
        const conditions: string[] = [];
        
        return {
            stats,
            conditions,
            actionEconomy: {
                canTakeAction: true,
                canTakeBonusAction: true,
                canTakeReaction: true
            }
        };
    }
}

// Funzioni di utilità per l'interfaccia
export const formatCombatStats = (character: Character): string => {
    const stats = calculateCombatStats(character);
    return `AC: ${stats.armorClass} | Attack: +${stats.attackBonus} | Initiative: +${stats.initiative}`;
};

export const formatHealthStatus = (character: Character): string => {
    const percentage = (character.hp / character.maxHp) * 100;
    let status = 'Healthy';
    
    if (percentage <= 25) status = 'Critical';
    else if (percentage <= 50) status = 'Bloodied';
    else if (percentage <= 75) status = 'Wounded';
    
    return `${character.hp}/${character.maxHp} HP (${status})`;
};

export const getAvailableSpells = (character: Character): string[] => {
    const spells = Object.keys(SPELLS_DATABASE);
    
    // Filtra per classe (semplificato)
    const classSpells: Record<string, string[]> = {
        'wizard': ['fire_bolt', 'magic_missile', 'shield', 'fireball'],
        'cleric': ['healing_word'],
        'sorcerer': ['fire_bolt', 'magic_missile', 'fireball'],
        'bard': ['healing_word']
    };
    
    return classSpells[character.klass.toLowerCase()] || [];
};

export const getAvailableClassAbilities = (character: Character): string[] => {
    const abilities = CLASS_ABILITIES[character.klass] || [];
    return abilities
        .filter(ability => character.level >= ability.level)
        .map(ability => ability.name);
};