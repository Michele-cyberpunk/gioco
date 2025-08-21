/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Character, AbilityScores, Item } from '../../types';
import { calculateMaxHitPoints, getPresetAbilityScores, calculateAbilityModifier } from '../../utils/rules';
import { getStartingEquipment } from '../../utils/inventory';
import { calculateArmorClass } from '../../utils/combat';


interface CharacterSelectionScreenProps {
  onStartGame: (characters: Character[], operatorObjective: string) => void;
}

interface Choice {
  name: string;
  description: string;
}

const RACES: Choice[] = [
  { name: 'Human', description: 'Regular, You know what humans are.' },
  { name: 'Elf', description: 'Short, Keen senses, sees in the dark.' },
  { name: 'Dwarf', description: 'Small, Resilient, sees in the dark.' },
  { name: 'Halfling', description: 'Tiny, Nimble, brave (basically just Hobbits).' },
  { name: 'Gnome', description: 'Very Small, Cunning, sees in the dark.' },
  { name: 'Half-Elf', description: 'Short-ish, Rare, skilled, diplomatic.' },
  { name: 'Half-Orc', description: 'Tall, Savage.' },
  { name: 'Tiefling', description: 'Regular, Has horns and a tail.' },
  { name: 'Dragonborn', description: 'Taller, Scales, tough.' },
];
const CLASSES: Choice[] = [
    { name: 'Fighter', description: 'Combat. Good at fighting. Duh.' },
    { name: 'Rogue', description: 'Criminal. Good at thievery, lockpicking, ruses.' },
    { name: 'Wizard', description: 'General magic. Good at cool spells.' },
    { name: 'Cleric', description: 'Religious magic. Good at healing.' },
    { name: 'Barbarian', description: 'Strong. Good at hitting things.' },
    { name: 'Bard', description: 'Musical. Good at seduction.' },
    { name: 'Druid', description: 'Natural magic. Good at potions, plants/animals.' },
    { name: 'Monk', description: 'Natural magic. Good at kung-fu.' },
    { name: 'Paladin', description: 'Religious knight. Good at religious violence, chivalry.' },
    { name: 'Ranger', description: 'Scouting. Good at archery, stealth.' },
    { name: 'Sorcerer', description: 'Energy magic. Good at cool spells.' },
    { name: 'Warlock', description: 'War magic. Good at cool spells.' },
];
const ALIGNMENTS: Choice[] = [
    { name: 'Lawful Good', description: 'e.g., Superman' },
    { name: 'Neutral Good', description: 'e.g., Gandalf' },
    { name: 'Chaotic Good', description: 'e.g., Batman' },
    { name: 'Lawful Neutral', description: 'e.g., Stannis Baratheon' },
    { name: 'True Neutral', description: 'e.g., Saul Goodman' },
    { name: 'Chaotic Neutral', description: 'e.g., Han Solo' },
    { name: 'Lawful Evil', description: 'e.g., Darth Vader' },
    { name: 'Neutral Evil', description: 'e.g., Voldemort' },
    { name: 'Chaotic Evil', description: 'e.g., The Joker' },
];
const ABILITIES: (keyof AbilityScores)[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const formInputStyle = "w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow duration-200 placeholder-gray-500";
const formLabelStyle = "block text-lg font-bold text-gray-300 mb-2";

interface CharacterFormProps {
  character: Character;
  playerNumber: 1 | 2;
  onChange: (index: 0 | 1, updatedCharacter: Character) => void;
}

const AbilityScoreDisplay: React.FC<{ scores: AbilityScores }> = ({ scores }) => {
    return (
      <div className="grid grid-cols-3 gap-4">
        {ABILITIES.map(ability => (
          <div key={ability} className="text-center bg-gray-900/50 p-2 rounded">
            <p className="block text-sm font-bold text-gray-400 mb-1">{ability}</p>
            <p className="text-xl font-bold">{scores[ability] || '-'}</p>
            <p className="text-xs text-gray-500">
                Mod: {scores[ability] ? (calculateAbilityModifier(scores[ability]) >= 0 ? '+' : '') + calculateAbilityModifier(scores[ability]) : '-'}
            </p>
          </div>
        ))}
      </div>
    );
};


const CharacterForm: React.FC<CharacterFormProps> = ({ character, playerNumber, onChange }) => {
  const [selectedRace, setSelectedRace] = useState<Choice | null>(RACES.find(r => r.name === character.race) || null);
  const [selectedClass, setSelectedClass] = useState<Choice | null>(CLASSES.find(c => c.name === character.klass) || null);
  const [selectedAlignment, setSelectedAlignment] = useState<Choice | null>(ALIGNMENTS.find(a => a.name === character.alignment) || null);
  
  const index = (playerNumber - 1) as 0 | 1;

  const handleFieldChange = (field: keyof Character, value: any) => {
    onChange(index, { ...character, [field]: value });
  };
  
  const handleClassChange = (klass: string) => {
    const newScores = getPresetAbilityScores(klass);
    const newMaxHp = calculateMaxHitPoints(1, klass, newScores.CON);
    const startingInventory = getStartingEquipment(klass);

    // Create a temporary character to calculate AC with new gear
    const tempCharacter: Character = {
      ...character,
      abilityScores: newScores,
      inventory: startingInventory,
    };
    const equippedArmor = startingInventory.find(item => item.type === 'armor' && !item.properties.includes('shield') && item.tags.includes('equipped'));
    const newAc = calculateArmorClass(tempCharacter, equippedArmor);

    const newCharacter: Character = {
        ...character,
        klass,
        abilityScores: newScores,
        maxHp: newMaxHp,
        hp: newMaxHp,
        ac: newAc,
        inventory: startingInventory,
    };

    onChange(index, newCharacter);
    setSelectedClass(CLASSES.find(c => c.name === klass) || null);
  }

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Player {playerNumber}'s Character</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor={`name-${index}`} className={formLabelStyle}>Name</label>
                <input
                  type="text"
                  id={`name-${index}`}
                  value={character.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={formInputStyle}
                  required
                />
            </div>
            <div>
                <label htmlFor={`gender-${index}`} className={formLabelStyle}>Gender</label>
                <select id={`gender-${index}`} value={character.gender} onChange={(e) => handleFieldChange('gender', e.target.value as Character['gender'])} className={formInputStyle} required>
                    <option value="">Choose a Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                </select>
            </div>
            <div>
                <label htmlFor={`race-${index}`} className={formLabelStyle}>Race</label>
                <select id={`race-${index}`} value={character.race} onChange={(e) => { handleFieldChange('race', e.target.value); setSelectedRace(RACES.find(r => r.name === e.target.value) || null); }} className={formInputStyle} required>
                    <option value="">Choose a Race</option>
                    {RACES.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                {selectedRace && <p className="text-sm text-gray-400 mt-2">{selectedRace.description}</p>}
            </div>
            <div>
                <label htmlFor={`class-${index}`} className={formLabelStyle}>Class</label>
                <select id={`class-${index}`} value={character.klass} onChange={(e) => handleClassChange(e.target.value)} className={formInputStyle} required>
                    <option value="">Choose a Class</option>
                    {CLASSES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                {selectedClass && <p className="text-sm text-gray-400 mt-2">{selectedClass.description}</p>}
            </div>
            <div className="md:col-span-2">
                <label htmlFor={`alignment-${index}`} className={formLabelStyle}>Alignment</label>
                <select id={`alignment-${index}`} value={character.alignment} onChange={(e) => { handleFieldChange('alignment', e.target.value); setSelectedAlignment(ALIGNMENTS.find(a => a.name === e.target.value) || null); }} className={formInputStyle} required>
                    <option value="">Choose an Alignment</option>
                    {ALIGNMENTS.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
                {selectedAlignment && <p className="text-sm text-gray-400 mt-2">{selectedAlignment.description}</p>}
            </div>
            <div className="md:col-span-2">
                <h3 className={formLabelStyle}>Ability Scores</h3>
                <AbilityScoreDisplay scores={character.abilityScores} />
            </div>
        </div>
    </div>
  );
};

const createEmptyCharacter = (): Character => ({
    name: '',
    gender: '',
    race: '',
    klass: '',
    alignment: '',
    abilityScores: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
    level: 1,
    hp: 10,
    maxHp: 10,
    ac: 10,
    inventory: [],
});

const LOCAL_STORAGE_KEY = 'dnd_game_setup';

export const CharacterSelectionScreen: React.FC<CharacterSelectionScreenProps> = ({ onStartGame }) => {
  const [characters, setCharacters] = useState<[Character, Character]>(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const { characters } = JSON.parse(savedData);
            if (Array.isArray(characters) && characters.length === 2) {
                return characters as [Character, Character];
            }
        }
    } catch (error) {
        console.error("Failed to load characters from localStorage", error);
    }
    return [createEmptyCharacter(), createEmptyCharacter()];
  });

  const [operatorObjective, setOperatorObjective] = useState<string>(() => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            const { operatorObjective } = JSON.parse(savedData);
            if (typeof operatorObjective === 'string') {
                return operatorObjective;
            }
        }
    } catch (error) {
        console.error("Failed to load operator objective from localStorage", error);
    }
    return '';
  });

  useEffect(() => {
    try {
        const dataToSave = { characters, operatorObjective };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error("Failed to save game setup to localStorage", error);
    }
  }, [characters, operatorObjective]);


  const handleCharacterChange = useCallback((index: 0 | 1, updatedCharacter: Character) => {
    setCharacters(prev => {
        const newCharacters = [...prev] as [Character, Character];
        newCharacters[index] = updatedCharacter;
        return newCharacters;
    });
  }, []);

  const isFormValid = useMemo(() => {
    return characters.every(c => 
        c.name && c.gender && c.race && c.klass && c.alignment &&
        Object.values(c.abilityScores).every(score => score > 0)
    ) && operatorObjective;
  }, [characters, operatorObjective]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
        onStartGame(characters, operatorObjective);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
        <div className="w-full max-w-6xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-400 text-transparent bg-clip-text text-shadow">
                    Create Your Adventurers
                </h1>
                <p className="text-gray-400 mt-2">Forge the heroes who will face the darkness.</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <CharacterForm character={characters[0]} playerNumber={1} onChange={handleCharacterChange} />
                    <CharacterForm character={characters[1]} playerNumber={2} onChange={handleCharacterChange} />
                </div>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                    <label htmlFor="operator-objective" className="block text-xl font-bold text-yellow-400 mb-3">
                        Secret Party Goal
                    </label>
                    <p className="text-sm text-gray-400 mb-4">
                        Define a secret goal for your party. This could be a shared backstory, a hidden motivation, or a personal quest that will drive your adventure forward. This will shape the challenges you face.
                    </p>
                    <textarea
                      id="operator-objective"
                      rows={3}
                      className={formInputStyle}
                      value={operatorObjective}
                      onChange={(e) => setOperatorObjective(e.target.value)}
                      placeholder="e.g., Avenge my family, find a lost artifact, overcome a shared fear..."
                      required
                    />
                </div>

                <div className="text-center pt-4">
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className="px-12 py-4 rounded-lg bg-yellow-600 text-white font-bold text-xl transition-all duration-200 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed hover:enabled:bg-yellow-700 hover:enabled:shadow-xl transform hover:enabled:scale-105 active:enabled:scale-95 active:enabled:bg-yellow-800"
                    >
                        Begin Your Adventure
                    </button>
                    {!isFormValid && <p className="text-xs text-red-400 mt-2">Please complete all fields for both characters and define a party goal to begin.</p>}
                </div>
            </form>
        </div>
    </div>
  );
};