import { Character, AbilityScores } from '../types';
import { getAbilityModifier, getProficiencyBonus, rollD20, rollDie } from './combat';

// Interfacce per abilità e incantesimi
export interface Spell {
    id: string;
    name: string;
    level: number; // 0 = cantrip, 1-9 = spell levels
    school: SpellSchool;
    castingTime: string;
    range: string;
    components: string[];
    duration: string;
    description: string;
    damageType?: DamageType;
    damageDice?: string; // e.g., "3d6", "1d8+2"
    savingThrow?: keyof AbilityScores;
    saveDC?: number;
    attackRoll?: boolean;
    healingDice?: string;
    requirements?: string[];
    tags: string[];
}

export interface ClassAbility {
    id: string;
    name: string;
    description: string;
    level: number; // Livello minimo per sbloccare
    uses?: AbilityUses;
    effect: string; // Codice per l'effetto
    requirements?: string[];
    tags: string[];
}

export interface AbilityUses {
    max: number;
    current: number;
    rechargeType: 'short_rest' | 'long_rest' | 'turn' | 'none';
}

export type SpellSchool = 
    | 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment' 
    | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation';

export type DamageType = 
    | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning' 
    | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant' 
    | 'slashing' | 'thunder';

export interface SpellSlot {
    level: number;
    total: number;
    used: number;
}

export interface CasterProgression {
    spellsKnown: number;
    cantripsKnown: number;
    spellSlots: SpellSlot[];
}

// Database completo degli incantesimi D&D 5e SRD
export const SPELLS_DATABASE: Record<string, Spell> = {
    // === CANTRIP (LIVELLO 0) ===
    'acid_splash': {
        id: 'acid_splash',
        name: 'Acid Splash',
        level: 0,
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.',
        damageType: 'acid',
        damageDice: '1d6',
        savingThrow: 'DEX',
        tags: ['cantrip', 'damage', 'acid', 'area_small']
    },
    'chill_touch': {
        id: 'chill_touch',
        name: 'Chill Touch',
        level: 0,
        school: 'Necromancy',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave.',
        damageType: 'necrotic',
        damageDice: '1d8',
        attackRoll: true,
        tags: ['cantrip', 'damage', 'necrotic', 'debuff']
    },
    'eldritch_blast': {
        id: 'eldritch_blast',
        name: 'Eldritch Blast',
        level: 0,
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 force damage.',
        damageType: 'force',
        damageDice: '1d10',
        attackRoll: true,
        tags: ['cantrip', 'damage', 'force', 'warlock']
    },
    'fire_bolt': {
        id: 'fire_bolt',
        name: 'Fire Bolt',
        level: 0,
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.',
        damageType: 'fire',
        damageDice: '1d10',
        attackRoll: true,
        tags: ['cantrip', 'damage', 'fire']
    },
    'light': {
        id: 'light',
        name: 'Light',
        level: 0,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: ['V', 'M'],
        duration: '1 hour',
        description: 'You touch one object that is no larger than 10 feet in any dimension. Until the spell ends, the object sheds bright light in a 20-foot radius and dim light for an additional 20 feet.',
        tags: ['cantrip', 'utility', 'light']
    },
    'mage_hand': {
        id: 'mage_hand',
        name: 'Mage Hand',
        level: 0,
        school: 'Conjuration',
        castingTime: '1 action',
        range: '30 feet',
        components: ['V', 'S'],
        duration: '1 minute',
        description: 'A spectral, floating hand appears at a point you choose within range. The hand lasts for the duration or until you dismiss it as an action.',
        tags: ['cantrip', 'utility', 'manipulation']
    },
    'minor_illusion': {
        id: 'minor_illusion',
        name: 'Minor Illusion',
        level: 0,
        school: 'Illusion',
        castingTime: '1 action',
        range: '30 feet',
        components: ['S', 'M'],
        duration: '1 minute',
        description: 'You create a sound or an image of an object within range that lasts for the duration. The illusion also ends if you dismiss it as an action or cast this spell again.',
        tags: ['cantrip', 'utility', 'illusion', 'deception']
    },
    'prestidigitation': {
        id: 'prestidigitation',
        name: 'Prestidigitation',
        level: 0,
        school: 'Transmutation',
        castingTime: '1 action',
        range: '10 feet',
        components: ['V', 'S'],
        duration: 'Up to 1 hour',
        description: 'This spell is a minor magical trick that novice spellcasters use for practice. You create one of several minor effects within range.',
        tags: ['cantrip', 'utility', 'versatile']
    },
    'ray_of_frost': {
        id: 'ray_of_frost',
        name: 'Ray of Frost',
        level: 0,
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target.',
        damageType: 'cold',
        damageDice: '1d8',
        attackRoll: true,
        tags: ['cantrip', 'damage', 'cold', 'slow']
    },
    'sacred_flame': {
        id: 'sacred_flame',
        name: 'Sacred Flame',
        level: 0,
        school: 'Evocation',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage.',
        damageType: 'radiant',
        damageDice: '1d8',
        savingThrow: 'DEX',
        tags: ['cantrip', 'damage', 'radiant', 'cleric']
    },

    // === LIVELLO 1 ===
    'burning_hands': {
        id: 'burning_hands',
        name: 'Burning Hands',
        level: 1,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (15-foot cone)',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips.',
        damageType: 'fire',
        damageDice: '3d6',
        savingThrow: 'DEX',
        tags: ['damage', 'fire', 'area', 'cone']
    },
    'charm_person': {
        id: 'charm_person',
        name: 'Charm Person',
        level: 1,
        school: 'Enchantment',
        castingTime: '1 action',
        range: '30 feet',
        components: ['V', 'S'],
        duration: '1 hour',
        description: 'You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and it does so with advantage if you or your companions are fighting it.',
        savingThrow: 'WIS',
        tags: ['enchantment', 'charm', 'social']
    },
    'cure_wounds': {
        id: 'cure_wounds',
        name: 'Cure Wounds',
        level: 1,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Touch',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
        healingDice: '1d8',
        tags: ['healing', 'touch']
    },
    'detect_magic': {
        id: 'detect_magic',
        name: 'Detect Magic',
        level: 1,
        school: 'Divination',
        castingTime: '1 action',
        range: 'Self',
        components: ['V', 'S'],
        duration: 'Concentration, up to 10 minutes',
        description: 'For the duration, you sense the presence of magic within 30 feet of you.',
        tags: ['divination', 'detection', 'concentration']
    },
    'healing_word': {
        id: 'healing_word',
        name: 'Healing Word',
        level: 1,
        school: 'Evocation',
        castingTime: '1 bonus action',
        range: '60 feet',
        components: ['V'],
        duration: 'Instantaneous',
        description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier.',
        healingDice: '1d4',
        tags: ['healing', 'bonus_action', 'ranged']
    },
    'magic_missile': {
        id: 'magic_missile',
        name: 'Magic Missile',
        level: 1,
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target.',
        damageType: 'force',
        damageDice: '1d4+1',
        tags: ['damage', 'force', 'auto_hit', 'multiple']
    },
    'shield': {
        id: 'shield',
        name: 'Shield',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 reaction',
        range: 'Self',
        components: ['V', 'S'],
        duration: '1 round',
        description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack.',
        tags: ['protection', 'reaction', 'ac_bonus']
    },
    'sleep': {
        id: 'sleep',
        name: 'Sleep',
        level: 1,
        school: 'Enchantment',
        castingTime: '1 action',
        range: '90 feet',
        components: ['V', 'S', 'M'],
        duration: '1 minute',
        description: 'This spell sends creatures into a magical slumber. Roll 5d8; the total is how many hit points of creatures this spell can affect.',
        tags: ['enchantment', 'area', 'incapacitate']
    },
    'thunderwave': {
        id: 'thunderwave',
        name: 'Thunderwave',
        level: 1,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (15-foot cube)',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A wave of thunderous force sweeps out from you. Each creature in a 15-foot cube originating from you must make a Constitution saving throw.',
        damageType: 'thunder',
        damageDice: '2d8',
        savingThrow: 'CON',
        tags: ['damage', 'thunder', 'area', 'knockback']
    },

    // === LIVELLO 2 ===
    'acid_arrow': {
        id: 'acid_arrow',
        name: "Melf's Acid Arrow",
        level: 2,
        school: 'Evocation',
        castingTime: '1 action',
        range: '90 feet',
        components: ['V', 'S', 'M'],
        duration: 'Instantaneous',
        description: 'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target.',
        damageType: 'acid',
        damageDice: '4d4',
        attackRoll: true,
        tags: ['damage', 'acid', 'persistent']
    },
    'blur': {
        id: 'blur',
        name: 'Blur',
        level: 2,
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Self',
        components: ['V'],
        duration: 'Concentration, up to 1 minute',
        description: 'Your body becomes blurred, shifting and wavering to all who can see you. For the duration, any creature has disadvantage on attack rolls against you.',
        tags: ['illusion', 'protection', 'concentration', 'disadvantage']
    },
    'hold_person': {
        id: 'hold_person',
        name: 'Hold Person',
        level: 2,
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 minute',
        description: 'Choose a humanoid that you can see within range. The target must succeed on a Wisdom saving throw or be paralyzed for the duration.',
        savingThrow: 'WIS',
        tags: ['enchantment', 'paralysis', 'concentration', 'control']
    },
    'invisibility': {
        id: 'invisibility',
        name: 'Invisibility',
        level: 2,
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Touch',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 hour',
        description: 'A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target\'s person.',
        tags: ['illusion', 'stealth', 'concentration', 'buff']
    },
    'misty_step': {
        id: 'misty_step',
        name: 'Misty Step',
        level: 2,
        school: 'Conjuration',
        castingTime: '1 bonus action',
        range: 'Self',
        components: ['V'],
        duration: 'Instantaneous',
        description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space that you can see.',
        tags: ['conjuration', 'teleport', 'bonus_action', 'mobility']
    },
    'scorching_ray': {
        id: 'scorching_ray',
        name: 'Scorching Ray',
        level: 2,
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You create three rays of fire and hurl them at targets within range. You can hurl them at one target or several. Make a ranged spell attack for each ray.',
        damageType: 'fire',
        damageDice: '2d6',
        attackRoll: true,
        tags: ['damage', 'fire', 'multiple', 'rays']
    },
    'web': {
        id: 'web',
        name: 'Web',
        level: 2,
        school: 'Conjuration',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 hour',
        description: 'You conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube from that point for the duration.',
        savingThrow: 'DEX',
        tags: ['conjuration', 'area', 'restrain', 'concentration']
    },

    // === LIVELLO 3 ===
    'counterspell': {
        id: 'counterspell',
        name: 'Counterspell',
        level: 3,
        school: 'Abjuration',
        castingTime: '1 reaction',
        range: '60 feet',
        components: ['S'],
        duration: 'Instantaneous',
        description: 'You attempt to interrupt a creature in the process of casting a spell. If the creature is casting a spell of 3rd level or lower, its spell fails and has no effect.',
        tags: ['abjuration', 'reaction', 'counter', 'interrupt']
    },
    'dispel_magic': {
        id: 'dispel_magic',
        name: 'Dispel Magic',
        level: 3,
        school: 'Abjuration',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'Choose one creature, object, or magical effect within range. Any spell of 3rd level or lower on the target ends.',
        tags: ['abjuration', 'dispel', 'utility']
    },
    'fireball': {
        id: 'fireball',
        name: 'Fireball',
        level: 3,
        school: 'Evocation',
        castingTime: '1 action',
        range: '150 feet',
        components: ['V', 'S', 'M'],
        duration: 'Instantaneous',
        description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.',
        damageType: 'fire',
        damageDice: '8d6',
        savingThrow: 'DEX',
        tags: ['damage', 'fire', 'area', 'explosion']
    },
    'fly': {
        id: 'fly',
        name: 'Fly',
        level: 3,
        school: 'Transmutation',
        castingTime: '1 action',
        range: 'Touch',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 10 minutes',
        description: 'You touch a willing creature. The target gains a flying speed of 60 feet for the duration.',
        tags: ['transmutation', 'movement', 'fly', 'concentration']
    },
    'haste': {
        id: 'haste',
        name: 'Haste',
        level: 3,
        school: 'Transmutation',
        castingTime: '1 action',
        range: '30 feet',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 minute',
        description: 'Choose a willing creature that you can see within range. Until the spell ends, the target\'s speed is doubled, it gains a +2 bonus to AC, it has advantage on Dexterity saving throws, and it gains an additional action on each of its turns.',
        tags: ['transmutation', 'buff', 'concentration', 'speed']
    },
    'lightning_bolt': {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        level: 3,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (100-foot line)',
        components: ['V', 'S', 'M'],
        duration: 'Instantaneous',
        description: 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you in a direction you choose.',
        damageType: 'lightning',
        damageDice: '8d6',
        savingThrow: 'DEX',
        tags: ['damage', 'lightning', 'line', 'area']
    },

    // === LIVELLO 4 ===
    'greater_invisibility': {
        id: 'greater_invisibility',
        name: 'Greater Invisibility',
        level: 4,
        school: 'Illusion',
        castingTime: '1 action',
        range: 'Touch',
        components: ['V', 'S'],
        duration: 'Concentration, up to 1 minute',
        description: 'You or a creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target\'s person.',
        tags: ['illusion', 'stealth', 'concentration', 'buff', 'greater']
    },
    'ice_storm': {
        id: 'ice_storm',
        name: 'Ice Storm',
        level: 4,
        school: 'Evocation',
        castingTime: '1 action',
        range: '300 feet',
        components: ['V', 'S', 'M'],
        duration: 'Instantaneous',
        description: 'A hail of rock-hard ice pounds to the ground in a 20-foot-radius, 40-foot-high cylinder centered on a point within range.',
        damageType: 'bludgeoning',
        damageDice: '2d8',
        savingThrow: 'DEX',
        tags: ['damage', 'cold', 'bludgeoning', 'area', 'cylinder']
    },
    'polymorph': {
        id: 'polymorph',
        name: 'Polymorph',
        level: 4,
        school: 'Transmutation',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 hour',
        description: 'This spell transforms a creature that you can see within range into a new form. An unwilling creature must make a Wisdom saving throw to avoid the effect.',
        savingThrow: 'WIS',
        tags: ['transmutation', 'shapechange', 'concentration', 'control']
    },
    'wall_of_fire': {
        id: 'wall_of_fire',
        name: 'Wall of Fire',
        level: 4,
        school: 'Evocation',
        castingTime: '1 action',
        range: '120 feet',
        components: ['V', 'S', 'M'],
        duration: 'Concentration, up to 1 minute',
        description: 'You create a wall of fire on a solid surface within range. You can make the wall up to 60 feet long, 20 feet high, and 1 foot thick, or a ringed wall up to 20 feet in diameter, 20 feet high, and 1 foot thick.',
        damageType: 'fire',
        damageDice: '5d8',
        savingThrow: 'DEX',
        tags: ['damage', 'fire', 'area', 'wall', 'concentration']
    },

    // === LIVELLO 5 ===
    'cone_of_cold': {
        id: 'cone_of_cold',
        name: 'Cone of Cold',
        level: 5,
        school: 'Evocation',
        castingTime: '1 action',
        range: 'Self (60-foot cone)',
        components: ['V', 'S', 'M'],
        duration: 'Instantaneous',
        description: 'A blast of cold air erupts from your hands. Each creature in a 60-foot cone must make a Constitution saving throw.',
        damageType: 'cold',
        damageDice: '8d8',
        savingThrow: 'CON',
        tags: ['damage', 'cold', 'cone', 'area']
    },
    'dominate_person': {
        id: 'dominate_person',
        name: 'Dominate Person',
        level: 5,
        school: 'Enchantment',
        castingTime: '1 action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Concentration, up to 1 minute',
        description: 'You attempt to beguile a humanoid that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration.',
        savingThrow: 'WIS',
        tags: ['enchantment', 'dominate', 'concentration', 'control']
    },
    'teleport': {
        id: 'teleport',
        name: 'Teleport',
        level: 7,
        school: 'Conjuration',
        castingTime: '1 action',
        range: '10 feet',
        components: ['V'],
        duration: 'Instantaneous',
        description: 'This spell instantly transports you and up to eight willing creatures of your choice that you can see within range, or a single object that you can see within range, to a destination you select.',
        tags: ['conjuration', 'teleport', 'travel', 'group']
    }
};

// Database delle abilità di classe
export const CLASS_ABILITIES: Record<string, ClassAbility[]> = {
    'Fighter': [
        {
            id: 'second_wind',
            name: 'Second Wind',
            description: 'You have a limited well of stamina that you can draw on to protect yourself from harm. You can use a bonus action to regain 1d10 + your fighter level hit points.',
            level: 1,
            uses: { max: 1, current: 1, rechargeType: 'short_rest' },
            effect: 'healing:1d10+level',
            tags: ['healing', 'bonus_action', 'self']
        },
        {
            id: 'action_surge',
            name: 'Action Surge',
            description: 'You can push yourself beyond your normal limits for a moment. You can take one additional action on your turn.',
            level: 2,
            uses: { max: 1, current: 1, rechargeType: 'short_rest' },
            effect: 'extra_action',
            tags: ['action', 'combat']
        }
    ],
    'Rogue': [
        {
            id: 'sneak_attack',
            name: 'Sneak Attack',
            description: 'You know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal extra damage when you hit with a finesse or ranged weapon.',
            level: 1,
            effect: 'sneak_damage',
            tags: ['damage', 'stealth']
        },
        {
            id: 'cunning_action',
            name: 'Cunning Action',
            description: 'You can take a Dash, Disengage, or Hide action as a bonus action.',
            level: 2,
            effect: 'bonus_action_options',
            tags: ['bonus_action', 'mobility']
        }
    ],
    'Wizard': [
        {
            id: 'arcane_recovery',
            name: 'Arcane Recovery',
            description: 'You can regain some of your magical energy by studying your spellbook. Once per day during a short rest, you can choose expended spell slots to recover.',
            level: 1,
            uses: { max: 1, current: 1, rechargeType: 'long_rest' },
            effect: 'recover_spell_slots',
            tags: ['spell_slots', 'recovery']
        }
    ]
};

// Calcola slot incantesimi per livello
export const calculateSpellSlots = (characterClass: string, level: number): SpellSlot[] => {
    const slots: SpellSlot[] = [];
    
    // Full casters (Wizard, Sorcerer, etc.)
    if (['wizard', 'sorcerer', 'cleric', 'druid', 'bard'].includes(characterClass.toLowerCase())) {
        const spellSlotsTable = [
            [], // Level 0
            [2], // Level 1: 2 1st level slots
            [3], // Level 2: 3 1st level slots
            [4, 2], // Level 3: 4 1st, 2 2nd level slots
            [4, 3], // Level 4: 4 1st, 3 2nd level slots
            [4, 3, 2], // Level 5: 4 1st, 3 2nd, 2 3rd level slots
            [4, 3, 3], // Level 6
            [4, 3, 3, 1], // Level 7
            [4, 3, 3, 2], // Level 8
            [4, 3, 3, 3, 1], // Level 9
            [4, 3, 3, 3, 2] // Level 10
        ];
        
        const levelSlots = spellSlotsTable[Math.min(level, 10)] || [];
        levelSlots.forEach((total, index) => {
            if (total > 0) {
                slots.push({
                    level: index + 1,
                    total,
                    used: 0
                });
            }
        });
    }
    
    // Half casters (Paladin, Ranger)
    else if (['paladin', 'ranger'].includes(characterClass.toLowerCase()) && level >= 2) {
        const halfCasterLevel = Math.floor(level / 2);
        const spellSlotsTable = [
            [], // Level 0
            [2], // Level 1: 2 1st level slots
            [3], // Level 2: 3 1st level slots
            [3], // Level 3: 3 1st level slots
            [4, 2], // Level 4: 4 1st, 2 2nd level slots
            [4, 3] // Level 5: 4 1st, 3 2nd level slots
        ];
        
        const levelSlots = spellSlotsTable[Math.min(halfCasterLevel, 5)] || [];
        levelSlots.forEach((total, index) => {
            if (total > 0) {
                slots.push({
                    level: index + 1,
                    total,
                    used: 0
                });
            }
        });
    }
    
    return slots;
};

// Lancia un incantesimo
export const castSpell = (
    caster: Character, 
    spellId: string, 
    slotLevel: number, 
    target?: Character
): { success: boolean; message: string; damage?: number; healing?: number } => {
    const spell = SPELLS_DATABASE[spellId];
    if (!spell) {
        return { success: false, message: `Spell ${spellId} not found.` };
    }
    
    // Verifica slot incantesimo (per incantesimi non-cantrip)
    if (spell.level > 0) {
        // Qui andrebbe implementata la verifica degli slot
        // Per ora assumiamo che il cast sia sempre possibile
    }
    
    let result = { success: true, message: `Cast ${spell.name}!`, damage: 0, healing: 0 };
    
    // Applica effetti dell'incantesimo
    if (spell.damageDice && target) {
        const damage = calculateSpellDamage(spell.damageDice, slotLevel - spell.level);
        
        if (spell.attackRoll) {
            // Spell attack roll
            const spellAttackBonus = calculateSpellAttackBonus(caster);
            const attackRoll = rollD20() + spellAttackBonus;
            
            // Assumiamo AC 15 per il target
            if (attackRoll >= 15) {
                target.hp = Math.max(0, target.hp - damage);
                result.damage = damage;
                result.message += ` Hit for ${damage} ${spell.damageType} damage!`;
            } else {
                result.message += ` Missed!`;
            }
        } else if (spell.savingThrow) {
            // Saving throw
            const saveDC = calculateSpellSaveDC(caster);
            const saveRoll = rollD20() + getAbilityModifier(target.abilityScores[spell.savingThrow]);
            
            if (saveRoll >= saveDC) {
                // Save successful, half damage
                const halfDamage = Math.floor(damage / 2);
                target.hp = Math.max(0, target.hp - halfDamage);
                result.damage = halfDamage;
                result.message += ` Save successful! ${halfDamage} ${spell.damageType} damage.`;
            } else {
                // Save failed, full damage
                target.hp = Math.max(0, target.hp - damage);
                result.damage = damage;
                result.message += ` Save failed! ${damage} ${spell.damageType} damage!`;
            }
        }
    }
    
    if (spell.healingDice && target) {
        const healing = calculateSpellHealing(spell.healingDice, slotLevel - spell.level);
        target.hp = Math.min(target.maxHp, target.hp + healing);
        result.healing = healing;
        result.message += ` Healed for ${healing} HP!`;
    }
    
    return result;
};

// Calcola danno incantesimo
const calculateSpellDamage = (damageDice: string, upcasting: number = 0): number => {
    const match = damageDice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) return 0;
    
    let numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const bonus = parseInt(match[3]) || 0;
    
    // Upcasting: some spells get extra dice
    numDice += upcasting;
    
    let total = bonus;
    for (let i = 0; i < numDice; i++) {
        total += rollDie(dieSize);
    }
    
    return total;
};

// Calcola guarigione incantesimo
const calculateSpellHealing = (healingDice: string, upcasting: number = 0): number => {
    return calculateSpellDamage(healingDice, upcasting);
};

// Calcola bonus attacco incantesimo
const calculateSpellAttackBonus = (character: Character): number => {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const spellcastingAbility = getSpellcastingAbility(character);
    return getAbilityModifier(character.abilityScores[spellcastingAbility]) + proficiencyBonus;
};

// Calcola CD tiro salvezza incantesimo
const calculateSpellSaveDC = (character: Character): number => {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const spellcastingAbility = getSpellcastingAbility(character);
    return 8 + getAbilityModifier(character.abilityScores[spellcastingAbility]) + proficiencyBonus;
};

// Determina l'abilità di lancio incantesimi per classe
const getSpellcastingAbility = (character: Character): keyof AbilityScores => {
    const klass = character.klass.toLowerCase();
    
    if (['wizard', 'eldritch knight'].includes(klass)) {
        return 'INT';
    } else if (['cleric', 'druid', 'ranger'].includes(klass)) {
        return 'WIS';
    } else if (['bard', 'paladin', 'sorcerer', 'warlock'].includes(klass)) {
        return 'CHA';
    }
    
    return 'INT'; // fallback
};

// Usa un'abilità di classe
export const useClassAbility = (
    character: Character, 
    abilityId: string, 
    target?: Character
): { success: boolean; message: string; effect?: any } => {
    const classAbilities = CLASS_ABILITIES[character.klass] || [];
    const ability = classAbilities.find(ab => ab.id === abilityId);
    
    if (!ability) {
        return { success: false, message: `Ability ${abilityId} not found.` };
    }
    
    if (character.level < ability.level) {
        return { success: false, message: `Not high enough level for ${ability.name}.` };
    }
    
    if (ability.uses && ability.uses.current <= 0) {
        return { success: false, message: `No uses of ${ability.name} remaining.` };
    }
    
    // Applica l'effetto dell'abilità
    const effectResult = applyAbilityEffect(character, ability, target);
    
    // Diminuisce gli usi
    if (ability.uses) {
        ability.uses.current--;
    }
    
    return {
        success: true,
        message: `Used ${ability.name}! ${effectResult.message}`,
        effect: effectResult
    };
};

// Applica l'effetto di un'abilità
const applyAbilityEffect = (character: Character, ability: ClassAbility, target?: Character) => {
    const effect = ability.effect.toLowerCase();
    
    if (effect.includes('healing:')) {
        const healingMatch = effect.match(/healing:(\d*)d(\d+)(?:\+(\w+))?/);
        if (healingMatch) {
            const dice = parseInt(healingMatch[1]) || 1;
            const sides = parseInt(healingMatch[2]);
            const bonusType = healingMatch[3];
            
            let bonus = 0;
            if (bonusType === 'level') {
                bonus = character.level;
            }
            
            let healAmount = bonus;
            for (let i = 0; i < dice; i++) {
                healAmount += rollDie(sides);
            }
            
            const oldHp = character.hp;
            character.hp = Math.min(character.hp + healAmount, character.maxHp);
            
            return { 
                message: `Healed for ${character.hp - oldHp} HP.`, 
                healing: character.hp - oldHp 
            };
        }
    }
    
    if (effect === 'extra_action') {
        return { 
            message: 'Gain an extra action this turn!', 
            extraAction: true 
        };
    }
    
    if (effect === 'sneak_damage') {
        const sneakDice = Math.ceil(character.level / 2); // 1d6 per 2 livelli
        let sneakDamage = 0;
        for (let i = 0; i < sneakDice; i++) {
            sneakDamage += rollDie(6);
        }
        
        return { 
            message: `+${sneakDamage} sneak attack damage!`, 
            bonusDamage: sneakDamage 
        };
    }
    
    return { message: 'Effect applied.' };
};

// Riposo breve - ricarica abilità
export const shortRest = (character: Character): string[] => {
    const messages: string[] = [];
    
    // Ricarica abilità con recharge "short_rest"
    const classAbilities = CLASS_ABILITIES[character.klass] || [];
    classAbilities.forEach(ability => {
        if (ability.uses && ability.uses.rechargeType === 'short_rest') {
            ability.uses.current = ability.uses.max;
            messages.push(`Recharged ${ability.name}`);
        }
    });
    
    // Recupera HP (1 Hit Die)
    const hitDie = getClassHitDie(character.klass);
    const healAmount = rollDie(hitDie) + getAbilityModifier(character.abilityScores.CON);
    const actualHeal = Math.min(healAmount, character.maxHp - character.hp);
    character.hp += actualHeal;
    
    if (actualHeal > 0) {
        messages.push(`Recovered ${actualHeal} HP from Hit Die`);
    }
    
    return messages;
};

// Riposo lungo - ricarica tutto
export const longRest = (character: Character): string[] => {
    const messages: string[] = [];
    
    // Recupera tutti gli HP
    const oldHp = character.hp;
    character.hp = character.maxHp;
    messages.push(`Recovered ${character.hp - oldHp} HP`);
    
    // Ricarica tutte le abilità
    const classAbilities = CLASS_ABILITIES[character.klass] || [];
    classAbilities.forEach(ability => {
        if (ability.uses) {
            ability.uses.current = ability.uses.max;
            messages.push(`Recharged ${ability.name}`);
        }
    });
    
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