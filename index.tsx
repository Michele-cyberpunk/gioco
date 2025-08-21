import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameApp } from './GameApp';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <GameApp />
        </React.StrictMode>
    );
}