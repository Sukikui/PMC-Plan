'use client';

import React from 'react';
import { themeColors } from '@/lib/theme-colors';
import AddPlaceButton from '../AddPlaceButton';

const ExternalLinks: React.FC = () => {
  const linkClass = `flex items-center gap-2 text-xs ${themeColors.link} px-2 py-2 w-full text-left ${themeColors.util.roundedFull} ${themeColors.transitionAll}`;

  return (
    <div className="space-y-2 -mb-1">
      <a 
        href="https://modrinth.com/mod/playercoordsapi"
        target="_blank" 
        rel="noopener noreferrer" 
        className={linkClass}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        Télécharger PlayerCoordsAPI
      </a>

      <AddPlaceButton className={`${linkClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
        </svg>
        Ajouter un lieu ou un portail
      </AddPlaceButton>

      <a 
        href="https://github.com/Sukikui/PMC-Plan"
        target="_blank" 
        rel="noopener noreferrer" 
        className={linkClass}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Code source
      </a>
    </div>
  );
};

export default ExternalLinks;
