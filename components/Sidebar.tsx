import React, { useState } from 'react';
import { Plus, ChevronLeft, Trash2, PanelLeftClose, Database } from 'lucide-react';
import { ChatSession } from '../types';
import FileManagementModal from './FileManagementModal';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  history: ChatSession[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  history, 
  onNewChat,
  onSelectChat,
  onDeleteChat
}) => {
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);

  // Group history by date (simplified for now)
  const groupedHistory = history.reduce((acc, session) => {
    const group = session.dateGroup;
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  if (!isOpen) return null;

  return (
    <>
    <div 
      className={`
        fixed lg:relative inset-y-0 left-0 z-[60] bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
        w-64 flex flex-col
      `}
    >
      <div className="p-4 flex items-center justify-between gap-2">
        <button 
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) toggleSidebar();
          }}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Chat
        </button>
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
          title="Close Sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
        {Object.entries(groupedHistory).map(([group, sessions]) => (
          <div key={group} className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {group}
            </h3>
            <div className="space-y-1">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => onSelectChat(session.id)}
                  className="group relative flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                  <span className="truncate pr-6">{session.title}</span>
                  
                  {/* Delete Button - Visible on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this chat?')) {
                        onDeleteChat(session.id);
                      }
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md text-gray-400 hover:text-red-500 transition-all z-10"
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    
    <FileManagementModal 
        isOpen={isFilesModalOpen} 
        onClose={() => setIsFilesModalOpen(false)} 
    />
    </>
  );
};

export default Sidebar;