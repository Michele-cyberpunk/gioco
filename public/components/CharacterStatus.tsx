/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CharacterStatus } from '../../types';

interface CharacterStatusProps {
    status: CharacterStatus[] | null;
}

const HealthBar: React.FC<{ hp: number; maxHp: number }> = ({ hp, maxHp }) => {
    const percentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    let barColor = 'bg-green-500';
    if (percentage < 50) barColor = 'bg-yellow-500';
    if (percentage < 25) barColor = 'bg-red-500';
  
    return (
      <div className="w-full bg-gray-700 rounded-full h-2.5 shadow-inner">
        <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
};

export const CharacterStatusDisplay: React.FC<CharacterStatusProps> = ({ status }) => {
    if (!status || !Array.isArray(status)) {
        return (
            <div className="parchment p-4 rounded-lg">
                 <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">Party Status</h2>
                 <p className="italic text-gray-500">Awaiting party status...</p>
            </div>
        );
    }

    return (
        <div className="parchment p-4 rounded-lg">
             <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">Party Status</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {status.map((char, index) => {
                    if (typeof char !== 'object' || char === null || !char.name) {
                        return <div key={index}>Invalid character data</div>;
                    }
                    
                    return (
                        <div key={char.name} className="bg-black/5 p-3 rounded space-y-2">
                            <div>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-lg">{char.name}</h3>
                                    <p className="font-bold text-sm">{char.hp} / {char.maxHp} HP</p>
                                </div>
                                <HealthBar hp={char.hp} maxHp={char.maxHp} />
                            </div>
                            {(char.inventory || []).length > 0 && (
                                <div>
                                    <h4 className="font-bold text-sm">Inventory:</h4>
                                    <ul className="text-xs list-disc list-inside">
                                        {(char.inventory || []).map(item => (
                                            <li key={item.name} title={item.description}>{item.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
        </div>
    );
};