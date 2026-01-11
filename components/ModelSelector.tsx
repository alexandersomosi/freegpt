import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Key, Zap } from 'lucide-react';
import { MODELS } from '../constants';

interface ModelSelectorProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  apiKeys: Record<string, string>;
  setApiKeys: (keys: Record<string, string>) => void;
  apiEndpoint: string;
  setApiEndpoint: (endpoint: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  currentModelId, 
  onSelectModel,
  apiKeys,
  setApiKeys,
  apiEndpoint,
  setApiEndpoint
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModel = MODELS.find(m => m.id === currentModelId);
  const displayModelName = selectedModel ? selectedModel.name : currentModelId;
  const displayProvider = selectedModel ? selectedModel.provider : 'OpenRouter'; // Default to OpenRouter for custom

  // Local state for the key input
  const [localKey, setLocalKey] = useState(apiKeys[displayProvider] || '');
  const [isSaved, setIsSaved] = useState(false);

  // Sync local key when provider changes or global keys update
  useEffect(() => {
    setLocalKey(apiKeys[displayProvider] || '');
    setIsSaved(false);
  }, [displayProvider, apiKeys]);

  const handleSaveKey = () => {
    setApiKeys({
      ...apiKeys,
      [displayProvider]: localKey
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Group models by provider
  const groupedModels = MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof MODELS>);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 md:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      >
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate max-w-[120px] md:max-w-[200px]">
          {displayModelName}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[340px] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Connection Config Section */}
          <div className="p-2 mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
            {/* API Endpoint */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Zap size={10} /> API Endpoint / Proxy
              </label>
              <input 
                type="text" 
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="e.g. http://localhost:8000"
                className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Key size={10} /> API Key for {displayProvider}
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={localKey}
                  onChange={(e) => {
                    setLocalKey(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder={`Enter ${displayProvider} Key...`}
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                />
                <button
                  onClick={handleSaveKey}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isSaved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>

            {/* Search API Key */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Zap size={10} /> Search API Key (Tavily)
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={apiKeys['Tavily'] || ''}
                  onChange={(e) => setApiKeys({...apiKeys, Tavily: e.target.value})}
                  placeholder="tvly-..."
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="mb-2 last:mb-0">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {provider}
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      // Don't close immediately to let them see selection or change key
                      // setIsOpen(false); 
                    }}
                    className={`w-full text-left px-2 py-2 rounded-lg flex items-start gap-3 transition-colors ${
                      currentModelId === model.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`mt-0.5 ${currentModelId === model.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                      {currentModelId === model.id ? <Check size={14} /> : <Zap size={14} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{model.name}</div>
                      <div className="text-[10px] opacity-70 leading-tight">{model.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            
            {/* Custom Model Input */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
               <button 
                  onClick={() => {
                    // If a standard model is selected, switch to custom mode to show OpenRouter key input
                    if (MODELS.find(m => m.id === currentModelId)) {
                      onSelectModel(""); 
                    }
                  }}
                  className="w-full text-left px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-blue-500 transition-colors cursor-pointer"
               >
                  OpenRouter
               </button>
               <div className="px-2 pb-2">
                 <input 
                    type="text" 
                    placeholder="e.g. anthropic/claude-3-opus" 
                    className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                       !MODELS.find(m => m.id === currentModelId) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    value={!MODELS.find(m => m.id === currentModelId) ? currentModelId : ''}
                    onChange={(e) => onSelectModel(e.target.value)}
                 />
                 <p className="text-[10px] text-gray-400 mt-1">
                   Enter any model ID supported by your provider (e.g. OpenRouter).
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;