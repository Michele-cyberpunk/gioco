import { Character, AbilityScores } from '../types';
import { getAbilityModifier, getProficiencyBonus, rollD20, rollDie } from './combat';

// Interfacce per le meccaniche di gioco
export interface SkillCheck {
    skill: SkillName;
    ability: keyof AbilityScores;
    proficient: boolean;
    description: string;
}

export interface Condition {
    name: string;
    description: string;
    effects: string[];
    duration?: number; // in rounds, -1 for permanent until removed
}

export type SkillName = 
    | 'Acrobatics' | 'Animal Handling' | 'Arcana' | 'Athletics' | 'Deception'
    | 'History' | 'Insight' | 'Intimidation' | 'Investigation' | 'Medicine'
    | 'Nature' | 'Perception' | 'Performance' | 'Persuasion' | 'Religion'
    | 'Sleight of Hand' | 'Stealth' | 'Survival';

export type AdvantageType = 'advantage' | 'disadvantage' | 'normal';

// Mapping delle skill alle abilità
export const SKILL_ABILITY_MAP: Record<SkillName, keyof AbilityScores> = {
    'Athletics': 'STR',
    'Acrobatics': 'DEX',
    'Sleight of Hand': 'DEX',
    'Stealth': 'DEX',
    'Arcana': 'INT',
    'History': 'INT',
    'Investigation': 'INT',
    'Nature': 'INT',
    'Religion': 'INT',
    'Animal Handling': 'WIS',
    'Insight': 'WIS',
    'Medicine': 'WIS',
    'Perception': 'WIS',
    'Survival': 'WIS',
    'Deception': 'CHA',
    'Intimidation': 'CHA',
    'Performance': 'CHA',
    'Persuasion': 'CHA'
};

// Condizioni di gioco standard
export const CONDITIONS: Record<string, Condition> = {
    'blinded': {
        name: 'Blinded',
        description: 'A blinded creature cannot see and automatically fails any ability check that requires sight.',
        effects: ['attacks_disadvantage', 'target_attacks_advantage', 'sight_checks_fail']
    },
    'charmed': {
        name: 'Charmed',
        description: 'A charmed creature cannot attack the charmer or target the charmer with harmful abilities or magical effects.',
        effects: ['cannot_attack_charmer', 'charmer_advantage_social']
    },
    'deafened': {
        name: 'Deafened',
        description: 'A deafened creature cannot hear and automatically fails any ability check that requires hearing.',
        effects: ['hearing_checks_fail']
    },
    'frightened': {
        name: 'Frightened',
        description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
        effects: ['attacks_disadvantage', 'ability_checks_disadvantage']
    },
    'grappled': {
        name: 'Grappled',
        description: 'A grappled creature\'s speed becomes 0, and it cannot benefit from any bonus to its speed.',
        effects: ['speed_zero', 'no_speed_bonus']
    },
    'incapacitated': {
        name: 'Incapacitated',
        description: 'An incapacitated creature cannot take actions or reactions.',
        effects: ['no_actions', 'no_reactions']
    },
    'invisible': {
        name: 'Invisible',
        description: 'An invisible creature is impossible to see without the aid of magic or a special sense.',
        effects: ['attacks_advantage', 'target_attacks_disadvantage', 'hide_anywhere']
    },
    'paralyzed': {
        name: 'Paralyzed',
        description: 'A paralyzed creature is incapacitated and cannot move or speak.',
        effects: ['incapacitated', 'cannot_move', 'cannot_speak', 'auto_fail_str_dex_saves', 'melee_crits']
    },
    'poisoned': {
        name: 'Poisoned',
        description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
        effects: ['attacks_disadvantage', 'ability_checks_disadvantage']
    },
    'prone': {
        name: 'Prone',
        description: 'A prone creature\'s only movement option is to crawl, unless it stands up.',
        effects: ['attacks_disadvantage', 'melee_target_advantage', 'ranged_target_disadvantage', 'crawl_movement']
    },
    'restrained': {
        name: 'Restrained',
        description: 'A restrained creature\'s speed becomes 0, and it cannot benefit from any bonus to its speed.',
        effects: ['speed_zero', 'attacks_disadvantage', 'dex_saves_disadvantage', 'target_attacks_advantage']
    },
    'stunned': {
        name: 'Stunned',
        description: 'A stunned creature is incapacitated, cannot move, and can speak only falteringly.',
        effects: ['incapacitated', 'cannot_move', 'speak_falteringly', 'auto_fail_str_dex_saves']
    },
    'unconscious': {
        name: 'Unconscious',
        description: 'An unconscious creature is incapacitated, cannot move or speak, and is unaware of its surroundings.',
        effects: ['incapacitated', 'cannot_move', 'cannot_speak', 'unaware', 'prone', 'auto_fail_str_dex_saves', 'melee_crits']
    }
};

// Classi di difficoltà standard
export const DIFFICULTY_CLASSES = {
    VERY_EASY: 5,
    EASY: 10,
    MEDIUM: 15,
    HARD: 20,
    VERY_HARD: 25,
    NEARLY_IMPOSSIBLE: 30
} as const;

// Esegui controllo di abilità
export const performSkillCheck = (
    character: Character,
    skill: SkillName,
    dc: number,
    advantageType: AdvantageType = 'normal',
    expertise: boolean = false
): { success: boolean; roll: number; total: number; details: string } => {
    const ability = SKILL_ABILITY_MAP[skill];
    const abilityModifier = getAbilityModifier(character.abilityScores[ability]);
    
    // Determina se il personaggio è competente in questa skill
    const proficient = isSkillProficient(character, skill);
    const proficiencyBonus = proficient ? getProficiencyBonus(character.level) : 0;
    
    // Expertise raddoppia il bonus di competenza
    const expertiseBonus = expertise && proficient ? proficiencyBonus : 0;
    
    const roll = rollD20(advantageType);
    const total = roll + abilityModifier + proficiencyBonus + expertiseBonus;
    const success = total >= dc;
    
    const details = `${skill} (${ability}): ${roll} + ${abilityModifier + proficiencyBonus + expertiseBonus} = ${total} vs DC ${dc}`;
    
    return { success, roll, total, details };
};

// Controlla se un personaggio è competente in una skill
const isSkillProficient = (character: Character, skill: SkillName): boolean => {
    // Questa funzione dovrebbe controllare le competenze del personaggio
    // Per ora, assumiamo alcune competenze basate sulla classe
    const classProficiencies: Record<string, SkillName[]> = {
        'Fighter': ['Athletics', 'Intimidation'],
        'Rogue': ['Stealth', 'Sleight of Hand', 'Acrobatics', 'Deception'],
        'Wizard': ['Arcana', 'History', 'Investigation', 'Religion'],
        'Cleric': ['History', 'Medicine', 'Persuasion', 'Religion'],
        'Ranger': ['Animal Handling', 'Athletics', 'Insight', 'Nature', 'Perception', 'Stealth', 'Survival']
    };
    
    const proficiencies = classProficiencies[character.klass] || [];
    return proficiencies.includes(skill);
};

// Sistema di livellamento
export const levelUpCharacter = (character: Character): string[] => {
    const messages: string[] = [];
    const oldLevel = character.level;
    character.level++;
    
    messages.push(`Level up! Now level ${character.level}`);
    
    // Aumenta HP
    const hitDie = getClassHitDie(character.klass);
    const conModifier = getAbilityModifier(character.abilityScores.CON);
    const hpGain = Math.max(1, rollDie(hitDie) + conModifier);
    
    character.maxHp += hpGain;
    character.hp += hpGain;
    
    messages.push(`Gained ${hpGain} hit points (total: ${character.maxHp})`);
    
    // Possibili miglioramenti delle abilità ogni 4 livelli
    if (character.level % 4 === 0) {
        messages.push('You can increase your ability scores!');
    }
    
    return messages;
};

// Ottieni Hit Die per classe
const getClassHitDie = (className: string): number => {
    const hitDice: Record<string, number> = {
        'barbarian': 12,
        'fighter': 10,
        'paladin': 10,
        'ranger': 10,
        'bard': 8,
        'cleric': 8,
        'druid': 8,
        'monk': 8,
        'rogue': 8,
        'warlock': 8,
        'sorcerer': 6,
        'wizard': 6
    };
    
    return hitDice[className.toLowerCase()] || 8;
};

// Calcola modificatore di iniziativa
export const getInitiativeModifier = (character: Character): number => {
    return getAbilityModifier(character.abilityScores.DEX);
};

// Tiro iniziativa
export const rollInitiative = (character: Character): number => {
    return rollD20() + getInitiativeModifier(character);
};

// Sistema di ispirazione
export const grantInspiration = (character: Character): string => {
    // L'ispirazione in D&D 5e permette di rilanciare un dado
    // Qui potremmo tracciare se un personaggio ha ispirazione
    return `${character.name} gains inspiration!`;
};

// Controllo morte
export const deathSavingThrow = (character: Character): { 
    result: 'success' | 'failure' | 'critical_success' | 'critical_failure';
    roll: number;
    message: string;
} => {
    const roll = rollD20();
    
    if (roll === 20) {
        character.hp = 1; // Critical success: regain 1 HP
        return {
            result: 'critical_success',
            roll,
            message: `${character.name} rolled a natural 20! Regains 1 hit point!`
        };
    } else if (roll === 1) {
        return {
            result: 'critical_failure',
            roll,
            message: `${character.name} rolled a natural 1! Counts as two failures!`
        };
    } else if (roll >= 10) {
        return {
            result: 'success',
            roll,
            message: `${character.name} succeeds on death saving throw.`
        };
    } else {
        return {
            result: 'failure',
            roll,
            message: `${character.name} fails death saving throw.`
        };
    }
};

// Controllo concentrazione
export const concentrationCheck = (character: Character, damage: number): boolean => {
    const dc = Math.max(10, Math.floor(damage / 2));
    const conModifier = getAbilityModifier(character.abilityScores.CON);
    const proficiencyBonus = getProficiencyBonus(character.level);
    
    // Assumiamo competenza in Constitution saves per caster
    const bonus = ['wizard', 'sorcerer', 'cleric', 'druid', 'bard'].includes(character.klass.toLowerCase()) 
        ? conModifier + proficiencyBonus 
        : conModifier;
    
    const roll = rollD20();
    const total = roll + bonus;
    
    return total >= dc;
};

// Sistema di vantaggio/svantaggio per condizioni
export const getAdvantageFromConditions = (
    character: Character,
    conditions: string[],
    checkType: 'attack' | 'ability_check' | 'saving_throw'
): AdvantageType => {
    let advantage = 0; // +1 for advantage, -1 for disadvantage
    
    conditions.forEach(condition => {
        const conditionData = CONDITIONS[condition.toLowerCase()];
        if (conditionData) {
            if (checkType === 'attack' && conditionData.effects.includes('attacks_advantage')) {
                advantage += 1;
            }
            if (checkType === 'attack' && conditionData.effects.includes('attacks_disadvantage')) {
                advantage -= 1;
            }
            if (checkType === 'ability_check' && conditionData.effects.includes('ability_checks_disadvantage')) {
                advantage -= 1;
            }
        }
    });
    
    // Vantaggio e svantaggio si annullano
    if (advantage > 0) return 'advantage';
    if (advantage < 0) return 'disadvantage';
    return 'normal';
};

// Calcolo peso trasportabile
export const getCarryingCapacity = (character: Character): { 
    normal: number; 
    pushDragLift: number; 
    encumbered: number; 
    heavilyEncumbered: number; 
} => {
    const strength = character.abilityScores.STR;
    const normal = strength * 7; // ~15 lbs converted to kg
    
    return {
        normal,
        pushDragLift: normal * 2,
        encumbered: normal * 0.67, // 2/3 of normal
        heavilyEncumbered: normal * 0.33 // 1/3 of normal
    };
};

// Calcola velocità di movimento
export const getMovementSpeed = (character: Character, conditions: string[] = []): number => {
    let baseSpeed = 30; // feet, default human speed
    
    // Modifica per razza
    const race = character.race.toLowerCase();
    if (['elf', 'human', 'dragonborn'].includes(race)) {
        baseSpeed = 30;
    } else if (['dwarf', 'halfling', 'gnome'].includes(race)) {
        baseSpeed = 25;
    }
    
    // Controlla condizioni che limitano il movimento
    conditions.forEach(condition => {
        const conditionData = CONDITIONS[condition.toLowerCase()];
        if (conditionData && conditionData.effects.includes('speed_zero')) {
            baseSpeed = 0;
        }
    });
    
    return baseSpeed;
};

// Verifica se un'azione è possibile date le condizioni
export const canTakeAction = (character: Character, conditions: string[], actionType: 'action' | 'bonus_action' | 'reaction'): boolean => {
    return !conditions.some(condition => {
        const conditionData = CONDITIONS[condition.toLowerCase()];
        return conditionData && (
            conditionData.effects.includes('no_actions') ||
            (actionType === 'reaction' && conditionData.effects.includes('no_reactions'))
        );
    });
};

// Sistema di criteri di sfida (CR) per nemici
export const calculateChallengeRating = (
    hp: number,
    ac: number,
    damage: number,
    toHit: number,
    saveDC?: number
): number => {
    // Calcolo semplificato del CR basato su HP, AC e danno
    const defensiveCR = getCRFromHP(hp, ac);
    const offensiveCR = getCRFromDamage(damage, toHit, saveDC);
    
    return Math.round((defensiveCR + offensiveCR) / 2);
};

const getCRFromHP = (hp: number, ac: number): number => {
    // Tabella semplificata HP/AC -> CR
    let baseCR = 0;
    
    if (hp <= 6) baseCR = 0;
    else if (hp <= 35) baseCR = 0.125;
    else if (hp <= 49) baseCR = 0.25;
    else if (hp <= 70) baseCR = 0.5;
    else if (hp <= 85) baseCR = 1;
    else if (hp <= 100) baseCR = 2;
    else if (hp <= 115) baseCR = 3;
    else if (hp <= 130) baseCR = 4;
    else baseCR = 5;
    
    // Modifica per AC alta/bassa
    if (ac >= 17) baseCR += 1;
    else if (ac <= 13) baseCR -= 1;
    
    return Math.max(0, baseCR);
};

const getCRFromDamage = (damage: number, toHit: number, saveDC?: number): number => {
    let baseCR = 0;
    
    if (damage <= 3) baseCR = 0;
    else if (damage <= 5) baseCR = 0.125;
    else if (damage <= 8) baseCR = 0.25;
    else if (damage <= 14) baseCR = 0.5;
    else if (damage <= 20) baseCR = 1;
    else if (damage <= 26) baseCR = 2;
    else if (damage <= 32) baseCR = 3;
    else baseCR = 4;
    
    // Modifica per bonus attacco alto/basso
    const expectedToHit = 3 + baseCR * 2;
    if (toHit >= expectedToHit + 2) baseCR += 1;
    else if (toHit <= expectedToHit - 2) baseCR -= 1;
    
    return Math.max(0, baseCR);
};