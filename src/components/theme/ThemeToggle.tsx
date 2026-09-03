'use client';

import { useState } from 'react';
import { Sun, Moon, Clock, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from './ThemeProvider';

interface ThemeToggleProps {
  variant?: 'dropdown' | 'inline' | 'pills';
}

export function ThemeToggle({ variant = 'dropdown' }: ThemeToggleProps) {
  const { themeMode, effectiveTheme, setThemeMode, isAfterHours } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options: { mode: ThemeMode; label: string; shortLabel: string; subLabel: string; icon: React.ReactNode }[] = [
    {
      mode: 'light',
      label: 'โหมดสว่าง (Light)',
      shortLabel: 'สว่าง',
      subLabel: 'แสดงผลธีมสีขาวสะอาดตา',
      icon: <Sun className="h-3.5 w-3.5 text-amber-500" />,
    },
    {
      mode: 'dark',
      label: 'โหมดมืด (Dark)',
      shortLabel: 'มืด',
      subLabel: 'แสดงผลธีมสีเข้มถนอมสายตา',
      icon: <Moon className="h-3.5 w-3.5 text-indigo-400" />,
    },
    {
      mode: 'auto',
      label: 'ปรับตามเวลาอัตโนมัติ',
      shortLabel: 'อัตโนมัติ',
      subLabel: 'หลัง 18.30 น. สลับเป็นโหมดมืด',
      icon: <Clock className="h-3.5 w-3.5 text-teal-500" />,
    },
  ];

  if (variant === 'inline' || variant === 'pills') {
    return (
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
        {options.map((opt) => {
          const isSelected = themeMode === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setThemeMode(opt.mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-medium text-xs cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={opt.subLabel}
            >
              {opt.icon}
              <span>{opt.shortLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const now = new Date();
  const timeFormatted = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none shadow-xs"
      >
        {effectiveTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-indigo-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
        <span className="hidden sm:inline">
          {themeMode === 'auto'
            ? `อัตโนมัติ (${isAfterHours ? 'ธีมมืด' : 'ธีมสว่าง'})`
            : themeMode === 'dark'
            ? 'โหมดมืด'
            : 'โหมดสว่าง'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>เลือกโหมดการแสดงผล (Theme)</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ปัจจุบันเวลา {timeFormatted} น. ({isAfterHours ? 'ช่วงหลัง 18.30 น.' : 'ช่วงกลางวัน'})
            </p>
          </div>

          <div className="py-1 space-y-1">
            {options.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  onClick={() => {
                    setThemeMode(opt.mode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{opt.subLabel}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
