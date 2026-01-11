import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, BrainCircuit, ArrowUp, Loader2, X, Globe, Image as ImageIcon, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, options: { deepThink: boolean; search: boolean; image?: string }) => void;
  onStop?: () => void;
  disabled: boolean;
  isCompact?: boolean;
  tavilyKey?: string;
  onSaveTavilyKey?: (key: string) => void;
  apiKey?: string;
  onFileUpload?: (filename: string) => void;
  sessionId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStop, disabled, isCompact = false, tavilyKey, onSaveTavilyKey, apiKey, onFileUpload, sessionId }) => {
  const [text, setText] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isDeepThinkActive, setIsDeepThinkActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Settings Popup state
  const [showSearchSettings, setShowSearchSettings] = useState(false);
  const [tempKey, setTempKey] = useState(tavilyKey || '');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSearchSettings(false);
      }
    };
    if (showSearchSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchSettings]);

  // Sync temp key when prop changes
  useEffect(() => {
    setTempKey(tavilyKey || '');
  }, [tavilyKey]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleSend = () => {
    if ((!text.trim() && !attachedImage) || disabled) return;
    onSend(text, { deepThink: isDeepThinkActive, search: isSearchActive, image: attachedImage || undefined });
    setText('');
    setAttachedImage(null);
    // Keep toggles active for subsequent messages
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveSettings = () => {
    if (onSaveTavilyKey) {
      onSaveTavilyKey(tempKey.trim());
    }
    // If key is present and toggle was hit, we keep it active. 
    // If key is empty, we force search off.
    if (!tempKey.trim()) {
        setIsSearchActive(false);
    }
    setShowSearchSettings(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (apiKey) {
      formData.append('apiKey', apiKey);
    }
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.chunks_added === 0) {
          alert(`File uploaded, but no text could be extracted. It might be an image-based PDF or empty.`);
      } else {
          // Optional: alert(`File uploaded successfully! Added ${data.chunks_added} chunks.`);
      }

      if (onFileUpload) {
          onFileUpload(file.name);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      let msg = 'Failed to upload file.';
      if (error.message.includes('Authentication Error') || error.message.includes('API Key')) {
          msg += ' Please check your API Key in settings.';
      } else {
          msg += ' Make sure the backend is running on port 8000.';
      }
      alert(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className={`relative transition-all duration-300 w-full max-w-3xl mx-auto ${isCompact ? 'mb-4' : 'mb-8'}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept=".pdf,.docx,.txt"
      />
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        onChange={handleImageSelect}
        accept="image/*"
      />

      {/* Internet Search Settings Menu */}
      {showSearchSettings && (
        <div 
          ref={settingsRef}
          className="absolute bottom-full mb-3 left-0 w-80 z-[100] p-4 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Globe size={16} className="text-blue-500" />
              Internet Search Settings
            </h3>
            <button onClick={() => setShowSearchSettings(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status Toggle */}
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
               <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Enable Search</span>
               <button 
                 onClick={() => setIsSearchActive(!isSearchActive)}
                 className={`w-10 h-5 rounded-full transition-all relative ${isSearchActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSearchActive ? 'left-6' : 'left-1'}`} />
               </button>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Tavily API Key
              </label>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="tvly-..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-gray-100"
              />
              <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                Required for real-time web access. <a href="https://tavily.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Get key</a>
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
      
      <div 
        className={`bg-white dark:bg-[#1a1a1a] border transition-all duration-200 rounded-2xl p-3 flex flex-col gap-2 
          ${isCompact ? 'shadow-lg border-gray-200 dark:border-gray-800' : 'shadow-xl border-gray-200 dark:border-gray-800 min-h-[140px]'}
          focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-700 focus-within:border-gray-300 dark:focus-within:border-gray-700
        `}
      >
        {/* Image Preview */}
        {attachedImage && (
            <div className="relative w-fit mb-2">
                <img src={attachedImage} alt="Preview" className="h-16 w-auto rounded-lg border border-gray-200 dark:border-gray-700" />
                <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-0.5 hover:bg-gray-700"
                >
                    <X size={12} />
                </button>
            </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="How can I help you today?"
          className="w-full resize-none border-none outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent text-base p-1 max-h-[200px] overflow-y-auto"
          rows={1}
          style={{ minHeight: isCompact ? '24px' : '40px' }}
        />

        {/* Input Controls */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2">
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
               title="Upload to Knowledge Base (RAG)"
             >
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
             </button>

             <button 
               onClick={() => imageInputRef.current?.click()}
               className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
               title="Attach Image"
             >
                <ImageIcon size={20} />
             </button>
             
             <button 
               onClick={() => setShowSearchSettings(!showSearchSettings)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                 isSearchActive 
                   ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                   : 'bg-white dark:bg-[#262626] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
               }`}
             >
               <Search size={16} />
               Internet Search
             </button>

             <button 
               onClick={() => setIsDeepThinkActive(!isDeepThinkActive)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                 isDeepThinkActive 
                   ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                   : 'bg-indigo-50/50 dark:bg-[#262626] text-gray-600 dark:text-gray-400 border border-indigo-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-800'
               }`}
             >
               <BrainCircuit size={16} className={isDeepThinkActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"} />
               Deep Think
             </button>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-gray-300 dark:text-gray-600 font-bold hidden sm:inline">FreeGPT</span>
             
             {disabled && onStop ? (
                <button 
                   onClick={onStop}
                   className="p-2 rounded-lg transition-all bg-black dark:bg-white text-white dark:text-black hover:opacity-80"
                   title="Stop Generation"
                 >
                   <Square size={20} fill="currentColor" />
                 </button>
             ) : (
                <button 
                   onClick={handleSend}
                   disabled={(!text.trim() && !attachedImage) || disabled}
                   className={`p-2 rounded-lg transition-all ${
                     (text.trim() || attachedImage) && !disabled
                       ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
                       : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                   }`}
                 >
                   <ArrowUp size={20} />
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;