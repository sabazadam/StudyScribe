'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export default function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-background dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex-1 min-w-[150px] px-4 py-3 rounded-lg font-semibold text-sm
                transition-all duration-200 flex items-center justify-center gap-2
                ${isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted dark:text-text-dark-muted hover:text-primary dark:hover:text-cerulean hover:bg-primary/5'
                }
              `}
            >
              {tab.icon && (
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  px-2 py-0.5 text-xs rounded-full font-medium
                  ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTabContent}
      </div>
    </div>
  );
}
