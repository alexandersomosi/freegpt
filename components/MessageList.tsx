import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, User } from '../types';
import { Bot, Copy, ThumbsUp, ThumbsDown, RotateCcw, Pencil, Check, X } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  user: User;
  onEditMessage?: (id: string, newContent: string) => void;
}

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="rounded-md overflow-hidden my-2 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400 lowercase">{language}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        {...props}
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0 }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={`${className} bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5`} {...props}>
      {children}
    </code>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages, isStreaming, user, onEditMessage }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEditing = (id: string) => {
    if (onEditMessage && editContent.trim()) {
      onEditMessage(id, editContent);
      setEditingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {messages.map((msg, index) => (
        <div key={msg.id} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group ${msg.role === 'system' ? 'justify-center' : ''}`}>
          
          {msg.role === 'system' ? (
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <Check size={12} />
                <span>{msg.content}</span>
            </div>
          ) : (
          <>
          {/* Avatar */}
          <div className="flex-shrink-0 mt-1">
            {msg.role === 'user' ? (
              <div className={`${user.avatarColor} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                {user.initials}
              </div>
            ) : (
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black transition-colors">
                <div className="font-bold text-xs">F</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {msg.role === 'user' ? user.name : 'FreeGPT'}
              </span>
              {/* Edit Button for User */}
              {msg.role === 'user' && !editingId && onEditMessage && (
                <button 
                  onClick={() => startEditing(msg)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="Edit message"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            
            {/* Grounding / Search Results */}
            {msg.groundingSources && msg.groundingSources.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                 {msg.groundingSources.map((source, idx) => (
                   <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 truncate max-w-[200px] block transition-colors"
                   >
                     {source.title || source.uri}
                   </a>
                 ))}
              </div>
            )}

            {/* Attached Image */}
            {msg.image && (
                <div className="mb-3">
                    <img 
                        src={msg.image} 
                        alt="User uploaded" 
                        className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                    />
                </div>
            )}

            <div className="prose prose-sm prose-gray dark:prose-invert max-w-none markdown-body text-gray-800 dark:text-gray-300 leading-relaxed">
              {editingId === msg.id ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-transparent border-none outline-none resize-none text-sm"
                        rows={Math.max(2, editContent.split('\n').length)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button 
                            onClick={cancelEditing}
                            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => saveEditing(msg.id)}
                            className="px-3 py-1 text-xs font-medium bg-black dark:bg-white text-white dark:text-black hover:opacity-80 rounded transition-opacity"
                        >
                            Save & Submit
                        </button>
                    </div>
                </div>
              ) : (
                msg.role === 'model' && !msg.content ? (
                    <div className="flex items-center gap-1 h-6 mt-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                ) : (
                    <ReactMarkdown components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                )
              )}
            </div>
            
            {msg.role === 'model' && (
               <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton icon={Copy} />
                  <ActionButton icon={RotateCcw} />
                  <div className="h-3 border-r border-gray-200 dark:border-gray-700 mx-1"></div>
                  <ActionButton icon={ThumbsUp} />
                  <ActionButton icon={ThumbsDown} />
               </div>
            )}
          </div>
          </>
          )}
        </div>
      ))}
      
      {isStreaming && messages[messages.length - 1]?.role !== 'model' && (
        <div className="flex gap-4">
           <div className="flex-shrink-0 mt-1">
             <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black transition-colors">
                <div className="font-bold text-xs">F</div>
              </div>
           </div>
           <div className="flex-1">
             <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">FreeGPT</div>
             <div className="flex items-center gap-1 h-6">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
           </div>
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

const ActionButton = ({ icon: Icon }: { icon: any }) => (
  <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
    <Icon size={14} />
  </button>
)

export default MessageList;