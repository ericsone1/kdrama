
import React from 'react';
import { Character } from './types';

// Added missing props to CharacterCard to resolve type mismatch errors in App.tsx
export const CharacterCard: React.FC<{
  character: Character; 
  onGenerate: (id: string) => void;
  onView: () => void;
  onUpdate: (id: string, update: Partial<Character>) => void;
}> = ({ character, onGenerate }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex gap-4 items-center">
      <div className="w-16 h-16 rounded-full bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-600">
        {character.imageUrl ? <img src={character.imageUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-600">?</div>}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold truncate">{character.name}</h3>
        <button onClick={() => onGenerate(character.id)} className="mt-1 px-3 py-1 bg-blue-600 rounded text-[10px] font-bold">생성</button>
      </div>
    </div>
  );
};
