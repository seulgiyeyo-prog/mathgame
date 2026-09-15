import { useState, type FormEvent } from 'react';
import { Trophy, Volume2, VolumeX, User, Sparkles, ArrowLeft, Gamepad2, Palette } from 'lucide-react';
import { UserProfile, GameType, ThemeType } from '../types';
import { isSoundEnabled, setSoundEnabled, soundEffects } from '../utils/audio';
import ThemeModal from './ThemeModal';

interface HeaderProps {
  activeGame: GameType | null;
  onSelectGame: (game: GameType | null) => void;
  onOpenLeaderboard: (initialGame?: GameType) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

export default function Header({
  activeGame,
  onSelectGame,
  onOpenLeaderboard,
  userProfile,
  onUpdateProfile,
  currentTheme,
  onSelectTheme,
}: HeaderProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);
  const [tempStudentId, setTempStudentId] = useState(userProfile.studentId || '');
  const [tempAvatar, setTempAvatar] = useState(userProfile.avatar);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) soundEffects.click();
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    onUpdateProfile({
      ...userProfile,
      name: tempName.trim(),
      studentId: tempStudentId.trim(),
      gradeClass: tempStudentId.trim() || '',
      avatar: tempAvatar,
    });
    setIsEditingProfile(false);
    soundEffects.click();
  };

  const avatars = ['🎮', '⚡', '🔥', '👑', '🥋', '⚾', '🍄', '⭐', '🚀', '🎯'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-3">
          {activeGame ? (
            <button
              id="back-to-hub-btn"
              onClick={() => {
                soundEffects.click();
                onSelectGame(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>게임 선택</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Gamepad2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-1">
                    중1 <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">챔피언 아케이드</span>
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                    중학생 전용
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  오목 · 숫자야구 · 님게임 · 체스 · 마리오 점프런
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls, User profile, Leaderboard */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Tag */}
          <button
            id="profile-badge-btn"
            onClick={() => {
              setTempName(userProfile.name);
              setTempStudentId(userProfile.studentId || '');
              setTempAvatar(userProfile.avatar);
              setIsEditingProfile(true);
              soundEffects.click();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all hover:border-amber-400/40 text-left"
            title="플레이어 정보 수정"
          >
            <span className="text-lg leading-none">{userProfile.avatar}</span>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {userProfile.name || '플레이어'}
              </div>
              {userProfile.studentId && (
                <div className="text-[10px] text-amber-400 font-medium">
                  {userProfile.studentId}
                </div>
              )}
            </div>
            <User className="w-3.5 h-3.5 text-slate-400 md:hidden" />
          </button>

          {/* Leaderboard Button */}
          <button
            id="open-leaderboard-btn"
            onClick={() => {
              soundEffects.click();
              onOpenLeaderboard(activeGame || undefined);
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
          >
            <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>실시간 랭킹</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
          </button>

          {/* Theme Selector Button */}
          <button
            id="theme-toggle-btn"
            onClick={() => {
              soundEffects.click();
              setIsThemeModalOpen(true);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 hover:border-indigo-400/50 flex items-center gap-1.5"
            title="테마 스타일 변경"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline text-xs font-bold text-slate-300">테마</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title={soundOn ? '효과음 끄기' : '효과음 켜기'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={onSelectTheme}
      />

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">플레이어 프로필 설정</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              랭킹 등록 및 실시간 학교 대결 시 다른 친구들에게 표시될 이름입니다.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  아바타 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setTempAvatar(av)}
                      className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all ${
                        tempAvatar === av
                          ? 'bg-amber-500/20 border-2 border-amber-400 scale-110'
                          : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  학번
                </label>
                <input
                  type="text"
                  value={tempStudentId}
                  onChange={(e) => setTempStudentId(e.target.value)}
                  placeholder="예: 10101 또는 1학년 2반 15번"
                  maxLength={20}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  이름 / 닉네임
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="예: 홍길동, 오목의달인"
                  maxLength={12}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-sm font-bold rounded-xl transition-colors shadow-md shadow-amber-500/20"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
