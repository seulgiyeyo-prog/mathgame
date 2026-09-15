import { useState, type FormEvent } from 'react';
import { User, Sparkles, Check, Edit2 } from 'lucide-react';
import { UserProfile } from '../types';
import { soundEffects } from '../utils/audio';

interface PlayerNameBannerProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  gameTitle?: string;
  gameIcon?: string;
  compact?: boolean;
}

export default function PlayerNameBanner({
  userProfile,
  onUpdateProfile,
  gameTitle,
  compact = false,
}: PlayerNameBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [studentId, setStudentId] = useState(userProfile.studentId || '');

  const handleSave = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        name: name.trim(),
        studentId: studentId.trim(),
        gradeClass: studentId.trim() || '',
      });
    }
    setIsEditing(false);
    soundEffects.click();
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="w-full bg-slate-900/95 border-2 border-amber-400/80 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{userProfile.avatar}</span>
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>플레이어 정보 수정</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="학번 (예: 10101)"
            maxLength={20}
            className="w-32 sm:w-36 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름/닉네임"
            maxLength={12}
            autoFocus
            className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-bold"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow"
          >
            <Check className="w-3.5 h-3.5" />
            <span>저장</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setName(userProfile.name);
              setStudentId(userProfile.studentId || '');
              setIsEditing(false);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-sm transition-all ${
        compact ? 'text-xs' : ''
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
          {userProfile.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">플레이어:</span>
            <span className="text-sm font-black text-white truncate">
              {userProfile.name || '미등록'}
            </span>
            {userProfile.studentId && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold shrink-0">
                {userProfile.studentId}
              </span>
            )}
          </div>
          {gameTitle && (
            <p className="text-[11px] text-slate-400 truncate">
              {userProfile.name ? `${userProfile.name} 님의 기록으로 실시간 랭킹전에 자동 등록됩니다.` : '학번과 이름을 등록하고 실시간 랭킹에 도전하세요!'}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setName(userProfile.name);
          setStudentId(userProfile.studentId || '');
          setIsEditing(true);
          soundEffects.click();
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold transition-colors shrink-0"
        title="정보 수정"
      >
        <Edit2 className="w-3 h-3" />
        <span>정보 수정</span>
      </button>
    </div>
  );
}
