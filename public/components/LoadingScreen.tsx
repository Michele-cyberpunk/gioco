/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <div
      className="fixed inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-50 animate-fade-in"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-yellow-500"></div>
      <h2 className="text-2xl font-bold text-white mt-8 text-shadow">
        {message}
      </h2>
      <p className="text-gray-400 mt-2">The mists of fate are swirling...</p>
    </div>
  );
};
