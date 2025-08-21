import { AbilityScores } from '../types';

export const calculateAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Simplified hit points calculation
export const calculateMaxHitPoints = (level: number, klass: string, conScore: number): number => {
    const conModifier = calculateAbilityModifier(conScore);
    const baseHp = {
        'Fighter': 10, 'Paladin': 10, 'Ranger': 10,
        'Barbarian': 12,
        'Rogue': 8, 'Bard': 8, 'Cleric': 8, 'Druid': 8, 'Monk': 8, 'Warlock': 8,
        'Wizard': 6, 'Sorcerer': 6,
    }[klass] || 8;
    return baseHp + conModifier + (level - 1) * (Math.floor(baseHp / 2) + 1 + conModifier);
};

// Preset scores based on class archetype
export const getPresetAbilityScores = (klass: string): AbilityScores => {
    const base = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    switch(klass) {
        case 'Fighter': case 'Barbarian': case 'Paladin':
            return { ...base, STR: 15, CON: 14, DEX: 13 };
        case 'Rogue': case 'Ranger': case 'Monk':
            return { ...base, DEX: 15, WIS: 14, STR: 13 };
        case 'Wizard': case 'Sorcerer': case 'Warlock':
            return { ...base, INT: 15, CON: 14, CHA: 13 };
        case 'Cleric': case 'Druid':
            return { ...base, WIS: 15, CON: 14, STR: 13 };
        case 'Bard':
            return { ...base, CHA: 15, DEX: 14, CON: 13 };
        default:
            return { STR: 12, DEX: 12, CON: 12, INT: 12, WIS: 12, CHA: 12 };
    }
};