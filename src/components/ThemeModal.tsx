import { X, Check, Palette, Sparkles } from 'lucide-react';
import { ThemeType } from '../types';
import { THEMES } from '../utils/theme';
import { soundEffects } from '../utils/audio';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

export default function ThemeModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}: ThemeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">테마 스타일 변경</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 inline mr-0.5" />
                  실시간 반영
                </span>
              </div>
              <p className="text-xs text-slate-400">마음에 드는 아케이드 테마를 골라보세요!</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.click();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {THEMES.map((th) => {
            const isSelected = currentTheme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => {
                  soundEffects.powerup();
                  onSelectTheme(th.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-indigo-500/15 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{th.icon}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {th.badge}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="font-black text-sm text-white mb-0.5">{th.name}</div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{th.desc}</div>

                {/* Color preview swatch bar */}
                <div className="mt-3 flex items-center gap-1.5">
                  <div className={`w-5 h-2.5 rounded-md ${th.previewBg} border border-slate-700`} />
                  <div className={`w-5 h-2.5 rounded-md ${th.previewAccent}`} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-[11px] text-slate-500">
            💡 선택한 테마는 브라우저에 저장되어 다음 번 접속 시에도 유지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
