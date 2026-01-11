import { ModelOption, ChatSession, User } from './types';
import { LayoutTemplate, Layers, Sparkles, Code, Search } from 'lucide-react';

export const MODELS: ModelOption[] = [
  // Google Models (Official 2025/2026)
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3 Pro', 
    provider: 'Google', 
    description: 'Worlds best model for multimodal understanding and agentic vibe-coding.' 
  },
  { 
    id: 'gemini-3-flash-preview', 
    name: 'Gemini 3 Flash', 
    provider: 'Google', 
    description: 'Balanced for speed, scalability, and breakthrough intelligence.' 
  },
  { 
    id: 'gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    provider: 'Google', 
    description: 'Advanced reasoning for complex code, math, and long context tasks.' 
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    provider: 'Google', 
    description: 'Fast and intelligent with best-in-class price-performance.' 
  },
  { 
    id: 'gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash-Lite', 
    provider: 'Google', 
    description: 'Ultra-fast and cost-efficient version of 2.5 Flash.' 
  },
  { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash', 
    provider: 'Google', 
    description: 'Next-gen features with 1M token context window.' 
  },
  { 
    id: 'gemini-2.0-flash-lite', 
    name: 'Gemini 2.0 Flash-Lite', 
    provider: 'Google', 
    description: 'Optimized for low latency and high volume tasks.' 
  },
  
  // OpenAI Models (Frontier)
  { 
    id: 'gpt-5.2-2025-12-11', 
    name: 'GPT-5.2', 
    provider: 'OpenAI', 
    description: 'The best model for coding and agentic tasks' 
  },
  { 
    id: 'gpt-5.2-pro-2025-12-11', 
    name: 'GPT-5.2 pro', 
    provider: 'OpenAI', 
    description: 'Smarter and more precise responses' 
  },
  { 
    id: 'gpt-5-2025-08-07', 
    name: 'GPT-5', 
    provider: 'OpenAI', 
    description: 'Intelligent reasoning with configurable effort' 
  },
  { 
    id: 'gpt-5-mini-2025-08-07', 
    name: 'GPT-5 mini', 
    provider: 'OpenAI', 
    description: 'Faster, cost-efficient for well-defined tasks' 
  },
  { 
    id: 'gpt-5-nano-2025-08-07', 
    name: 'GPT-5 nano', 
    provider: 'OpenAI', 
    description: 'Fastest, most cost-efficient version' 
  },
  { 
    id: 'gpt-4.1-2025-04-14', 
    name: 'GPT-4.1', 
    provider: 'OpenAI', 
    description: 'Smartest non-reasoning model' 
  },

  // Anthropic Models (Newest)
  { 
    id: 'claude-opus-4-5-20251101', 
    name: 'Claude 4.5 Opus', 
    provider: 'Anthropic', 
    description: 'Highest capability and reasoning' 
  },
  { 
    id: 'claude-sonnet-4-5-20250929', 
    name: 'Claude 4.5 Sonnet', 
    provider: 'Anthropic', 
    description: 'Perfect balance of speed and intelligence' 
  },
  { 
    id: 'claude-haiku-4-5-20251001', 
    name: 'Claude 4.5 Haiku', 
    provider: 'Anthropic', 
    description: 'Ultra-fast and intelligent lightweight model' 
  }
];

export const MOCK_HISTORY: ChatSession[] = [];

export const CURRENT_USER: User = {
  name: 'User',
  initials: 'U',
  avatarColor: 'bg-orange-400'
};

export const QUICK_ACTIONS = [
  { label: 'AI Slides', icon: LayoutTemplate },
  { label: 'Full-Stack', icon: Layers },
  { label: 'Magic Design', icon: Sparkles },
  { label: 'Write Code', icon: Code },
  { label: 'Deep Research', icon: Search },
];