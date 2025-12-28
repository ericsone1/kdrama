
import React from 'react';
import { Scene } from './types';

// Updated Mixboard component to include missing prop definitions to match App.tsx usage
export const Mixboard: React.FC<{
  scenes: Scene[];
  onUpdate: (id: string, update: Partial<Scene>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRegenerateImage: (id: string) => void;
  onGenerateVideo: () => void;
  onView: () => void;
}> = ({ scenes }) => {
  return (
    <div className="bg-gray-800 p-12 rounded-xl border border-gray-700 text-center">
      <h3 className="text-xl font-bold mb-2">🎛️ Mixboard 준비 중</h3>
      <p className="text-gray-500">장면들을 자유롭게 배치하고 연결하는 기능입니다.</p>
    </div>
  );
};
