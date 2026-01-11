import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, Type, Monitor, MessageSquare } from 'lucide-react';
import { AppSettings, User } from '../types';

interface UserMenuProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  user: User;
  onUpdateUser: (user: User) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  settings, 
  onUpdateSettings,
  user,
  onUpdateUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSettings = () => {
    setIsOpen(false);
    setShowSettingsModal(true);
  };

  const updateTheme = (theme: AppSettings['theme']) => {
    onUpdateSettings({ ...settings, theme });
  };

  const updateFontSize = (fontSize: AppSettings['fontSize']) => {
    onUpdateSettings({ ...settings, fontSize });
  };
  
  const updateSystemInstruction = (instruction: string) => {
    onUpdateSettings({ ...settings, systemInstruction: instruction });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    // Auto-generate initials
    const newInitials = newName
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
      
    onUpdateUser({
      ...user,
      name: newName,
      initials: newInitials || 'U' // Default to U if empty
    });
  };

  return (
    <>
      {/* Avatar Button */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`${user.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium hover:opacity-90 transition-opacity`}
        >
          {user.initials}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            
            {/* User Info Section with Editable Name */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-medium flex-shrink-0`}>
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block mb-0.5">Display Name</label>
                  <input 
                    type="text" 
                    value={user.name}
                    onChange={handleNameChange}
                    className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-all py-0.5"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={openSettings}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
            >
              <Settings size={16} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
              <span>Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* System Instructions Section */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                       <MessageSquare size={18} />
                       <h3>System Instructions</h3>
                    </div>
                    <textarea 
                        value={settings.systemInstruction || ''}
                        onChange={(e) => updateSystemInstruction(e.target.value)}
                        placeholder="e.g., You are a helpful assistant. Always answer in Hungarian."
                        className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        These instructions will be prepended to every conversation.
                    </p>
                 </div>

                 <div className="border-t border-gray-100 dark:border-gray-800"></div>

                 {/* Font Size Section */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                       <Type size={18} />
                       <h3>Font Size</h3>
                    </div>
                    <div className="flex gap-2">
                       {(['small', 'medium', 'large'] as const).map((size) => (
                         <button 
                           key={size}
                           onClick={() => updateFontSize(size)}
                           className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                             settings.fontSize === size
                               ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                               : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                           }`}
                         >
                           {size}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="border-t border-gray-100 dark:border-gray-800"></div>

                 {/* Theme Section */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
                       <Monitor size={18} />
                       <h3>Theme</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       {/* Light */}
                       <button 
                         onClick={() => updateTheme('light')}
                         className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            settings.theme === 'light' 
                              ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800' 
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                         }`}
                       >
                          <div className="w-full h-8 bg-white border border-gray-200 rounded-md shadow-sm"></div>
                          <span className={`text-xs font-semibold ${settings.theme === 'light' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Light</span>
                       </button>

                       {/* Dark */}
                       <button 
                         onClick={() => updateTheme('dark')}
                         className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            settings.theme === 'dark' 
                              ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800' 
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                         }`}
                       >
                          <div className="w-full h-8 bg-gray-900 rounded-md shadow-sm"></div>
                          <span className={`text-xs font-semibold ${settings.theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Dark</span>
                       </button>

                       {/* System */}
                       <button 
                         onClick={() => updateTheme('system')}
                         className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            settings.theme === 'system' 
                              ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800' 
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                         }`}
                       >
                          <div className="w-full h-8 bg-gradient-to-br from-white to-gray-200 dark:from-gray-700 dark:to-gray-900 rounded-md shadow-sm"></div>
                          <span className={`text-xs font-semibold ${settings.theme === 'system' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>System</span>
                       </button>
                    </div>
                 </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-950 px-6 py-4 flex justify-end border-t border-gray-100 dark:border-gray-800">
                 <button 
                   onClick={() => setShowSettingsModal(false)}
                   className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                 >
                   Done
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;