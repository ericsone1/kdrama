import React, { useState } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { SceneCard } from './components/SceneCard';
import { CharacterCard } from './components/CharacterCard';
import { Mixboard } from './components/Mixboard';
import { analyzeScript, generateImage } from './services/geminiService';
import { AspectRatio, Engine, GenerationSettings, Resolution, Scene, Character } from './types';

export default function App() {
  const [bulkScript, setBulkScript] = useState("");
  const [scriptParts, setScriptParts] = useState<string[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMixboard, setIsMixboard] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: AspectRatio.LANDSCAPE,
    resolution: Resolution.RES_1K,
    engine: Engine.NANO_BANANA,
    targetSceneCount: 20,
    totalParts: 0
  });

  const handleSplit = () => {
    if (!bulkScript.trim()) return alert("대본을 입력해주세요.");
    const parts = bulkScript.match(/[\s\S]{1,3000}/g) || [bulkScript];
    setScriptParts(parts);
    setIsBulkMode(false);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeScript(scriptParts, settings.targetSceneCount);
      setScenes(res.scenes);
      setCharacters(res.characters);
    } catch (e) {
      console.error(e);
      alert("분석 중 오류가 발생했습니다. API 키를 확인해주세요.");
    }
    setIsAnalyzing(false);
  };

  const genImage = async (id: string, type: 'scene' | 'character') => {
    if (type === 'scene') setScenes(prev => prev.map(s => s.id === id ? {...s, status: 'generating'} : s));
    else setCharacters(prev => prev.map(c => c.id === id ? {...c, status: 'generating'} : c));

    try {
      const list = type === 'scene' ? scenes : characters;
      const item = list.find(x => x.id === id);
      if (!item) return;

      const prompt = type === 'scene' ? (item as Scene).imagePrompt : (item as Character).description;
      const url = await generateImage(prompt, settings.engine, settings.aspectRatio, settings.resolution);
      const asset = { id: crypto.randomUUID(), url, prompt, createdAt: Date.now() };
      
      if (type === 'scene') {
        setScenes(prev => prev.map(s => s.id === id ? {...s, status: 'completed', imageUrl: url, history: [asset, ...(s.history || [])]} : s));
      } else {
        setCharacters(prev => prev.map(c => c.id === id ? {...c, status: 'completed', imageUrl: url, history: [asset, ...(c.history || [])]} : c));
      }
    } catch (e) {
      if (type === 'scene') setScenes(prev => prev.map(s => s.id === id ? {...s, status: 'failed'} : s));
      else setCharacters(prev => prev.map(c => c.id === id ? {...c, status: 'failed'} : c));
    }
  };

  const handleBatchGen = async () => {
    setIsGenerating(true);
    for (const s of scenes) {
      if (s.status !== 'completed') {
        await genImage(s.id, 'scene');
      }
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 backdrop-blur sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">K-Drama Storyboard Pro</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsShareOpen(true)} className="px-4 py-2 bg-green-600 rounded-lg text-xs font-bold">🚀 가이드</button>
          <button onClick={() => { setIsBulkMode(true); setScenes([]); setCharacters([]); }} className="px-4 py-2 bg-gray-700 rounded-lg text-xs">새 프로젝트</button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-w-screen-2xl mx-auto w-full">
        <aside className="col-span-3">
          <SettingsPanel 
            settings={settings} 
            setSettings={setSettings} 
            disabled={isGenerating} 
            isMixboardMode={isMixboard} 
            setMixboardMode={setIsMixboard} 
            onConnectKey={() => (window as any).aistudio?.openSelectKey()} 
          />
        </aside>

        <section className="col-span-9 space-y-6">
          {isBulkMode ? (
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
              <h2 className="text-2xl font-bold mb-4">대본 전체 입력 (최대 1만 자)</h2>
              <textarea 
                value={bulkScript} 
                onChange={e => setBulkScript(e.target.value)} 
                className="w-full h-80 bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 font-mono text-sm" 
                placeholder="여기에 대본을 붙여넣으세요..." 
              />
              <button onClick={handleSplit} className="px-8 py-3 bg-blue-600 rounded-full font-bold">시작하기</button>
            </div>
          ) : (
            <React.Fragment>
              {isMixboard ? (
                <Mixboard 
                  scenes={scenes} 
                  onUpdate={(id, u) => setScenes(prev => prev.map(s => s.id === id ? {...s, ...u} : s))} 
                  onDelete={id => setScenes(prev => prev.filter(s => s.id !== id))} 
                  onAdd={() => {}} 
                  onRegenerateImage={id => genImage(id, 'scene')} 
                  onGenerateVideo={() => {}} 
                  onView={() => {}} 
                />
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                    <p className="text-sm text-gray-400">{scriptParts.length}개 파트로 분할됨</p>
                    <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing} 
                      className="px-6 py-2 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? "분석 중..." : "✨ AI 스토리보드 추출"}
                    </button>
                  </div>
                  
                  {characters.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">주요 인물</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {characters.map(c => (
                          <CharacterCard 
                            key={c.id} 
                            character={c} 
                            onGenerate={id => genImage(id, 'character')} 
                            onView={() => {}} 
                            onUpdate={(id, u) => setCharacters(prev => prev.map(x => x.id === id ? {...x, ...u} : x))} 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {scenes.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">장면 구성 ({scenes.length})</h3>
                        <button 
                          onClick={handleBatchGen} 
                          disabled={isGenerating} 
                          className="px-6 py-2 bg-green-600 rounded-lg font-bold hover:bg-green-500 transition-colors disabled:opacity-50 text-sm"
                        >
                          {isGenerating ? "이미지 생성 중..." : "이미지 전체 자동 생성 🚀"}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {scenes.map(s => (
                          <SceneCard 
                            key={s.id} 
                            scene={s} 
                            onRetry={id => genImage(id, 'scene')} 
                            isTableView={false}
                            onGenerateVideo={() => {}}
                            onViewImage={() => {}}
                            onDownload={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          )}
        </section>
      </main>

      {isShareOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setIsShareOpen(false)}>
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Vercel 배포 완료 가이드</h2>
            <ul className="space-y-4 text-sm text-gray-400">
              <li>1. Vercel 프로젝트 설정에서 <b>Environment Variables</b> 메뉴를 찾으세요.</li>
              <li>2. <b>API_KEY</b>라는 이름으로 사용자님의 Gemini API 키를 추가하세요.</li>
              <li>3. 키를 추가한 후 프로젝트를 다시 <b>Redeploy</b> 해야 정상 작동합니다.</li>
              <li>4. 현재 화면이 보인다면 빌드는 성공한 것입니다!</li>
            </ul>
            <button onClick={() => setIsShareOpen(false)} className="w-full mt-6 py-3 bg-blue-600 rounded-lg font-bold">확인 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}