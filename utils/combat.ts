import { Character, Item, AbilityScores } from '../types';

// Tipi per il sistema di combattimento
export interface CombatResult {
    damage: number;
    criticalHit: boolean;
    hit: boolean;
    attackRoll: number;
    damageRoll: number[];
    statusEffects?: StatusEffect[];
}

export interface StatusEffect {
    name: string;
    type: 'buff' | 'debuff' | 'condition';
    duration: number; // rounds
    effect: string;
    value?: number;
}

export interface SpellSlot {
    level: number;
    total: number;
    used: number;
}

export interface CombatStats {
    attackBonus: number;
    armorClass: number;
    initiative: number;
    spellAttackBonus?: number;
    spellSaveDC?: number;
}

// Calcolo modificatori di abilità
export const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
};

// Calcolo bonus di competenza basato sul livello
export const getProficiencyBonus = (level: number): number => {
    return Math.ceil(level / 4) + 1;
};

// Calcolo Classe Armatura
export const calculateArmorClass = (character: Character, armor?: Item): number => {
    let baseAC = 10 + getAbilityModifier(character.abilityScores.DEX);
    
    if (armor && armor.type === 'armor') {
        const armorAC = extractArmorClass(armor.description);
        if (armorAC > 0) {
            baseAC = armorAC;
            
            // Light armor: full Dex bonus
            // Medium armor: max +2 Dex bonus
            // Heavy armor: no Dex bonus
            if (armor.properties.includes('heavy')) {
                baseAC = armorAC; // No Dex bonus
            } else if (armor.properties.includes('medium')) {
                baseAC = armorAC + Math.min(2, getAbilityModifier(character.abilityScores.DEX));
            } else {
                baseAC = armorAC + getAbilityModifier(character.abilityScores.DEX);
            }
        }
    }
    
    // Aggiungi bonus da scudi
    const shield = character.inventory.find(item => item.type === 'armor' && item.properties.includes('shield'));
    if (shield) {
        baseAC += 2; // Bonus standard dello scudo
    }
    
    return baseAC;
};

// Estrae AC dalla descrizione dell'armatura
const extractArmorClass = (description: string): number => {
    const acMatch = description.match(/AC\s*(\d+)/i);
    return acMatch ? parseInt(acMatch[1]) : 0;
};

// Calcolo statistiche di combattimento
export const calculateCombatStats = (character: Character): CombatStats => {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const strMod = getAbilityModifier(character.abilityScores.STR);
    const dexMod = getAbilityModifier(character.abilityScores.DEX);
    const intMod = getAbilityModifier(character.abilityScores.INT);
    const wisMod = getAbilityModifier(character.abilityScores.WIS);
    const chaMod = getAbilityModifier(character.abilityScores.CHA);
    
    // Determina l'attributo per attacco spell basato sulla classe
    let spellcastingAbility = 0;
    const klass = character.klass.toLowerCase();
    if (['wizard', 'eldritch knight'].includes(klass)) {
        spellcastingAbility = intMod;
    } else if (['cleric', 'druid', 'ranger'].includes(klass)) {
        spellcastingAbility = wisMod;
    } else if (['bard', 'paladin', 'sorcerer', 'warlock'].includes(klass)) {
        spellcastingAbility = chaMod;
    }
    
    const armor = character.inventory.find(item => item.type === 'armor' && !item.properties.includes('shield'));
    
    return {
        attackBonus: Math.max(strMod, dexMod) + proficiencyBonus,
        armorClass: calculateArmorClass(character, armor),
        initiative: dexMod,
        spellAttackBonus: spellcastingAbility > 0 ? spellcastingAbility + proficiencyBonus : undefined,
        spellSaveDC: spellcastingAbility > 0 ? 8 + spellcastingAbility + proficiencyBonus : undefined
    };
};

// Sistema di attacco
export const performAttack = (
    attacker: Character, 
    defender: Character, 
    weapon?: Item,
    advantageType: 'advantage' | 'disadvantage' | 'normal' = 'normal'
): CombatResult => {
    const attackerStats = calculateCombatStats(attacker);
    const defenderStats = calculateCombatStats(defender);
    
    // Calcolo bonus di attacco
    let attackBonus = attackerStats.attackBonus;
    let damageBonus = getAbilityModifier(attacker.abilityScores.STR);
    
    if (weapon) {
        if (weapon.properties.includes('finesse')) {
            const dexMod = getAbilityModifier(attacker.abilityScores.DEX);
            const strMod = getAbilityModifier(attacker.abilityScores.STR);
            damageBonus = Math.max(dexMod, strMod);
        }
        
        // Weapon enhancement bonuses
        const enhancement = weapon.properties.find(p => p.startsWith('+'));
        if (enhancement) {
            const bonus = parseInt(enhancement.replace('+', ''));
            attackBonus += bonus;
            damageBonus += bonus;
        }
    }
    
    // Tiro di attacco
    let attackRoll = rollD20(advantageType);
    const totalAttackRoll = attackRoll + attackBonus;
    
    // Controllo critical hit (natural 20)
    const criticalHit = attackRoll === 20;
    const hit = totalAttackRoll >= defenderStats.armorClass || criticalHit;
    
    let damage = 0;
    let damageRoll: number[] = [];
    
    if (hit) {
        // Calcolo danni
        const weaponDamage = weapon ? parseWeaponDamage(weapon.description) : { dice: 1, sides: 4 }; // default unarmed
        
        let numDice = weaponDamage.dice;
        if (criticalHit) {
            numDice *= 2; // Raddoppia i dadi in caso di critico
        }
        
        for (let i = 0; i < numDice; i++) {
            const roll = rollDie(weaponDamage.sides);
            damageRoll.push(roll);
            damage += roll;
        }
        
        damage += damageBonus;
        
        // Minimum damage of 1
        if (damage < 1) damage = 1;
    }
    
    return {
        damage,
        criticalHit,
        hit,
        attackRoll: totalAttackRoll,
        damageRoll,
        statusEffects: weapon?.effects ? parseStatusEffects(weapon.effects) : undefined
    };
};

// Parse weapon damage from description (e.g., "1d8 slashing")
const parseWeaponDamage = (description: string): { dice: number; sides: number } => {
    const match = description.match(/(\d+)d(\d+)/);
    if (match) {
        return { dice: parseInt(match[1]), sides: parseInt(match[2]) };
    }
    return { dice: 1, sides: 4 }; // fallback
};

// Parse status effects from item effects
const parseStatusEffects = (effects: string): StatusEffect[] => {
    const statusEffects: StatusEffect[] = [];
    
    if (effects.toLowerCase().includes('poison')) {
        statusEffects.push({
            name: 'Poisoned',
            type: 'debuff',
            duration: 3,
            effect: 'Disadvantage on attack rolls and ability checks'
        });
    }
    
    if (effects.toLowerCase().includes('fire')) {
        statusEffects.push({
            name: 'Burning',
            type: 'debuff',
            duration: 2,
            effect: 'Takes fire damage at start of turn',
            value: 1
        });
    }
    
    return statusEffects;
};

// Funzioni per i dadi
export const rollDie = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
};

export const rollD20 = (type: 'advantage' | 'disadvantage' | 'normal' = 'normal'): number => {
    const roll1 = rollDie(20);
    
    if (type === 'normal') return roll1;
    
    const roll2 = rollDie(20);
    
    if (type === 'advantage') return Math.max(roll1, roll2);
    return Math.min(roll1, roll2);
};

// Sistema di guarigione
export const performHealing = (target: Character, healAmount: number): number => {
    const oldHp = target.hp;
    target.hp = Math.min(target.hp + healAmount, target.maxHp);
    return target.hp - oldHp;
};

// Calcolo HP massimi al livello up
export const calculateMaxHP = (character: Character, hitDie: number): number => {
    const conModifier = getAbilityModifier(character.abilityScores.CON);
    const baseHP = hitDie + conModifier; // HP al 1° livello
    
    let totalHP = baseHP;
    
    // HP aggiuntivi per ogni livello successivo al primo
    for (let level = 2; level <= character.level; level++) {
        const levelHP = Math.floor(hitDie / 2) + 1 + conModifier; // Media del dado vita + CON mod
        totalHP += Math.max(1, levelHP); // Minimo 1 HP per livello
    }
    
    return totalHP;
};

// Sistema di controlli di abilità
export const performAbilityCheck = (
    character: Character, 
    ability: keyof AbilityScores, 
    dc: number, 
    proficient: boolean = false
): { success: boolean; roll: number; total: number } => {
    const roll = rollD20();
    const modifier = getAbilityModifier(character.abilityScores[ability]);
    const proficiencyBonus = proficient ? getProficiencyBonus(character.level) : 0;
    
    const total = roll + modifier + proficiencyBonus;
    const success = total >= dc;
    
    return { success, roll, total };
};

// Sistema di tiri salvezza
export const performSavingThrow = (
    character: Character, 
    ability: keyof AbilityScores, 
    dc: number,
    proficient: boolean = false
): { success: boolean; roll: number; total: number } => {
    return performAbilityCheck(character, ability, dc, proficient);
};