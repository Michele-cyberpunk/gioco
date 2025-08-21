export interface AbilityScores {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
}

export type ItemType = 'weapon' | 'armor' | 'tool' | 'consumable' | 'wondrous' | 'quest' | 'currency' | 'misc';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
export type RechargeRate = 'short_rest' | 'long_rest' | 'dawn' | 'none';
export type AcquisitionMethod = 'loot' | 'purchase' | 'quest' | 'craft' | 'gift' | 'theft' | 'search';

export interface Item {
    id: string; // stable unique ID, e.g., "longsword_of_flaming_souls_1"
    name: string;
    type: ItemType;
    rarity: Rarity;
    properties: string[]; // e.g., ["finesse", "light", "+1", "attunement_required"]
    weight: number; // in kg
    value: number; // in gp
    description: string; // Concise rules text and flavor
    prerequisites: string[]; // e.g., ["attunement", "class:wizard", "alignment:lawful_good"]
    effects: string; // Rules-mechanical effects, e.g., "On hit, deals an extra 1d6 fire damage. Save DC 15."
    uses?: {
        max: number;
        current: number;
        recharge: RechargeRate;
    };
    location_state: string; // Where it currently is: "world:cave_of_whispers", "container:chest_1", "npc:gandalf", "player:aragorn"
    discovery_requirements: string; // Skill checks, DCs, conditions, e.g., "DC 15 Investigation check on the loose floorboard"
    acquisition_method: AcquisitionMethod;
    provenance: string; // Reference to how it was introduced, e.g., "Scene 1, Chapter 1"
    tags: string[]; // for quick filters, e.g., ["quest_item", "key", "magical"]
}

export interface Character {
    name: string;
    gender: 'Male' | 'Female' | 'Non-binary' | '';
    race: string;
    klass: string;
    alignment: string;
    abilityScores: AbilityScores;
    level: number;
    hp: number;
    maxHp: number;
    ac: number;
    inventory: Item[];
    conditions?: string[]; // Current status conditions
    spellSlots?: { level: number; total: number; used: number; }[]; // Available spell slots
    classAbilities?: { [key: string]: { uses: number; maxUses: number; } }; // Class ability usage tracking
}

export interface CharacterStatus {
    name: string;
    hp: number;
    maxHp: number;
    inventory: Item[];
}

export interface VideoPromptData {
    character: string;
    position?: string;
    vehicle_device?: string;
    action: string;
    environment: string;
    camera: string;
    lighting: string;
    mood: string;
    special_fx?: string;
    transition?: string;
}

export interface UpdatedVisual {
    characterName: string;
    newVisualDescription: string;
}

export interface Scene {
    story: { it: string; en: string; };
    activeCharacterName: string;
    updatedVisuals: UpdatedVisual[];
    videoPromptData: VideoPromptData;
    actions: string[];
    characterStatus: CharacterStatus[];
    gameOver: boolean;
}

// Add the global JSX declaration for the custom element
import type React from 'react';
import type { GdmLiveAudioChat } from './public/components/GdmLiveAudio';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'gdm-live-audio-chat': React.DetailedHTMLProps<React.HTMLAttributes<GdmLiveAudioChat>, GdmLiveAudioChat>;
        }
    }
}
