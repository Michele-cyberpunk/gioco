import { Item, Character, ItemType, Rarity, AcquisitionMethod } from '../types';

// Interfacce per la gestione inventario
export interface InventoryOperationResult {
    success: boolean;
    message: string;
    item?: Item;
}

export interface ItemTemplate {
    name: string;
    type: ItemType;
    rarity: Rarity;
    properties: string[];
    weight: number;
    value: number;
    description: string;
    effects: string;
    tags: string[];
}

// Database completo di template oggetti D&D 5e SRD
export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
    // === ARMI SEMPLICI DA MISCHIA ===
    'club': {
        name: 'Club',
        type: 'weapon',
        rarity: 'common',
        properties: ['light', 'simple'],
        weight: 0.9,
        value: 0.1,
        description: '1d4 bludgeoning damage',
        effects: '',
        tags: ['melee', 'simple', 'light']
    },
    'dagger': {
        name: 'Dagger',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'light', 'thrown', 'simple'],
        weight: 0.5,
        value: 2,
        description: '1d4 piercing damage. Range 20/60 feet when thrown',
        effects: '',
        tags: ['melee', 'ranged', 'finesse', 'thrown']
    },
    'handaxe': {
        name: 'Handaxe',
        type: 'weapon',
        rarity: 'common',
        properties: ['light', 'thrown', 'simple'],
        weight: 0.9,
        value: 5,
        description: '1d6 slashing damage. Range 20/60 feet when thrown',
        effects: '',
        tags: ['melee', 'thrown', 'axe']
    },
    'javelin': {
        name: 'Javelin',
        type: 'weapon',
        rarity: 'common',
        properties: ['thrown', 'simple'],
        weight: 0.9,
        value: 0.5,
        description: '1d6 piercing damage. Range 30/120 feet',
        effects: '',
        tags: ['melee', 'thrown', 'spear']
    },
    'mace': {
        name: 'Mace',
        type: 'weapon',
        rarity: 'common',
        properties: ['simple'],
        weight: 1.8,
        value: 5,
        description: '1d6 bludgeoning damage',
        effects: '',
        tags: ['melee', 'bludgeoning']
    },
    'quarterstaff': {
        name: 'Quarterstaff',
        type: 'weapon',
        rarity: 'common',
        properties: ['versatile', 'simple'],
        weight: 1.8,
        value: 0.2,
        description: '1d6 bludgeoning damage (1d8 when used with two hands)',
        effects: '',
        tags: ['melee', 'versatile', 'staff']
    },
    'spear': {
        name: 'Spear',
        type: 'weapon',
        rarity: 'common',
        properties: ['thrown', 'versatile', 'simple'],
        weight: 1.4,
        value: 1,
        description: '1d6 piercing damage (1d8 when used with two hands). Range 20/60 feet when thrown',
        effects: '',
        tags: ['melee', 'thrown', 'versatile', 'spear']
    },

    // === ARMI SEMPLICI A DISTANZA ===
    'crossbow_light': {
        name: 'Light Crossbow',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'loading', 'two_handed', 'simple'],
        weight: 2.3,
        value: 25,
        description: '1d8 piercing damage. Range 80/320 feet',
        effects: '',
        tags: ['ranged', 'crossbow', 'two_handed']
    },
    'dart': {
        name: 'Dart',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'thrown', 'simple'],
        weight: 0.1,
        value: 0.05,
        description: '1d4 piercing damage. Range 20/60 feet',
        effects: '',
        tags: ['ranged', 'thrown', 'finesse']
    },
    'shortbow': {
        name: 'Shortbow',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'two_handed', 'simple'],
        weight: 0.9,
        value: 25,
        description: '1d6 piercing damage. Range 80/320 feet',
        effects: '',
        tags: ['ranged', 'bow', 'two_handed']
    },
    'sling': {
        name: 'Sling',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'simple'],
        weight: 0,
        value: 0.1,
        description: '1d4 bludgeoning damage. Range 30/120 feet',
        effects: '',
        tags: ['ranged', 'sling']
    },

    // === ARMI MARZIALI DA MISCHIA ===
    'battleaxe': {
        name: 'Battleaxe',
        type: 'weapon',
        rarity: 'common',
        properties: ['versatile', 'martial'],
        weight: 1.8,
        value: 10,
        description: '1d8 slashing damage (1d10 when used with two hands)',
        effects: '',
        tags: ['melee', 'axe', 'versatile']
    },
    'flail': {
        name: 'Flail',
        type: 'weapon',
        rarity: 'common',
        properties: ['martial'],
        weight: 0.9,
        value: 10,
        description: '1d8 bludgeoning damage',
        effects: '',
        tags: ['melee', 'bludgeoning', 'chain']
    },
    'glaive': {
        name: 'Glaive',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'reach', 'two_handed', 'martial'],
        weight: 2.7,
        value: 20,
        description: '1d10 slashing damage. Reach 10 feet',
        effects: '',
        tags: ['melee', 'polearm', 'reach', 'two_handed']
    },
    'greataxe': {
        name: 'Greataxe',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'two_handed', 'martial'],
        weight: 3.2,
        value: 30,
        description: '1d12 slashing damage',
        effects: '',
        tags: ['melee', 'axe', 'two_handed', 'heavy']
    },
    'greatsword': {
        name: 'Greatsword',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'two_handed', 'martial'],
        weight: 2.7,
        value: 50,
        description: '2d6 slashing damage',
        effects: '',
        tags: ['melee', 'sword', 'two_handed', 'heavy']
    },
    'halberd': {
        name: 'Halberd',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'reach', 'two_handed', 'martial'],
        weight: 2.7,
        value: 20,
        description: '1d10 slashing damage. Reach 10 feet',
        effects: '',
        tags: ['melee', 'polearm', 'reach', 'two_handed']
    },
    'lance': {
        name: 'Lance',
        type: 'weapon',
        rarity: 'common',
        properties: ['reach', 'special', 'martial'],
        weight: 2.7,
        value: 10,
        description: '1d12 piercing damage. Reach 10 feet. Special: disadvantage when attacking targets within 5 feet unless mounted',
        effects: '',
        tags: ['melee', 'spear', 'reach', 'mounted']
    },
    'longsword': {
        name: 'Longsword',
        type: 'weapon',
        rarity: 'common',
        properties: ['versatile', 'martial'],
        weight: 1.4,
        value: 15,
        description: '1d8 slashing damage (1d10 when used with two hands)',
        effects: '',
        tags: ['melee', 'sword', 'versatile']
    },
    'maul': {
        name: 'Maul',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'two_handed', 'martial'],
        weight: 4.5,
        value: 10,
        description: '2d6 bludgeoning damage',
        effects: '',
        tags: ['melee', 'bludgeoning', 'two_handed', 'heavy']
    },
    'morningstar': {
        name: 'Morningstar',
        type: 'weapon',
        rarity: 'common',
        properties: ['martial'],
        weight: 1.8,
        value: 15,
        description: '1d8 piercing damage',
        effects: '',
        tags: ['melee', 'piercing', 'spiked']
    },
    'pike': {
        name: 'Pike',
        type: 'weapon',
        rarity: 'common',
        properties: ['heavy', 'reach', 'two_handed', 'martial'],
        weight: 8.2,
        value: 5,
        description: '1d10 piercing damage. Reach 10 feet',
        effects: '',
        tags: ['melee', 'spear', 'reach', 'two_handed']
    },
    'rapier': {
        name: 'Rapier',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'martial'],
        weight: 0.9,
        value: 25,
        description: '1d8 piercing damage',
        effects: '',
        tags: ['melee', 'sword', 'finesse']
    },
    'scimitar': {
        name: 'Scimitar',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'light', 'martial'],
        weight: 1.4,
        value: 25,
        description: '1d6 slashing damage',
        effects: '',
        tags: ['melee', 'sword', 'finesse', 'light']
    },
    'shortsword': {
        name: 'Shortsword',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'light', 'martial'],
        weight: 0.9,
        value: 10,
        description: '1d6 piercing damage',
        effects: '',
        tags: ['melee', 'sword', 'finesse', 'light']
    },
    'trident': {
        name: 'Trident',
        type: 'weapon',
        rarity: 'common',
        properties: ['thrown', 'versatile', 'martial'],
        weight: 1.8,
        value: 5,
        description: '1d6 piercing damage (1d8 when used with two hands). Range 20/60 feet when thrown',
        effects: '',
        tags: ['melee', 'thrown', 'versatile', 'spear']
    },
    'war_pick': {
        name: 'War Pick',
        type: 'weapon',
        rarity: 'common',
        properties: ['martial'],
        weight: 0.9,
        value: 5,
        description: '1d8 piercing damage',
        effects: '',
        tags: ['melee', 'pick', 'piercing']
    },
    'warhammer': {
        name: 'Warhammer',
        type: 'weapon',
        rarity: 'common',
        properties: ['versatile', 'martial'],
        weight: 0.9,
        value: 15,
        description: '1d8 bludgeoning damage (1d10 when used with two hands)',
        effects: '',
        tags: ['melee', 'hammer', 'versatile']
    },
    'whip': {
        name: 'Whip',
        type: 'weapon',
        rarity: 'common',
        properties: ['finesse', 'reach', 'martial'],
        weight: 1.4,
        value: 2,
        description: '1d4 slashing damage. Reach 10 feet',
        effects: '',
        tags: ['melee', 'whip', 'finesse', 'reach']
    },

    // === ARMI MARZIALI A DISTANZA ===
    'blowgun': {
        name: 'Blowgun',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'loading', 'martial'],
        weight: 0.5,
        value: 10,
        description: '1 piercing damage. Range 25/100 feet',
        effects: '',
        tags: ['ranged', 'blowgun', 'stealth']
    },
    'crossbow_hand': {
        name: 'Hand Crossbow',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'light', 'loading', 'martial'],
        weight: 1.4,
        value: 75,
        description: '1d6 piercing damage. Range 30/120 feet',
        effects: '',
        tags: ['ranged', 'crossbow', 'light']
    },
    'crossbow_heavy': {
        name: 'Heavy Crossbow',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'heavy', 'loading', 'two_handed', 'martial'],
        weight: 8.2,
        value: 50,
        description: '1d10 piercing damage. Range 100/400 feet',
        effects: '',
        tags: ['ranged', 'crossbow', 'heavy', 'two_handed']
    },
    'longbow': {
        name: 'Longbow',
        type: 'weapon',
        rarity: 'common',
        properties: ['ammunition', 'heavy', 'two_handed', 'martial'],
        weight: 0.9,
        value: 50,
        description: '1d8 piercing damage. Range 150/600 feet',
        effects: '',
        tags: ['ranged', 'bow', 'heavy', 'two_handed']
    },
    'net': {
        name: 'Net',
        type: 'weapon',
        rarity: 'common',
        properties: ['special', 'thrown', 'martial'],
        weight: 1.4,
        value: 1,
        description: 'No damage. Range 5/15 feet. Special: restrains Large or smaller creatures on hit',
        effects: 'restrain',
        tags: ['ranged', 'thrown', 'special', 'restraint']
    },

    // === ARMATURE LEGGERE ===
    'leather_armor': {
        name: 'Leather Armor',
        type: 'armor',
        rarity: 'common',
        properties: ['light'],
        weight: 4.5,
        value: 10,
        description: 'AC 11 + Dex modifier',
        effects: 'ac_base:11',
        tags: ['armor', 'light']
    },
    'studded_leather': {
        name: 'Studded Leather',
        type: 'armor',
        rarity: 'common',
        properties: ['light'],
        weight: 6.0,
        value: 45,
        description: 'AC 12 + Dex modifier',
        effects: 'ac_base:12',
        tags: ['armor', 'light']
    },
    'padded_armor': {
        name: 'Padded Armor',
        type: 'armor',
        rarity: 'common',
        properties: ['light', 'stealth_disadvantage'],
        weight: 3.6,
        value: 5,
        description: 'AC 11 + Dex modifier. Disadvantage on Stealth checks',
        effects: 'ac_base:11,stealth_disadvantage',
        tags: ['armor', 'light']
    },

    // === ARMATURE MEDIE ===
    'hide_armor': {
        name: 'Hide Armor',
        type: 'armor',
        rarity: 'common',
        properties: ['medium'],
        weight: 5.4,
        value: 10,
        description: 'AC 12 + Dex modifier (max 2)',
        effects: 'ac_base:12,dex_max:2',
        tags: ['armor', 'medium']
    },
    'chain_shirt': {
        name: 'Chain Shirt',
        type: 'armor',
        rarity: 'common',
        properties: ['medium'],
        weight: 9.1,
        value: 50,
        description: 'AC 13 + Dex modifier (max 2)',
        effects: 'ac_base:13,dex_max:2',
        tags: ['armor', 'medium', 'mail']
    },
    'scale_mail': {
        name: 'Scale Mail',
        type: 'armor',
        rarity: 'common',
        properties: ['medium', 'stealth_disadvantage'],
        weight: 20.4,
        value: 50,
        description: 'AC 14 + Dex modifier (max 2). Disadvantage on Stealth checks',
        effects: 'ac_base:14,dex_max:2,stealth_disadvantage',
        tags: ['armor', 'medium']
    },
    'breastplate': {
        name: 'Breastplate',
        type: 'armor',
        rarity: 'common',
        properties: ['medium'],
        weight: 9.1,
        value: 400,
        description: 'AC 14 + Dex modifier (max 2)',
        effects: 'ac_base:14,dex_max:2',
        tags: ['armor', 'medium', 'plate']
    },
    'half_plate': {
        name: 'Half Plate',
        type: 'armor',
        rarity: 'common',
        properties: ['medium', 'stealth_disadvantage'],
        weight: 18.1,
        value: 750,
        description: 'AC 15 + Dex modifier (max 2). Disadvantage on Stealth checks',
        effects: 'ac_base:15,dex_max:2,stealth_disadvantage',
        tags: ['armor', 'medium', 'plate']
    },

    // === ARMATURE PESANTI ===
    'ring_mail': {
        name: 'Ring Mail',
        type: 'armor',
        rarity: 'common',
        properties: ['heavy', 'stealth_disadvantage'],
        weight: 18.1,
        value: 30,
        description: 'AC 14. Heavy armor. Disadvantage on Stealth checks',
        effects: 'ac_base:14,stealth_disadvantage',
        tags: ['armor', 'heavy']
    },
    'chain_mail': {
        name: 'Chain Mail',
        type: 'armor',
        rarity: 'common',
        properties: ['heavy', 'stealth_disadvantage'],
        weight: 25,
        value: 75,
        description: 'AC 16. Heavy armor. Disadvantage on Stealth checks',
        effects: 'ac_base:16,stealth_disadvantage',
        tags: ['armor', 'heavy', 'mail']
    },
    'splint_armor': {
        name: 'Splint Armor',
        type: 'armor',
        rarity: 'common',
        properties: ['heavy', 'stealth_disadvantage'],
        weight: 27.2,
        value: 200,
        description: 'AC 17. Heavy armor. Disadvantage on Stealth checks',
        effects: 'ac_base:17,stealth_disadvantage',
        tags: ['armor', 'heavy']
    },
    'plate_armor': {
        name: 'Plate Armor',
        type: 'armor',
        rarity: 'common',
        properties: ['heavy', 'stealth_disadvantage'],
        weight: 29.5,
        value: 1500,
        description: 'AC 18. Heavy armor. Disadvantage on Stealth checks',
        effects: 'ac_base:18,stealth_disadvantage',
        tags: ['armor', 'heavy', 'plate']
    },

    // === SCUDI ===
    'shield': {
        name: 'Shield',
        type: 'armor',
        rarity: 'common',
        properties: ['shield'],
        weight: 2.7,
        value: 10,
        description: '+2 AC bonus',
        effects: 'ac_bonus:+2',
        tags: ['shield', 'armor']
    },

    // === CONSUMABILI E POZIONI ===
    'healing_potion': {
        name: 'Potion of Healing',
        type: 'consumable',
        rarity: 'common',
        properties: ['consumable', 'magical'],
        weight: 0.2,
        value: 50,
        description: 'Heals 2d4 + 2 hit points when consumed',
        effects: 'healing:2d4+2',
        tags: ['potion', 'healing']
    },
    'greater_healing_potion': {
        name: 'Potion of Greater Healing',
        type: 'consumable',
        rarity: 'uncommon',
        properties: ['consumable', 'magical'],
        weight: 0.2,
        value: 150,
        description: 'Heals 4d4 + 4 hit points when consumed',
        effects: 'healing:4d4+4',
        tags: ['potion', 'healing', 'greater']
    },
    'superior_healing_potion': {
        name: 'Potion of Superior Healing',
        type: 'consumable',
        rarity: 'rare',
        properties: ['consumable', 'magical'],
        weight: 0.2,
        value: 500,
        description: 'Heals 8d4 + 8 hit points when consumed',
        effects: 'healing:8d4+8',
        tags: ['potion', 'healing', 'superior']
    },
    'supreme_healing_potion': {
        name: 'Potion of Supreme Healing',
        type: 'consumable',
        rarity: 'very_rare',
        properties: ['consumable', 'magical'],
        weight: 0.2,
        value: 1350,
        description: 'Heals 10d4 + 20 hit points when consumed',
        effects: 'healing:10d4+20',
        tags: ['potion', 'healing', 'supreme']
    },
    'antitoxin': {
        name: 'Antitoxin',
        type: 'consumable',
        rarity: 'common',
        properties: ['consumable'],
        weight: 0.2,
        value: 50,
        description: 'Advantage on saving throws against poison for 1 hour',
        effects: 'poison_advantage:1h',
        tags: ['potion', 'poison', 'medicine']
    },

    // === STRUMENTI E ATTREZZATURE ===
    'thieves_tools': {
        name: "Thieves' Tools",
        type: 'tool',
        rarity: 'common',
        properties: ['tool'],
        weight: 0.5,
        value: 25,
        description: 'Used for picking locks and disarming traps',
        effects: 'lockpicking:+2,trap_disarm:+2',
        tags: ['tools', 'rogue', 'stealth']
    },
    'smiths_tools': {
        name: "Smith's Tools",
        type: 'tool',
        rarity: 'common',
        properties: ['tool'],
        weight: 3.6,
        value: 20,
        description: 'Used for crafting and repairing metal items',
        effects: 'metalwork:+2',
        tags: ['tools', 'crafting', 'smith']
    },
    'rope_hemp': {
        name: 'Hemp Rope (50 feet)',
        type: 'misc',
        rarity: 'common',
        properties: [],
        weight: 4.5,
        value: 2,
        description: '50 feet of sturdy hemp rope',
        effects: '',
        tags: ['utility', 'rope', 'climbing']
    },
    'rope_silk': {
        name: 'Silk Rope (50 feet)',
        type: 'misc',
        rarity: 'common',
        properties: [],
        weight: 2.3,
        value: 10,
        description: '50 feet of strong silk rope',
        effects: '',
        tags: ['utility', 'rope', 'climbing', 'light']
    },
    'grappling_hook': {
        name: 'Grappling Hook',
        type: 'misc',
        rarity: 'common',
        properties: [],
        weight: 1.8,
        value: 2,
        description: 'Iron hook for climbing and utility',
        effects: '',
        tags: ['utility', 'climbing', 'iron']
    },
    'crowbar': {
        name: 'Crowbar',
        type: 'tool',
        rarity: 'common',
        properties: ['tool'],
        weight: 2.3,
        value: 2,
        description: 'Advantage on Strength checks where leverage can be applied',
        effects: 'leverage:advantage',
        tags: ['tool', 'utility', 'strength']
    },
    'torch': {
        name: 'Torch',
        type: 'misc',
        rarity: 'common',
        properties: ['light'],
        weight: 0.5,
        value: 0.01,
        description: 'Bright light 20 feet, dim light 20 feet beyond. Burns for 1 hour',
        effects: 'light:20/40,duration:1h',
        tags: ['utility', 'light', 'fire']
    },
    'lantern_hooded': {
        name: 'Hooded Lantern',
        type: 'misc',
        rarity: 'common',
        properties: ['light'],
        weight: 0.9,
        value: 5,
        description: 'Bright light 30 feet, dim light 30 feet beyond. Burns for 6 hours on a flask of oil',
        effects: 'light:30/60,duration:6h',
        tags: ['utility', 'light', 'oil']
    },

    // === OGGETTI MAGICI COMUNI ===
    'weapon_plus_1': {
        name: '+1 Weapon',
        type: 'weapon',
        rarity: 'uncommon',
        properties: ['magical', '+1'],
        weight: 1.4,
        value: 500,
        description: '+1 bonus to attack and damage rolls',
        effects: 'attack_bonus:+1,damage_bonus:+1',
        tags: ['magical', 'enhancement']
    },
    'armor_plus_1': {
        name: '+1 Armor',
        type: 'armor',
        rarity: 'rare',
        properties: ['magical', '+1'],
        weight: 15,
        value: 1000,
        description: '+1 bonus to AC',
        effects: 'ac_bonus:+1',
        tags: ['magical', 'armor', 'enhancement']
    },
    'shield_plus_1': {
        name: '+1 Shield',
        type: 'armor',
        rarity: 'uncommon',
        properties: ['shield', 'magical', '+1'],
        weight: 2.7,
        value: 750,
        description: '+3 AC bonus total (+2 base +1 enhancement)',
        effects: 'ac_bonus:+3',
        tags: ['shield', 'magical', 'enhancement']
    },

    // === OGGETTI MAGICI SPECIALI ===
    'flaming_sword': {
        name: 'Flame Tongue',
        type: 'weapon',
        rarity: 'rare',
        properties: ['versatile', 'martial', 'magical', 'attunement_required'],
        weight: 1.4,
        value: 2000,
        description: 'Longsword. Bonus action to ignite: sheds bright light and deals extra 2d6 fire damage',
        effects: 'fire_damage:2d6,light:40/40',
        tags: ['melee', 'sword', 'magical', 'fire', 'light']
    },
    'frost_brand': {
        name: 'Frost Brand',
        type: 'weapon',
        rarity: 'very_rare',
        properties: ['versatile', 'martial', 'magical', 'attunement_required'],
        weight: 1.4,
        value: 5000,
        description: '+1 sword. Extra 1d6 cold damage. Fire resistance. Extinguishes fires.',
        effects: 'attack_bonus:+1,damage_bonus:+1,cold_damage:1d6,fire_resistance',
        tags: ['melee', 'sword', 'magical', 'cold', 'resistance']
    },
    'cloak_of_protection': {
        name: 'Cloak of Protection',
        type: 'wondrous',
        rarity: 'uncommon',
        properties: ['magical', 'attunement_required'],
        weight: 1,
        value: 500,
        description: '+1 bonus to AC and saving throws while worn',
        effects: 'ac_bonus:+1,saving_throws:+1',
        tags: ['cloak', 'protection', 'magical', 'saves']
    },
    'ring_of_protection': {
        name: 'Ring of Protection',
        type: 'wondrous',
        rarity: 'rare',
        properties: ['magical', 'attunement_required'],
        weight: 0,
        value: 1000,
        description: '+1 bonus to AC and saving throws while worn',
        effects: 'ac_bonus:+1,saving_throws:+1',
        tags: ['ring', 'protection', 'magical', 'saves']
    },
    'bag_of_holding': {
        name: 'Bag of Holding',
        type: 'wondrous',
        rarity: 'uncommon',
        properties: ['magical'],
        weight: 6.8,
        value: 2000,
        description: 'This bag has an interior space considerably larger than its outside dimensions',
        effects: 'extra_storage:500',
        tags: ['bag', 'storage', 'magical', 'utility']
    },
    'boots_of_speed': {
        name: 'Boots of Speed',
        type: 'wondrous',
        rarity: 'rare',
        properties: ['magical', 'attunement_required'],
        weight: 0.5,
        value: 2000,
        description: 'Double speed for 10 minutes. Once per day.',
        effects: 'speed_double:10min,uses:1/day',
        tags: ['boots', 'speed', 'magical', 'movement']
    },
    'gauntlets_of_ogre_power': {
        name: 'Gauntlets of Ogre Power',
        type: 'wondrous',
        rarity: 'uncommon',
        properties: ['magical', 'attunement_required'],
        weight: 0.9,
        value: 1000,
        description: 'Your Strength score is 19 while you wear these gauntlets',
        effects: 'str_set:19',
        tags: ['gauntlets', 'strength', 'magical', 'enhancement']
    }
};

// Generatore di ID univoci per gli oggetti
export const generateItemId = (templateKey: string): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${templateKey}_${timestamp}_${random}`;
};

// Crea un oggetto da un template
export const createItemFromTemplate = (
    templateKey: string, 
    acquisitionMethod: AcquisitionMethod = 'loot',
    locationState: string = 'world',
    provenance: string = 'Generated'
): Item => {
    const template = ITEM_TEMPLATES[templateKey];
    if (!template) {
        throw new Error(`Template '${templateKey}' not found`);
    }

    return {
        id: generateItemId(templateKey),
        name: template.name,
        type: template.type,
        rarity: template.rarity,
        properties: [...template.properties],
        weight: template.weight,
        value: template.value,
        description: template.description,
        prerequisites: template.properties.includes('attunement_required') ? ['attunement_required'] : [],
        effects: template.effects,
        uses: template.type === 'consumable' ? { max: 1, current: 1, recharge: 'none' } : undefined,
        location_state: locationState,
        discovery_requirements: '',
        acquisition_method: acquisitionMethod,
        provenance,
        tags: [...template.tags]
    };
};

// Aggiunge un oggetto all'inventario
export const addItemToInventory = (character: Character, item: Item): InventoryOperationResult => {
    // Controlla peso massimo trasportabile
    const maxWeight = calculateCarryingCapacity(character);
    const currentWeight = getTotalInventoryWeight(character);
    
    if (currentWeight + item.weight > maxWeight) {
        return {
            success: false,
            message: `Cannot carry ${item.name}. Exceeds carrying capacity.`
        };
    }
    
    // Controlla se l'oggetto è stackable
    if (isStackableItem(item)) {
        const existingItem = character.inventory.find(invItem => 
            invItem.name === item.name && invItem.rarity === item.rarity
        );
        
        if (existingItem && existingItem.uses && item.uses) {
            existingItem.uses.current += item.uses.current;
            return {
                success: true,
                message: `Added ${item.uses.current} ${item.name}(s) to existing stack.`,
                item: existingItem
            };
        }
    }
    
    // Aggiunge l'oggetto all'inventario
    item.location_state = `player:${character.name}`;
    character.inventory.push(item);
    
    return {
        success: true,
        message: `Added ${item.name} to inventory.`,
        item
    };
};

// Rimuove un oggetto dall'inventario
export const removeItemFromInventory = (character: Character, itemId: string): InventoryOperationResult => {
    const itemIndex = character.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return {
            success: false,
            message: `Item with ID ${itemId} not found in inventory.`
        };
    }
    
    const item = character.inventory[itemIndex];
    character.inventory.splice(itemIndex, 1);
    
    return {
        success: true,
        message: `Removed ${item.name} from inventory.`,
        item
    };
};

// Usa un oggetto consumabile
export const useConsumableItem = (character: Character, itemId: string): InventoryOperationResult => {
    const item = character.inventory.find(invItem => invItem.id === itemId);
    
    if (!item) {
        return {
            success: false,
            message: `Item with ID ${itemId} not found.`
        };
    }
    
    if (item.type !== 'consumable' || !item.uses) {
        return {
            success: false,
            message: `${item.name} is not consumable.`
        };
    }
    
    if (item.uses.current <= 0) {
        return {
            success: false,
            message: `${item.name} has no uses remaining.`
        };
    }
    
    // Applica gli effetti dell'oggetto
    applyItemEffects(character, item);
    
    // Diminuisce gli usi
    item.uses.current--;
    
    // Rimuove l'oggetto se esaurito
    if (item.uses.current <= 0) {
        removeItemFromInventory(character, itemId);
    }
    
    return {
        success: true,
        message: `Used ${item.name}. ${item.uses.current} uses remaining.`,
        item
    };
};

// Applica gli effetti di un oggetto al personaggio
const applyItemEffects = (character: Character, item: Item): void => {
    const effects = item.effects.toLowerCase();
    
    // Healing effect
    if (effects.includes('healing:')) {
        const healingMatch = effects.match(/healing:(\d*)d(\d+)(?:\+(\d+))?/);
        if (healingMatch) {
            const dice = parseInt(healingMatch[1]) || 1;
            const sides = parseInt(healingMatch[2]);
            const bonus = parseInt(healingMatch[3]) || 0;
            
            let healAmount = bonus;
            for (let i = 0; i < dice; i++) {
                healAmount += Math.floor(Math.random() * sides) + 1;
            }
            
            const oldHp = character.hp;
            character.hp = Math.min(character.hp + healAmount, character.maxHp);
            console.log(`${character.name} healed for ${character.hp - oldHp} HP`);
        }
    }
    
    // Temporary ability bonus (would need duration tracking)
    if (effects.includes('str_bonus:')) {
        const bonusMatch = effects.match(/str_bonus:\+(\d+)/);
        if (bonusMatch) {
            const bonus = parseInt(bonusMatch[1]);
            // This would require a temporary effects system
            console.log(`${character.name} gains +${bonus} STR temporarily`);
        }
    }
};

// Calcola la capacità di carico
export const calculateCarryingCapacity = (character: Character): number => {
    const strength = character.abilityScores.STR;
    return strength * 7; // 15 lb per punto di forza, convertito in kg (~7 kg)
};

// Calcola peso totale inventario
export const getTotalInventoryWeight = (character: Character): number => {
    return character.inventory.reduce((total, item) => total + item.weight, 0);
};

// Controlla se un oggetto è stackable
const isStackableItem = (item: Item): boolean => {
    return item.type === 'consumable' || 
           item.type === 'currency' || 
           item.tags.includes('stackable');
};

// Trova oggetti per tipo
export const findItemsByType = (character: Character, type: ItemType): Item[] => {
    return character.inventory.filter(item => item.type === type);
};

// Trova oggetti equipaggiabili
export const getEquippableItems = (character: Character): Item[] => {
    return character.inventory.filter(item => 
        item.type === 'weapon' || 
        item.type === 'armor' || 
        item.type === 'wondrous'
    );
};

// Sistema di equipaggiamento
export const equipItem = (character: Character, itemId: string): InventoryOperationResult => {
    const item = character.inventory.find(invItem => invItem.id === itemId);
    
    if (!item) {
        return {
            success: false,
            message: `Item with ID ${itemId} not found.`
        };
    }
    
    // Controlla prerequisiti
    if (item.prerequisites.includes('attunement_required')) {
        if (!item.properties.includes('attuned')) {
            return attunementProcess(character, item);
        }
    }
    
    // Controlla se può essere equipaggiato
    if (!['weapon', 'armor', 'wondrous'].includes(item.type)) {
        return {
            success: false,
            message: `${item.name} cannot be equipped.`
        };
    }
    
    // Aggiunge tag "equipped" se non presente
    if (!item.tags.includes('equipped')) {
        item.tags.push('equipped');
    }
    
    return {
        success: true,
        message: `Equipped ${item.name}.`,
        item
    };
};

// Sistema di sintonizzazione
const attunementProcess = (character: Character, item: Item): InventoryOperationResult => {
    // Controlla limite di oggetti sintonizzati (max 3 in D&D 5e)
    const attunedItems = character.inventory.filter(invItem => 
        invItem.properties.includes('attuned')
    );
    
    if (attunedItems.length >= 3) {
        return {
            success: false,
            message: `Cannot attune to ${item.name}. Maximum of 3 attuned items.`
        };
    }
    
    // Processo di sintonizzazione (richiede 1 ora in-game)
    item.properties.push('attuned');
    
    return {
        success: true,
        message: `Successfully attuned to ${item.name}.`,
        item
    };
};

// Genera loot casuale basato su livello e rarità
export const generateRandomLoot = (
    characterLevel: number, 
    rarityTier: 'common' | 'uncommon' | 'rare' = 'common'
): Item[] => {
    const lootPool = Object.keys(ITEM_TEMPLATES).filter(key => {
        const template = ITEM_TEMPLATES[key];
        return template.rarity === rarityTier;
    });
    
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
    const loot: Item[] = [];
    
    for (let i = 0; i < numItems; i++) {
        const randomTemplate = lootPool[Math.floor(Math.random() * lootPool.length)];
        const item = createItemFromTemplate(randomTemplate, 'loot', 'world', `Level ${characterLevel} loot`);
        loot.push(item);
    }
    
    return loot;
};

// Valuta il valore totale dell'inventario
export const calculateInventoryValue = (character: Character): number => {
    return character.inventory.reduce((total, item) => total + item.value, 0);
};

// Ricerca oggetti nell'inventario
export const searchInventory = (character: Character, query: string): Item[] => {
    const lowercaseQuery = query.toLowerCase();
    
    return character.inventory.filter(item => 
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.description.toLowerCase().includes(lowercaseQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        item.type.toLowerCase().includes(lowercaseQuery)
    );
};

export const getStartingEquipment = (characterClass: string): Item[] => {
    const equipment: Item[] = [];
    const klass = characterClass.toLowerCase();

    // Give a dagger to almost everyone
    if (klass !== 'monk') {
        equipment.push(createItemFromTemplate('dagger', 'purchase', 'player'));
    }

    switch (klass) {
        case 'fighter':
            equipment.push(createItemFromTemplate('longsword', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('chain_mail', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('shield', 'purchase', 'player'));
            break;
        case 'rogue':
            equipment.push(createItemFromTemplate('shortsword', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('leather_armor', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('thieves_tools', 'purchase', 'player'));
            break;
        case 'wizard':
            equipment.push(createItemFromTemplate('quarterstaff', 'purchase', 'player'));
            break;
        case 'cleric':
            equipment.push(createItemFromTemplate('mace', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('scale_mail', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('shield', 'purchase', 'player'));
            break;
        case 'barbarian':
            equipment.push(createItemFromTemplate('greataxe', 'purchase', 'player'));
            break;
        case 'bard':
             equipment.push(createItemFromTemplate('rapier', 'purchase', 'player'));
             equipment.push(createItemFromTemplate('leather_armor', 'purchase', 'player'));
            break;
        case 'druid':
            equipment.push(createItemFromTemplate('club', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('leather_armor', 'purchase', 'player'));
            break;
        case 'monk':
            equipment.push(createItemFromTemplate('shortsword', 'purchase', 'player'));
            break;
        case 'paladin':
            equipment.push(createItemFromTemplate('longsword', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('chain_mail', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('shield', 'purchase', 'player'));
            break;
        case 'ranger':
            equipment.push(createItemFromTemplate('longbow', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('shortsword', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('leather_armor', 'purchase', 'player'));
            break;
        case 'sorcerer':
            equipment.push(createItemFromTemplate('quarterstaff', 'purchase', 'player'));
            break;
        case 'warlock':
            equipment.push(createItemFromTemplate('quarterstaff', 'purchase', 'player'));
            equipment.push(createItemFromTemplate('leather_armor', 'purchase', 'player'));
            break;
        default:
            equipment.push(createItemFromTemplate('club', 'purchase', 'player'));
    }

    // Equip the first weapon and armor found
    const firstWeapon = equipment.find(item => item.type === 'weapon');
    if (firstWeapon) equipItem({ inventory: equipment } as Character, firstWeapon.id);

    const firstArmor = equipment.find(item => item.type === 'armor' && !item.properties.includes('shield'));
    if (firstArmor) equipItem({ inventory: equipment } as Character, firstArmor.id);

    const firstShield = equipment.find(item => item.type === 'armor' && item.properties.includes('shield'));
    if (firstShield) equipItem({ inventory: equipment } as Character, firstShield.id);
    
    return equipment;
};