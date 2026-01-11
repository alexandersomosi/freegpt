import React, { useState, useEffect } from 'react';
import { PanelLeft } from 'lucide-react'; // Import PanelLeft icon
import Sidebar from './components/Sidebar';
import ModelSelector from './components/ModelSelector';
import UserMenu from './components/UserMenu';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInput from './components/ChatInput';
import MessageList from './components/MessageList';
import { generateResponseStream } from './services/gemini';
import { Message, ChatSession, AppSettings, User } from './types';
import { MODELS, MOCK_HISTORY, CURRENT_USER } from './constants';
import { GenerateContentResponse } from "@google/genai";

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Configuration State
  const [currentModelId, setCurrentModelId] = useState(() => {
    const saved = localStorage.getItem('currentModelId');
    return saved || MODELS[0].id;
  });

  useEffect(() => {
    localStorage.setItem('currentModelId', currentModelId);
  }, [currentModelId]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('apiKeys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse apiKeys from localStorage", e);
      }
    }
    return {
      Google: '',
      OpenAI: '',
      Anthropic: '',
      OpenRouter: ''
    };
  });
  
  // Persist API Keys
  useEffect(() => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const [apiEndpoint, setApiEndpoint] = useState('http://127.0.0.1:8000');
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    fontSize: 'medium'
  });

  // User State
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }, [user]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(MOCK_HISTORY);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => Date.now().toString());
  
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Derived state to determine if we are in "New Chat" mode
  const isNewChat = messages.length === 0;

  // Handle Theme Changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);
  
  // Load History from Backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/history');
        if (response.ok) {
          const data = await response.json();
          // Sort by newest first (optional, but good UX)
          setHistory(data.reverse()); 
        }
      } catch (error) {
        console.error("Failed to load history from backend:", error);
      }
    };
    
    fetchHistory();
  }, []);

  // Determine font size class
  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  // Save current chat state to history (Local + Backend)
  const saveCurrentSession = async (msgs: Message[]) => {
    if (msgs.length === 0) return;

    let sessionToSave: ChatSession;
    const existingSession = currentSessionId ? history.find(s => s.id === currentSessionId) : null;

    if (existingSession && currentSessionId) {
      // Update existing session
      sessionToSave = { ...existingSession, messages: msgs };
      
      setHistory(prev => prev.map(session => 
        session.id === currentSessionId 
          ? sessionToSave 
          : session
      ));
    } else {
      // Create new session (either ID is null, or ID exists but not in history yet)
      const newId = currentSessionId || Date.now().toString();
      if (!currentSessionId) setCurrentSessionId(newId);

      sessionToSave = {
        id: newId,
        title: msgs[0].content.slice(0, 30) + (msgs[0].content.length > 30 ? '...' : ''),
        dateGroup: 'Today',
        messages: msgs
      };
      setHistory(prev => [sessionToSave, ...prev]);
    }
    
    // Persist to Backend
    try {
      await fetch('http://localhost:8000/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionToSave)
      });
    } catch (error) {
       console.error("Failed to save session to backend:", error);
    }
  };
  
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (text: string, options: { deepThink: boolean; search: boolean; image?: string }, overrideHistory?: Message[]) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image: options.image
    };
    
    // If overrideHistory is provided, use it as the base, otherwise use current messages
    const baseMessages = overrideHistory || messages;
    const newMessages = [...baseMessages, userMsg];
    
    setMessages(newMessages);
    setIsStreaming(true);

    // Determine Session ID immediately
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
        activeSessionId = Date.now().toString();
        setCurrentSessionId(activeSessionId);
        
        // Create new session object immediately
        const newSession = {
            id: activeSessionId,
            title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
            dateGroup: 'Today',
            messages: newMessages
        };
        setHistory(prev => [newSession, ...prev]);
        
        // Persist new session
        fetch('http://localhost:8000/api/history', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newSession)
        }).catch(e => console.error("Failed to save history:", e));
    } else {
        // Update existing session
        saveCurrentSession(newMessages);
    }

    // Placeholder for model message
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      content: '', 
      timestamp: Date.now()
    }]);

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Use the currentModelId directly as the model name since the input is now free text.
      const selectedModel = MODELS.find(m => m.id === currentModelId);
      const modelName = currentModelId;
      
      // Select the correct API key based on provider
      const provider = selectedModel ? selectedModel.provider : 'OpenRouter'; // Default to OpenRouter for custom models
      const currentApiKey = apiKeys[provider] || '';
      const searchApiKey = apiKeys['Tavily'] || '';

      const responseStream = await generateResponseStream({
        modelId: modelName,
        prompt: text,
        history: newMessages,
        enableThinking: options.deepThink,
        enableSearch: options.search,
        apiKey: currentApiKey, // Pass provider-specific key
        searchApiKey: searchApiKey, // Pass search key
        apiEndpoint: apiEndpoint,
        image: options.image,
        signal: controller.signal,
        systemInstruction: settings.systemInstruction,
        sessionId: activeSessionId // Use the explicit local variable
      });

      let fullText = "";
      let groundingSources: any[] = [];

      for await (const chunk of responseStream) {
        // Double check abort (though iterator should stop if wrapped correctly or loop broken)
        if (controller.signal.aborted) break;

        const c = chunk as GenerateContentResponse;
        
        // Extract text
        if (c.text) {
          fullText += c.text;
        }

        // Extract grounding chunks if available (Google Search)
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = c.candidates[0].groundingMetadata.groundingChunks;
          chunks.forEach((chunk: any) => {
            if (chunk.web) {
              groundingSources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          });
        }
        
        // Update the last message in state
        setMessages(prev => {
          const updated = [...prev];
          const index = updated.findIndex(m => m.id === modelMsgId);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              content: fullText
            };
            if (groundingSources.length > 0) {
               // Deduplicate sources based on uri
               const uniqueSources = Array.from(new Map(groundingSources.map(item => [item.uri, item])).values());
               updated[index].groundingSources = uniqueSources;
            }
          }
          // Save updated state to history
          if (currentSessionId) {
             setHistory(h => h.map(s => s.id === currentSessionId ? { ...s, messages: updated } : s));
          }
          return updated;
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Aborted') {
          console.log("Generation stopped by user");
          // Optionally add a "Stopped" indicator to the message
          return;
      }
      console.error("Error generating response:", error);
      let errorMessage = "Sorry, I encountered an error. Please check your connection or API key.";
      
      const errStr = (error.message || error.toString()).toLowerCase();
      if (errStr.includes("api key") || errStr.includes("apikey") || errStr.includes("unauthorized") || errStr.includes("401")) {
         errorMessage = "Invalid or missing API Key. Please click the model selector (top left) to set your API key.";
      }

      setMessages(prev => {
        // Find the empty message we added earlier
        const index = prev.findIndex(m => m.id === modelMsgId);
        
        if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                content: errorMessage
            };
            // Update history if needed
            if (currentSessionId) {
                setHistory(h => h.map(s => s.id === currentSessionId ? { ...s, messages: updated } : s));
            }
            return updated;
        } else {
             // Fallback: Should not happen if logic is correct, but safe fallback
             const updated = [...prev, {
              id: Date.now().toString(),
              role: 'model',
              content: errorMessage,
              timestamp: Date.now()
            }];
            if (currentSessionId) {
               setHistory(h => h.map(s => s.id === currentSessionId ? { ...s, messages: updated } : s));
            }
            return updated;
        }
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleEditMessage = (messageId: string, newContent: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Keep messages before the edited one
    const keptMessages = messages.slice(0, msgIndex);
    
    // Re-send (regenerate) using the new content and the truncated history
    handleSendMessage(newContent, { deepThink: false, search: false }, keptMessages);
  };
  
  const handleFileUploaded = (filename: string) => {
      const systemMsg: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `Uploaded file "${filename}" to knowledge base.`,
          timestamp: Date.now()
      };
      
      const newMessages = [...messages, systemMsg];
      setMessages(newMessages);
      saveCurrentSession(newMessages);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(Date.now().toString());
    setIsStreaming(false);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = history.find(s => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      if (window.innerWidth < 1024) setIsSidebarOpen(false); // Mobile UX
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    // 1. Optimistic UI update
    const updatedHistory = history.filter(s => s.id !== sessionId);
    setHistory(updatedHistory);

    // If deleting current session, clear view
    if (currentSessionId === sessionId) {
      startNewChat();
    }

    // 2. Call Backend
    try {
      await fetch(`http://localhost:8000/api/history/${sessionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
      // Revert if failed (optional, keeping it simple for now)
    }
  };

  return (
    <div className={`flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 ${getFontSizeClass()}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        history={history}
        onNewChat={startNewChat}
        onSelectChat={handleLoadSession}
        onDeleteChat={handleDeleteSession}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full relative min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : ''}`}>
        
        {/* Top Header */}
        <header className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-transparent z-50">
          <div className="flex items-center gap-2 min-w-0 flex-1">
             {/* Sidebar Toggle Button Container - Fixed width to prevent jumping */}
             <div className={`flex-shrink-0 transition-all duration-200 ${!isSidebarOpen ? 'w-10' : 'w-0 overflow-hidden'}`}>
               <button
                 onClick={() => setIsSidebarOpen(true)}
                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                 aria-label="Open Sidebar"
               >
                 <PanelLeft size={20} strokeWidth={1.5} />
               </button>
             </div>
             
             <div className="flex-1 min-w-0">
               <ModelSelector 
                 apiKeys={apiKeys}
                 setApiKeys={setApiKeys}
                 apiEndpoint={apiEndpoint}
                 setApiEndpoint={setApiEndpoint}
                 currentModelId={currentModelId} 
                 onSelectModel={setCurrentModelId} 
               />
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             <UserMenu 
               settings={settings} 
               onUpdateSettings={setSettings}
               user={user}
               onUpdateUser={setUser}
             />
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide relative">
          {isNewChat ? (
            <WelcomeScreen onQuickAction={(label) => handleSendMessage(label, {deepThink: false, search: false})} />
          ) : (
            <MessageList messages={messages} isStreaming={isStreaming} user={user} onEditMessage={handleEditMessage} />
          )}
        </main>

        {/* Floating Input Area */}
        <div className={`
          w-full px-4 pb-6 pt-2 z-20 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900
          ${isNewChat ? 'absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full bg-none' : 'sticky bottom-0 max-w-3xl mx-auto'}
        `}>
           {/* Determine current API Key for Uploads */}
           {(() => {
              const selectedModel = MODELS.find(m => m.id === currentModelId);
              const provider = selectedModel ? selectedModel.provider : 'OpenRouter';
              const currentApiKey = apiKeys[provider] || '';
              
              return (
               <ChatInput 
                 onSend={handleSendMessage} 
                 onStop={handleStopGeneration} 
                 disabled={isStreaming} 
                 isCompact={!isNewChat}
                 tavilyKey={apiKeys['Tavily'] || ''}
                 onSaveTavilyKey={(key) => setApiKeys({...apiKeys, Tavily: key})}
                 apiKey={currentApiKey}
                 onFileUpload={handleFileUploaded}
                 sessionId={currentSessionId || undefined}
               />
              );
           })()}
           {isNewChat && (
             <div className="h-32"></div> // Spacer to push quick actions down
           )}
        </div>

      </div>
    </div>
  );
};

export default App;