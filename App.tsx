import React, { useState, useEffect } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { SceneCard } from './SceneCard';
import { CharacterCard } from './CharacterCard';
import { Mixboard } from './Mixboard';
import { analyzeScript, generateImage } from './geminiService';
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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: AspectRatio.LANDSCAPE,
    resolution: Resolution.RES_1K,
    engine: Engine.NANO_BANANA,
    targetSceneCount: 20,
    totalParts: 0
  });

  // 컴포넌트 마운트 시 로컬스토리지에서 API 키 로드
  useEffect(() => {
    const savedApiKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // API 키 저장 함수
  const handleSaveApiKey = () => {
    if (!tempApiKey.trim()) {
      alert('API 키를 입력해주세요.');
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setTempApiKey('');
    setIsApiKeyModalOpen(false);
    alert('API 키가 저장되었습니다!');
  };

  // API 키 삭제 함수
  const handleRemoveApiKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKey('');
    alert('API 키가 삭제되었습니다.');
  };

  const handleSplit = () => {
    if (!bulkScript.trim()) return alert("대본을 입력해주세요.");
    // 3000자 단위로 분할하여 AI가 처리하기 쉽게 만듬
    const parts = bulkScript.match(/[\s\S]{1,3000}/g) || [bulkScript];
    setScriptParts(parts);
    setIsBulkMode(false);
  };

  const handleAnalyze = async () => {
    if (scriptParts.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeScript(scriptParts, settings.targetSceneCount);
      setScenes(res.scenes);
      setCharacters(res.characters);
    } catch (e) {
      console.error(e);
      alert("분석 중 오류가 발생했습니다. API 키가 유효한지 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const genImage = async (id: string, type: 'scene' | 'character') => {
    // 상태 업데이트: 생성 중 표시
    if (type === 'scene') {
      setScenes(prev => prev.map(s => s.id === id ? {...s, status: 'generating'} : s));
    } else {
      setCharacters(prev => prev.map(c => c.id === id ? {...c, status: 'generating'} : c));
    }

    try {
      const list = type === 'scene' ? scenes : characters;
      const item = list.find(x => x.id === id);
      if (!item) return;

      const prompt = type === 'scene' ? (item as Scene).imagePrompt : (item as Character).description;
      const url = await generateImage(prompt, settings.engine, settings.aspectRatio, settings.resolution);
      const asset = { id: crypto.randomUUID(), url, prompt, createdAt: Date.now() };
      
      if (type === 'scene') {
        setScenes(prev => prev.map(s => s.id === id ? {
          ...s, 
          status: 'completed', 
          imageUrl: url, 
          history: [asset, ...(s.history || [])]
        } : s));
      } else {
        setCharacters(prev => prev.map(c => c.id === id ? {
          ...c, 
          status: 'completed', 
          imageUrl: url, 
          history: [asset, ...(c.history || [])]
        } : c));
      }
    } catch (e) {
      console.error(e);
      if (type === 'scene') {
        setScenes(prev => prev.map(s => s.id === id ? {...s, status: 'failed'} : s));
      } else {
        setCharacters(prev => prev.map(c => c.id === id ? {...c, status: 'failed'} : c));
      }
    }
  };

  const handleBatchGen = async () => {
    if (scenes.length === 0) return;
    setIsGenerating(true);
    // 순차적으로 생성하여 오류 방지
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
          <button 
            onClick={() => { setIsBulkMode(true); setScenes([]); setCharacters([]); }} 
            className="px-4 py-2 bg-gray-700 rounded-lg text-xs"
          >
            새 프로젝트
          </button>
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
            onConnectKey={() => setIsApiKeyModalOpen(true)} 
          />
        </aside>

        <section className="col-span-9 space-y-6">
          {isBulkMode ? (
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center">
              <h2 className="text-2xl font-bold mb-4">대본 전체 입력 (최대 1만 자)</h2>
              <textarea 
                value={bulkScript} 
                onChange={e => setBulkScript(e.target.value)} 
                className="w-full h-80 bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="여기에 대본을 붙여넣으세요..." 
              />
              <button 
                onClick={handleSplit} 
                className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition-transform active:scale-95"
              >
                대본 분석 시작하기
              </button>
            </div>
          ) : (
            <div className="space-y-6">
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
                  {/* 분석 제어 바 */}
                  <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold">분석 대기 중</p>
                      <p className="text-xs text-gray-500">{scriptParts.length}개의 데이터 블록이 준비되었습니다.</p>
                    </div>
                    <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing} 
                      className="px-6 py-2 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isAnalyzing ? "AI 분석 중..." : "✨ AI 스토리보드 추출"}
                    </button>
                  </div>
                  
                  {/* 캐릭터 카드 섹션 */}
                  {characters.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">주요 등장인물</h3>
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

                  {/* 장면 리스트 섹션 */}
                  {scenes.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">추출된 장면 ({scenes.length})</h3>
                        <button 
                          onClick={handleBatchGen} 
                          disabled={isGenerating} 
                          className="px-6 py-2 bg-green-600 rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 text-sm"
                        >
                          {isGenerating ? "이미지 생성 중..." : "장면 전체 이미지 생성 🚀"}
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
            </div>
          )}
        </section>
      </main>

      {/* 안내 팝업 */}
      {isShareOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setIsShareOpen(false)}>
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-blue-400">Vercel 배포 성공 가이드</h2>
            <div className="space-y-4 text-sm text-gray-300">
              <p>현재 이 화면이 보인다면 <b>빌드 및 배포에 성공</b>한 것입니다!</p>
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                <p className="font-bold text-white mb-2">필수 설정:</p>
                <ol className="list-decimal ml-4 space-y-2">
                  <li>Vercel 대시보드 - Settings - Environment Variables 접속</li>
                  <li><b>API_KEY</b>라는 이름으로 Gemini API 키 추가</li>
                  <li>키 추가 후 프로젝트를 다시 <b>Redeploy</b> 해야 작동합니다.</li>
                </ol>
              </div>
            </div>
            <button onClick={() => setIsShareOpen(false)} className="w-full mt-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors">확인했습니다</button>
          </div>
        </div>
      )}
    </div>

      {/* API 키 입력 모달 */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]" onClick={() => setIsApiKeyModalOpen(false)}>
          <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-blue-400">🔑 Gemini API 키 설정</h2>
            
            {apiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 rounded-lg border border-green-700">
                  <p className="text-green-300 text-sm">✅ API 키가 저장되어 있습니다</p>
                  <p className="text-gray-400 text-xs mt-1">키: {apiKey.substring(0, 10)}...</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleRemoveApiKey} 
                    className="flex-1 py-2 bg-red-600 rounded-lg font-bold hover:bg-red-500 transition-colors text-sm"
                  >
                    키 삭제
                  </button>
                  <button 
                    onClick={() => setIsApiKeyModalOpen(false)} 
                    className="flex-1 py-2 bg-gray-600 rounded-lg font-bold hover:bg-gray-500 transition-colors text-sm"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
                  <p className="text-yellow-300 text-sm">⚠️ API 키가 필요합니다</p>
                  <p className="text-gray-400 text-xs mt-1">Google AI Studio에서 Gemini API 키를 발급받으세요</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">API 키 입력</label>
                  <input 
                    type="password"
                    value={tempApiKey}
                    onChange={e => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>에서 API 키 발급</p>
                  <p>• 키는 브라우저에만 저장되며 외부로 전송되지 않습니다</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveApiKey} 
                    className="flex-1 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors"
                    disabled={!tempApiKey.trim()}
                  >
                    저장
                  </button>
                  <button 
                    onClick={() => setIsApiKeyModalOpen(false)} 
                    className="flex-1 py-3 bg-gray-600 rounded-lg font-bold hover:bg-gray-500 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
