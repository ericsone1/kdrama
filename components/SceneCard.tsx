
import React from 'react';
import { Scene } from '../types';

// Updated SceneCard component props to include all properties passed from App.tsx
export const SceneCard: React.FC<{
  scene: Scene; 
  onRetry: (id: string) => void;
  isTableView: boolean;
  onGenerateVideo: () => void;
  onViewImage: () => void;
  onDownload: () => void;
}> = ({ scene, onRetry }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="aspect-video bg-gray-900 relative">
        {scene.imageUrl ? <img src={scene.imageUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-600">{scene.status === 'generating' ? '그리는 중...' : '이미지 없음'}</div>}
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold">#{scene.sceneNumber}</div>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-400 line-clamp-3 italic">"{scene.originalText}"</p>
        <button onClick={() => onRetry(scene.id)} className="w-full py-1 text-xs bg-gray-700 rounded hover:bg-gray-600">다시 생성</button>
      </div>
    </div>
  );
};
