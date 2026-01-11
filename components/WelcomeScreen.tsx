import React from 'react';
import { QUICK_ACTIONS } from '../constants';

interface WelcomeScreenProps {
  onQuickAction: (label: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onQuickAction }) => {
  return (
    <div className="flex flex-col items-center justify-start h-full pt-[15vh] pb-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-semibold text-gray-700 dark:text-gray-200 text-center tracking-tight px-4 transition-colors">
        Hi, how can I help you?
      </h1>
      
      {/* 
        Spacer to reserve visual space for the ChatInput which is absolutely positioned 
        in the center of the screen by the parent component.
      */}
      <div className="h-[220px] w-full pointer-events-none"></div>
    </div>
  );
};

export default WelcomeScreen;