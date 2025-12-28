import React from 'react';
import { GenerationSettings } from './types';

export const SettingsPanel: React.FC<{
  settings: GenerationSettings;
  setSettings: any;
  disabled: boolean;
  isMixboardMode: boolean;
  setMixboardMode: any;
  onConnectKey: any;
}> = ({ settings, setSettings, disabled, isMixboardMode, setMixboardMode, onConnectKey }) => {
  const handleChange = (key: string, value: any) => setSettings((prev: any) => ({ ...prev, [key]: value }));
  
  return (
    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-6 shadow-xl sticky top-24">
      <div className="p-1 bg-gray-900 rounded-xl flex border border-gray-700">
        <button 
          onClick={() => setMixboardMode(false)} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isMixboardMode ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Grid View
        </button>
        <button 
          onClick={() => setMixboardMode(true)} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isMixboardMode ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Mixboard
        </button>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onConnectKey} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          🔑 유료 API 키 연결 설정
        </button>
        
        <div className="pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">장면 목표 개수</label>
            <span className="text-xs font-mono text-blue-400 font-bold">{settings.targetSceneCount}개</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="100" 
            disabled={disabled}
            value={settings.targetSceneCount} 
            onChange={e => handleChange('targetSceneCount', parseInt(e.target.value))} 
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30" 
          />
          <p className="text-[9px] text-gray-600 mt-2 italic">* 대본 길이에 따라 AI가 최적의 개수를 조정합니다.</p>
        </div>
      </div>
    </div>
  );
};