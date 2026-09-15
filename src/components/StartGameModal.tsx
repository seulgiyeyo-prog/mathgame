import { useState, type FormEvent } from 'react';
import { Sparkles, Gamepad2, UserCheck, School, ArrowRight } from 'lucide-react';
import { UserProfile, GameType } from '../types';
import { soundEffects } from '../utils/audio';

interface StartGameModalProps {
  isOpen: boolean;
  gameType: GameType;
  gameTitle: string;
  gameIcon: string;
  userProfile: UserProfile;
  onStart: (profile: UserProfile) => void;
  onCancel: () => void;
}

const AVATARS = ['🎮', '⚡', '🔥', '👑', '🥋', '⚾', '🍄', '⭐', '🚀', '🎯', '🦊', '🐯'];

export default function StartGameModal({
  isOpen,
  gameType,
  gameTitle,
  gameIcon,
  userProfile,
  onStart,
  onCancel,
}: StartGameModalProps) {
  const [studentId, setStudentId] = useState(userProfile.studentId || '');
  const [name, setName] = useState(userProfile.name || '');
  const [avatar, setAvatar] = useState(userProfile.avatar || '🎮');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanId = studentId.trim();
    const cleanName = name.trim();

    if (!cleanId) {
      setErrorMsg('학번을 입력해주세요 (예: 10101, 1학년 2반 15번 등)');
      return;
    }
    if (!cleanName) {
      setErrorMsg('이름(또는 닉네임)을 입력해주세요');
      return;
    }

    soundEffects.powerup();
    onStart({
      ...userProfile,
      studentId: cleanId,
      name: cleanName,
      gradeClass: cleanId, // 학번을 학급/소속 표기로도 사용
      avatar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-amber-500/10 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header with target game preview */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
            {gameIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                게임 시작 전 정보 입력
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {gameTitle} 입장하기
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
          🎯 <strong>학번과 이름</strong>을 입력하시면 실시간 전교 랭킹 및 게임 내 전광판에 등록됩니다!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              플레이어 아바타 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    soundEffects.click();
                    setAvatar(av);
                  }}
                  className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all ${
                    avatar === av
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-110 shadow-md shadow-amber-400/30'
                      : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Student ID (학번) Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>학번</span>
              <span className="text-[11px] text-amber-400 font-normal">(필수)</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="예: 10101 또는 1학년 2반 15번"
              maxLength={20}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-sm placeholder-slate-500 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
          </div>

          {/* Student Name (이름) Input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>이름 / 닉네임</span>
              <span className="text-[11px] text-amber-400 font-normal">(필수)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="예: 홍길동, 체스왕민준"
              maxLength={12}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-white text-sm placeholder-slate-500 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => {
                soundEffects.click();
                onCancel();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              뒤로가기
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-sm font-black transition-all shadow-lg shadow-amber-400/20 active:scale-98"
            >
              <span>게임 시작하기</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
