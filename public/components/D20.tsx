/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface D20Props {
  rolling: boolean;
  result: number | null;
}

export const D20: React.FC<D20Props> = ({ rolling, result }) => {
  const [displayNumber, setDisplayNumber] = React.useState<number | string>('?');

  React.useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setDisplayNumber(result ?? '?');
    }
  }, [rolling, result]);
  
  const isCriticalSuccess = !rolling && result === 20;
  const isCriticalFailure = !rolling && result === 1;

  let colorClass = 'text-gray-200';
  if (isCriticalSuccess) colorClass = 'text-green-400';
  if (isCriticalFailure) colorClass = 'text-red-400';

  return (
    <div className={`
      w-24 h-24 bg-gray-900/50 rounded-lg flex items-center justify-center 
      border-2 border-gray-600 transition-all duration-300
      ${rolling ? 'animate-pulse' : ''}
      ${isCriticalSuccess ? 'border-green-400 shadow-lg shadow-green-400/20' : ''}
      ${isCriticalFailure ? 'border-red-400 shadow-lg shadow-red-400/20' : ''}
    `}>
      <span className={`font-bold text-5xl ${colorClass} transition-colors`}>
        {displayNumber}
      </span>
    </div>
  );
};
