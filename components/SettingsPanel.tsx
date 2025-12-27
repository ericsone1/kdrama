
import React from 'react';
import { AspectRatio, Engine, GenerationSettings, Resolution } from '../types';

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
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
      <div className="p-1 bg-gray-900 rounded-lg flex border border-gray-700">
        <button onClick={() => setMixboardMode(false)} className={`flex-1 py-2 text-sm font-bold rounded ${!isMixboardMode ? 'bg-gray-700 text-white' : 'text-gray-500'}`}>Grid</button>
        <button onClick={() => setMixboardMode(true)} className={`flex-1 py-2 text-sm font-bold rounded ${isMixboardMode ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>Mixboard</button>
      </div>
      <div className="space-y-4">
        <button onClick={onConnectKey} className="w-full bg-blue-600 py-2 rounded text-xs font-bold">🔑 유료 API 키 연결</button>
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Scene Count</label>
          <input type="range" min="5" max="100" value={settings.targetSceneCount} onChange={e => handleChange('targetSceneCount', parseInt(e.target.value))} className="w-full accent-blue-600" />
          <div className="text-center font-mono">{settings.targetSceneCount}</div>
        </div>
      </div>
    </div>
  );
};
