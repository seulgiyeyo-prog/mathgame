import { useState, useEffect } from 'react';
import Header from './components/Header';
import LiveTicker from './components/LiveTicker';
import GameSelector from './components/GameSelector';
import LeaderboardModal from './components/LeaderboardModal';
import StartGameModal from './components/StartGameModal';
import ErrorBoundary from './components/ErrorBoundary';
import OmokGame from './components/games/OmokGame';
import BaseballGame from './components/games/BaseballGame';
import NimGame from './components/games/NimGame';
import ChessGame from './components/games/ChessGame';
import MarioGame from './components/games/MarioGame';
import { GameType, UserProfile, ThemeType } from './types';
import { getUserProfile, saveUserProfile } from './utils/storage';
import { getSavedTheme, applyThemeToDocument, saveTheme } from './utils/theme';

const GAME_INFO: Record<GameType, { title: string; icon: string }> = {
  mario: { title: '마리오 점프런', icon: '🍄' },
  baseball: { title: '숫자 야구', icon: '⚾' },
  omok: { title: '진검승부 오목', icon: '⚔️' },
  nim: { title: '수학 님 게임', icon: '📐' },
  chess: { title: '클래식 체스', icon: '♟️' },
};

export default function App() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [pendingGame, setPendingGame] = useState<GameType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [leaderboardGame, setLeaderboardGame] = useState<GameType>('mario');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => getSavedTheme());

  // Apply theme on load and theme change
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  const handleSelectTheme = (newTheme: ThemeType) => {
    setCurrentTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // Called when user selects a game from hub or banner
  const handleRequestStartGame = (game: GameType) => {
    // If user already has both studentId and name, start directly
    if (userProfile.studentId?.trim() && userProfile.name?.trim()) {
      setActiveGame(game);
    } else {
      // Otherwise, open the modal to input studentId and name first
      setPendingGame(game);
    }
  };

  const handleConfirmStartGame = (updatedProfile: UserProfile) => {
    handleUpdateProfile(updatedProfile);
    if (pendingGame) {
      setActiveGame(pendingGame);
      setPendingGame(null);
    }
  };

  const handleOpenLeaderboard = (game?: GameType) => {
    if (game && GAME_INFO[game]) {
      setLeaderboardGame(game);
    } else if (activeGame && GAME_INFO[activeGame]) {
      setLeaderboardGame(activeGame);
    } else {
      setLeaderboardGame('mario');
    }
    setIsLeaderboardOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      {/* Sticky Header with Theme & Sound controls */}
      <Header
        activeGame={activeGame}
        onSelectGame={(game) => {
          if (game) handleRequestStartGame(game);
          else setActiveGame(null);
        }}
        onOpenLeaderboard={handleOpenLeaderboard}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Real-time Ticker */}
      <LiveTicker onOpenLeaderboard={() => handleOpenLeaderboard()} />

      {/* Main Content Viewport wrapped in ErrorBoundary */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <ErrorBoundary fallbackTitle="게임을 불러오는 중 문제가 발생했습니다">
          {activeGame === null && (
            <GameSelector
              onSelectGame={handleRequestStartGame}
              onOpenLeaderboard={handleOpenLeaderboard}
            />
          )}

          {activeGame === 'omok' && (
            <OmokGame
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={handleOpenLeaderboard}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {activeGame === 'baseball' && (
            <BaseballGame
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={handleOpenLeaderboard}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {activeGame === 'nim' && (
            <NimGame
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={handleOpenLeaderboard}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {activeGame === 'chess' && (
            <ChessGame
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={handleOpenLeaderboard}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {activeGame === 'mario' && (
            <MarioGame
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onOpenLeaderboard={handleOpenLeaderboard}
              onBackToHub={() => setActiveGame(null)}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Global Real-time Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        initialGame={leaderboardGame}
      />

      {/* Pre-Game Student ID & Name Registration Modal */}
      {pendingGame && (
        <StartGameModal
          isOpen={Boolean(pendingGame)}
          gameType={pendingGame}
          gameTitle={GAME_INFO[pendingGame]?.title || '게임'}
          gameIcon={GAME_INFO[pendingGame]?.icon || '🎮'}
          userProfile={userProfile}
          onStart={handleConfirmStartGame}
          onCancel={() => setPendingGame(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            🎮 <strong>중1 챔피언 아케이드</strong> · 오목 · 숫자야구 · 님게임 · 체스 · 마리오 점프런
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Developed & Designed by <strong className="ml-1 text-amber-400 font-bold">Seulgi Jeong</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
