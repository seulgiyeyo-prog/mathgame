import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Layers,
  Flame,
  Award,
  Users,
  User,
} from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { marioBGM } from '../../utils/marioAudio';
import { saveLeaderboardEntry } from '../../utils/storage';
import {
  STAGE_DATA,
  getStageById,
  getRandomQuizForStage,
  MarioStage,
  BonusQuiz,
  Platform,
  Goomba,
  Coin,
  MushroomItem,
} from '../../utils/marioStages';
import WinModal from '../WinModal';
import MarioBonusModal from './MarioBonusModal';
import PlayerNameBanner from '../PlayerNameBanner';

interface MarioGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

interface PlayerCharacter {
  id: 'mario' | 'luigi';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  facing: 'left' | 'right';
  isSuper: boolean;
  runFrame: number;
  active: boolean;
  colorHat: string;
  colorShirt: string;
  colorOveralls: string;
}

export default function MarioGame({
  userProfile,
  onUpdateProfile,
  onOpenLeaderboard,
  onBackToHub,
}: MarioGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentStageId, setCurrentStageId] = useState<number>(1);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<BonusQuiz>(() => getRandomQuizForStage(1));
  const [isGameOver, setIsGameOver] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [lastScoreText, setLastScoreText] = useState('');
  const [isSuperMario, setIsSuperMario] = useState(false);
  const [isSuperLuigi, setIsSuperLuigi] = useState(false);
  const [isCoopMode, setIsCoopMode] = useState<boolean>(false);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(() => !marioBGM.getIsMuted());

  // BGM lifecycle
  useEffect(() => {
    marioBGM.start();
    return () => {
      marioBGM.stop();
    };
  }, []);

  const toggleBgm = () => {
    const next = marioBGM.toggleMute();
    setBgmEnabled(next);
    soundEffects.click();
  };

  // Input states for Player 1 (Mario: A/D/W or Touch) and Player 2 (Luigi: Arrows / J/L/I)
  const keysRef = useRef({
    p1Left: false,
    p1Right: false,
    p1Jump: false,
    p2Left: false,
    p2Right: false,
    p2Jump: false,
  });

  // Game internal state ref for 60fps loop
  const gameStateRef = useRef({
    player1: {
      id: 'mario' as const,
      name: '마리오',
      x: 100,
      y: 280,
      vx: 0,
      vy: 0,
      width: 26,
      height: 36,
      grounded: true,
      facing: 'right' as 'left' | 'right',
      isSuper: false,
      runFrame: 0,
      active: true,
      colorHat: '#d82800',
      colorShirt: '#d82800',
      colorOveralls: '#0028a0',
    } as PlayerCharacter,
    player2: {
      id: 'luigi' as const,
      name: '루이지 (짝꿍)',
      x: 60,
      y: 280,
      vx: 0,
      vy: 0,
      width: 26,
      height: 36,
      grounded: true,
      facing: 'right' as 'left' | 'right',
      isSuper: false,
      runFrame: 0,
      active: false,
      colorHat: '#16a34a',
      colorShirt: '#16a34a',
      colorOveralls: '#0028a0',
    } as PlayerCharacter,
    mushrooms: [] as MushroomItem[],
    cameraX: 0,
    platforms: [] as Platform[],
    goombas: [] as Goomba[],
    coins: [] as Coin[],
    score: 0,
    coinsCount: 0,
    distance: 0,
    lives: 3,
    invincibleTimer1: 0,
    invincibleTimer2: 0,
    isOver: false,
    worldWidth: 3800,
    stageId: 1,
    isCoop: false,
  });

  // Init World from Stage
  const initWorld = useCallback(
    (
      stageId = currentStageId,
      preserveScore = false,
      carryScore = 0,
      carryCoins = 0,
      coopModeActive = isCoopMode
    ) => {
      const stage = getStageById(stageId);
      setCurrentStageId(stageId);

      const platforms: Platform[] = stage.platforms.map((p) => ({ ...p, hit: false }));
      const goombas: Goomba[] = stage.goombas.map((g) => ({ ...g, alive: true, squishedTimer: 0 }));
      const coinsList: Coin[] = stage.coins.map((c) => ({ ...c, collected: false }));

      const initialScore = preserveScore ? carryScore : 0;
      const initialCoins = preserveScore ? carryCoins : 0;

      gameStateRef.current = {
        player1: {
          id: 'mario',
          name: userProfile.name || '마리오',
          x: 100,
          y: stage.groundY - 38,
          vx: 0,
          vy: 0,
          width: 26,
          height: 36,
          grounded: true,
          facing: 'right',
          isSuper: false,
          runFrame: 0,
          active: true,
          colorHat: '#d82800',
          colorShirt: '#d82800',
          colorOveralls: '#0028a0',
        },
        player2: {
          id: 'luigi',
          name: '루이지 (짝꿍)',
          x: 55,
          y: stage.groundY - 38,
          vx: 0,
          vy: 0,
          width: 26,
          height: 36,
          grounded: true,
          facing: 'right',
          isSuper: false,
          runFrame: 0,
          active: coopModeActive,
          colorHat: '#16a34a',
          colorShirt: '#16a34a',
          colorOveralls: '#0028a0',
        },
        mushrooms: [],
        cameraX: 0,
        platforms,
        goombas,
        coins: coinsList,
        score: initialScore,
        coinsCount: initialCoins,
        distance: 0,
        lives: 3,
        invincibleTimer1: 0,
        invincibleTimer2: 0,
        isOver: false,
        worldWidth: stage.worldWidth,
        stageId: stage.id,
        isCoop: coopModeActive,
      };

      setScore(initialScore);
      setCoins(initialCoins);
      setDistance(0);
      setLives(3);
      setIsGameOver(false);
      setIsSuperMario(false);
      setIsSuperLuigi(false);
      setWinModalOpen(false);
      setIsBonusModalOpen(false);
    },
    [currentStageId, isCoopMode, userProfile.name]
  );

  const handleGameOver = useCallback(
    (finalScore: number, finalDist: number, finalCoins: number, isWin = false) => {
      gameStateRef.current.isOver = true;
      setIsGameOver(true);

      if (isWin) {
        marioBGM.playStageClear();
      } else {
        marioBGM.playDeath();
      }

      const stage = getStageById(currentStageId);
      const modeLabel = isCoopMode ? '[2인 짝꿍 협동]' : '[1인 솔로]';
      const sub = isWin
        ? `${stage.stageCode} (${stage.name}) ${modeLabel} 완주 골인 클리어! (거리 ${finalDist}m · 코인 ${finalCoins}개)`
        : `${stage.stageCode} (${stage.name}) ${modeLabel} 게임오버 (거리 ${finalDist}m · 코인 ${finalCoins}개)`;
      setLastScoreText(sub);

      saveLeaderboardEntry({
        game: 'mario',
        playerName: isCoopMode ? `${userProfile.name} & 짝꿍(루이지)` : userProfile.name,
        gradeClass: userProfile.gradeClass,
        score: finalScore,
        subText: sub,
        avatar: userProfile.avatar,
      });

      setWinModalOpen(true);
    },
    [userProfile, currentStageId, isCoopMode]
  );

  // Reached Flagpole Goal -> Trigger Quiz Time!
  const handleStageGoal = useCallback(() => {
    if (gameStateRef.current.isOver) return;
    gameStateRef.current.isOver = true;
    marioBGM.playStageClear();
    soundEffects.win();

    // Base clear bonus
    const clearScore = gameStateRef.current.score + 2500;
    gameStateRef.current.score = clearScore;
    setScore(clearScore);

    const quiz = getRandomQuizForStage(currentStageId);
    setCurrentQuiz(quiz);
    setIsBonusModalOpen(true);
  }, [currentStageId]);

  // Apply Quiz Bonus (Score & Coins)
  const handleApplyBonus = useCallback((bonusScore: number, bonusCoins: number) => {
    if (bonusScore > 0) {
      const newScore = gameStateRef.current.score + bonusScore;
      const newCoins = gameStateRef.current.coinsCount + bonusCoins;
      gameStateRef.current.score = newScore;
      gameStateRef.current.coinsCount = newCoins;
      setScore(newScore);
      setCoins(newCoins);
    }
  }, []);

  // Advance to Next Stage
  const handleNextStage = useCallback(() => {
    setIsBonusModalOpen(false);
    const nextStageId = currentStageId + 1;
    setCurrentStageId(nextStageId);
    initWorld(nextStageId, true, gameStateRef.current.score, gameStateRef.current.coinsCount, isCoopMode);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [currentStageId, initWorld, isCoopMode]);

  // Finish Game & Record Score
  const handleFinishGame = useCallback(() => {
    setIsBonusModalOpen(false);
    const maxDist = Math.max(
      Math.floor(gameStateRef.current.player1.x / 10),
      gameStateRef.current.isCoop ? Math.floor(gameStateRef.current.player2.x / 10) : 0
    );
    handleGameOver(gameStateRef.current.score, maxDist, gameStateRef.current.coinsCount, true);
  }, [handleGameOver]);

  // Retry Current Stage
  const handleRetryStage = useCallback(() => {
    setIsBonusModalOpen(false);
    initWorld(currentStageId, false, 0, 0, isCoopMode);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [currentStageId, initWorld, isCoopMode]);

  // Stage Switch from UI Buttons
  const handleSelectStage = useCallback(
    (stageId: number) => {
      soundEffects.click();
      initWorld(stageId, false, 0, 0, isCoopMode);
      if (!marioBGM.getIsMuted()) {
        marioBGM.start();
      }
    },
    [initWorld, isCoopMode]
  );

  // Restart Current Stage
  const handleRestart = useCallback(() => {
    soundEffects.click();
    initWorld(currentStageId, false, 0, 0, isCoopMode);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [initWorld, currentStageId, isCoopMode]);

  // Toggle Coop Mode
  const handleToggleCoop = useCallback(() => {
    soundEffects.powerup();
    setIsCoopMode((prev) => {
      const next = !prev;
      initWorld(currentStageId, false, 0, 0, next);
      return next;
    });
  }, [initWorld, currentStageId]);

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!marioBGM.getIsPlaying() && !marioBGM.getIsMuted() && !gameStateRef.current.isOver) {
        marioBGM.start();
      }

      // Player 1 controls (A / D / W or Space)
      if (['KeyA'].includes(e.code)) keysRef.current.p1Left = true;
      if (['KeyD'].includes(e.code)) keysRef.current.p1Right = true;
      if (['KeyW', 'Space'].includes(e.code)) {
        if (!keysRef.current.p1Jump) keysRef.current.p1Jump = true;
        e.preventDefault();
      }

      // If single-player mode, also allow Arrow keys for Player 1
      if (!gameStateRef.current.isCoop) {
        if (e.code === 'ArrowLeft') keysRef.current.p1Left = true;
        if (e.code === 'ArrowRight') keysRef.current.p1Right = true;
        if (e.code === 'ArrowUp') {
          if (!keysRef.current.p1Jump) keysRef.current.p1Jump = true;
          e.preventDefault();
        }
      } else {
        // Player 2 controls (Arrow keys or J / L / I)
        if (['ArrowLeft', 'KeyJ'].includes(e.code)) keysRef.current.p2Left = true;
        if (['ArrowRight', 'KeyL'].includes(e.code)) keysRef.current.p2Right = true;
        if (['ArrowUp', 'KeyI'].includes(e.code)) {
          if (!keysRef.current.p2Jump) keysRef.current.p2Jump = true;
          e.preventDefault();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Player 1
      if (['KeyA'].includes(e.code)) keysRef.current.p1Left = false;
      if (['KeyD'].includes(e.code)) keysRef.current.p1Right = false;
      if (['KeyW', 'Space'].includes(e.code)) keysRef.current.p1Jump = false;

      if (!gameStateRef.current.isCoop) {
        if (e.code === 'ArrowLeft') keysRef.current.p1Left = false;
        if (e.code === 'ArrowRight') keysRef.current.p1Right = false;
        if (e.code === 'ArrowUp') keysRef.current.p1Jump = false;
      } else {
        // Player 2
        if (['ArrowLeft', 'KeyJ'].includes(e.code)) keysRef.current.p2Left = false;
        if (['ArrowRight', 'KeyL'].includes(e.code)) keysRef.current.p2Right = false;
        if (['ArrowUp', 'KeyI'].includes(e.code)) keysRef.current.p2Jump = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    initWorld();
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.65;
    const friction = 0.82;
    const maxSpeed = 4.8;
    const jumpStrength = -12.5;

    let tick = 0;

    const render = () => {
      tick++;
      const state = gameStateRef.current;
      const { player1, player2, platforms, goombas, coins, mushrooms } = state;

      if (!state.isOver) {
        if (state.invincibleTimer1 > 0) state.invincibleTimer1--;
        if (state.invincibleTimer2 > 0) state.invincibleTimer2--;

        // Helper for losing a shared team life
        const loseLife = (reason: 'pit' | 'enemy', player: PlayerCharacter) => {
          // If player was super, shrink and stay alive with temporary invincibility!
          if (player.isSuper) {
            player.isSuper = false;
            player.height = 36;
            player.width = 26;
            player.y += 12;
            soundEffects.out();
            if (player.id === 'mario') {
              state.invincibleTimer1 = 120;
              setIsSuperMario(false);
            } else {
              state.invincibleTimer2 = 120;
              setIsSuperLuigi(false);
            }
            player.vy = -5;
            return;
          }

          state.lives -= 1;
          setLives(state.lives);

          if (state.lives <= 0) {
            soundEffects.lose();
            const maxDist = Math.max(
              Math.floor(player1.x / 10),
              state.isCoop ? Math.floor(player2.x / 10) : 0
            );
            handleGameOver(state.score, maxDist, state.coinsCount, false);
          } else {
            soundEffects.out();
            if (player.id === 'mario') state.invincibleTimer1 = 150;
            else state.invincibleTimer2 = 150;

            if (reason === 'pit') {
              const safePlat =
                platforms.find(
                  (p) => p.type === 'ground' && p.x <= player.x && p.x + p.width >= player.x - 60
                ) || platforms.find((p) => p.type === 'ground' && p.x <= player.x) || platforms[0];

              player.x = Math.max(50, safePlat.x + 40);
              player.y = safePlat.y - player.height;
              player.vx = 0;
              player.vy = -4;
              player.grounded = true;
            } else {
              player.vy = -6;
              player.vx = player.facing === 'left' ? 4 : -4;
            }
          }
        };

        // Physics updater for a player
        const updatePlayer = (
          p: PlayerCharacter,
          isLeft: boolean,
          isRight: boolean,
          isJump: boolean
        ) => {
          if (isLeft) {
            p.vx -= 0.8;
            p.facing = 'left';
          }
          if (isRight) {
            p.vx += 0.8;
            p.facing = 'right';
          }

          p.vx *= friction;
          if (Math.abs(p.vx) > maxSpeed) {
            p.vx = Math.sign(p.vx) * maxSpeed;
          }
          if (Math.abs(p.vx) < 0.05) p.vx = 0;

          if (isJump && p.grounded) {
            p.vy = jumpStrength;
            p.grounded = false;
            soundEffects.jump();
          }

          p.vy += gravity;
          if (p.vy > 14) p.vy = 14;

          // Horizontal movement
          p.x += p.vx;
          if (p.x < 10) p.x = 10;

          platforms.forEach((plat) => {
            if (
              p.x + p.width > plat.x &&
              p.x < plat.x + plat.width &&
              p.y + p.height > plat.y + 4 &&
              p.y < plat.y + plat.height - 4
            ) {
              if (p.vx > 0) p.x = plat.x - p.width;
              else if (p.vx < 0) p.x = plat.x + plat.width;
            }
          });

          // Vertical movement
          p.y += p.vy;
          p.grounded = false;

          platforms.forEach((plat) => {
            if (
              p.x + p.width > plat.x &&
              p.x < plat.x + plat.width &&
              p.y + p.height >= plat.y &&
              p.y + p.height <= plat.y + 16 &&
              p.vy >= 0
            ) {
              p.grounded = true;
              p.vy = 0;
              p.y = plat.y - p.height;
            }

            // Bump block from below
            if (
              p.x + p.width > plat.x &&
              p.x < plat.x + plat.width &&
              p.y <= plat.y + plat.height &&
              p.y >= plat.y + plat.height - 14 &&
              p.vy < 0
            ) {
              p.vy = 1.2;
              if (plat.type === 'question' && !plat.hit) {
                plat.hit = true;
                if (plat.hasMushroom) {
                  soundEffects.powerup();
                  state.mushrooms.push({
                    id: Date.now() + Math.random(),
                    x: plat.x + 4,
                    y: plat.y - 24,
                    vx: 1.8,
                    vy: -3.5,
                    width: 24,
                    height: 24,
                    grounded: false,
                    collected: false,
                  });
                  state.score += 300;
                  setScore(state.score);
                } else {
                  soundEffects.coin();
                  state.coinsCount += 1;
                  state.score += 200;
                  setCoins(state.coinsCount);
                  setScore(state.score);
                }
              }
            }
          });

          // Fall into pit
          if (p.y > 420) {
            loseLife('pit', p);
          }

          // Running animation
          if (Math.abs(p.vx) > 0.5 && p.grounded) {
            p.runFrame = (p.runFrame + 0.25) % 4;
          }
        };

        // Update active players
        updatePlayer(player1, keysRef.current.p1Left, keysRef.current.p1Right, keysRef.current.p1Jump);

        if (state.isCoop && player2.active) {
          updatePlayer(player2, keysRef.current.p2Left, keysRef.current.p2Right, keysRef.current.p2Jump);
        }

        // Update Mushrooms
        mushrooms.forEach((m) => {
          if (m.collected) return;
          m.vy += gravity * 0.7;
          if (m.vy > 10) m.vy = 10;
          m.x += m.vx;
          m.y += m.vy;

          // Platform collisions for mushroom
          platforms.forEach((plat) => {
            if (
              m.x + m.width > plat.x &&
              m.x < plat.x + plat.width &&
              m.y + m.height >= plat.y &&
              m.y + m.height <= plat.y + 16 &&
              m.vy >= 0
            ) {
              m.grounded = true;
              m.vy = 0;
              m.y = plat.y - m.height;
            }

            // Reverse on pipe/wall hit
            if (
              plat.type === 'pipe' &&
              m.x + m.width > plat.x &&
              m.x < plat.x + plat.width &&
              m.y + m.height > plat.y
            ) {
              m.vx = -m.vx;
            }
          });

          // Player 1 collects mushroom
          const checkMushroomCollect = (p: PlayerCharacter) => {
            if (
              m.x + m.width > p.x &&
              m.x < p.x + p.width &&
              m.y + m.height > p.y &&
              m.y < p.y + p.height
            ) {
              m.collected = true;
              soundEffects.powerup();
              soundEffects.win();
              state.score += 1000;
              setScore(state.score);

              // Power-up to Super Mario / Super Luigi (Grow larger!)
              if (!p.isSuper) {
                p.isSuper = true;
                p.y -= 12;
                p.height = 48;
                p.width = 30;
                if (p.id === 'mario') setIsSuperMario(true);
                else setIsSuperLuigi(true);
              }
            }
          };

          checkMushroomCollect(player1);
          if (state.isCoop && player2.active) checkMushroomCollect(player2);
        });

        // Update Goombas
        goombas.forEach((g) => {
          if (!g.alive) {
            g.squishedTimer--;
            return;
          }

          g.x += g.vx;

          platforms.forEach((p) => {
            if (
              p.type === 'pipe' &&
              g.x + g.width > p.x &&
              g.x < p.x + p.width &&
              g.y + g.height > p.y
            ) {
              g.vx = -g.vx;
            }
          });

          const checkGoombaHit = (p: PlayerCharacter, invTimer: number) => {
            const dx = p.x + p.width / 2 - (g.x + g.width / 2);
            const dy = p.y + p.height / 2 - (g.y + g.height / 2);

            if (
              Math.abs(dx) < p.width / 2 + g.width / 2 &&
              Math.abs(dy) < p.height / 2 + g.height / 2
            ) {
              // Stomp from top
              if (p.vy > 0 && p.y + p.height <= g.y + 14) {
                g.alive = false;
                g.squishedTimer = 30;
                p.vy = -8.8; // bounce!
                soundEffects.stomp();
                state.score += 250;
                setScore(state.score);
              } else {
                if (invTimer <= 0) {
                  loseLife('enemy', p);
                }
              }
            }
          };

          checkGoombaHit(player1, state.invincibleTimer1);
          if (state.isCoop && player2.active) {
            checkGoombaHit(player2, state.invincibleTimer2);
          }
        });

        // Update Coins
        coins.forEach((c) => {
          if (c.collected) return;
          const checkCoin = (p: PlayerCharacter) => {
            const cx = p.x + p.width / 2;
            const cy = p.y + p.height / 2;
            const dist = Math.hypot(cx - c.x, cy - c.y);
            if (dist < c.radius + p.width / 2) {
              c.collected = true;
              soundEffects.coin();
              state.coinsCount += 1;
              state.score += 100;
              setCoins(state.coinsCount);
              setScore(state.score);
            }
          };
          checkCoin(player1);
          if (state.isCoop && player2.active) checkCoin(player2);
        });

        // Goal reached
        const stageData = getStageById(state.stageId);
        if (
          player1.x > stageData.goalX ||
          (state.isCoop && player2.active && player2.x > stageData.goalX)
        ) {
          handleStageGoal();
        }

        // Camera follow (centers between both players in co-op mode)
        const leadX =
          state.isCoop && player2.active
            ? Math.max(player1.x, player2.x) - 220
            : player1.x - 220;
        state.cameraX += (leadX - state.cameraX) * 0.12;
        if (state.cameraX < 0) state.cameraX = 0;

        // Update distance
        const leadDist = Math.max(
          Math.floor(player1.x / 10),
          state.isCoop ? Math.floor(player2.x / 10) : 0
        );
        const curDist = Math.max(state.distance, leadDist);
        state.distance = curDist;
        setDistance(curDist);
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const stageInfo = getStageById(state.stageId);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, stageInfo.skyColors[0]);
      skyGrad.addColorStop(0.5, stageInfo.skyColors[1]);
      skyGrad.addColorStop(1, stageInfo.skyColors[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Stage Themes Parallax Background
      if (stageInfo.themeType === 'grass') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 20; i++) {
          const cloudX = i * 260 + 50;
          ctx.beginPath();
          ctx.arc(cloudX, 70, 24, 0, Math.PI * 2);
          ctx.arc(cloudX + 22, 60, 28, 0, Math.PI * 2);
          ctx.arc(cloudX + 44, 70, 24, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#00a800';
        for (let i = 0; i < 15; i++) {
          const hillX = i * 380;
          ctx.beginPath();
          ctx.arc(hillX + 100, 340, 90, Math.PI, 0);
          ctx.fill();
        }
      } else if (stageInfo.themeType === 'cave') {
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < 35; i++) {
          const stalX = i * 120;
          const stalH = 30 + ((i * 17) % 35);
          ctx.beginPath();
          ctx.moveTo(stalX, 0);
          ctx.lineTo(stalX + 18, stalH);
          ctx.lineTo(stalX + 36, 0);
          ctx.fill();
        }
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 14; i++) {
          const colX = i * 320 + 40;
          ctx.fillRect(colX, 0, 32, canvas.height);
        }
        for (let i = 0; i < 22; i++) {
          const cryX = i * 200 + 70;
          const glow = 0.5 + Math.sin(tick * 0.08 + i) * 0.4;
          ctx.fillStyle = `rgba(6, 182, 212, ${glow})`;
          ctx.beginPath();
          ctx.moveTo(cryX, 330);
          ctx.lineTo(cryX + 9, 296);
          ctx.lineTo(cryX + 18, 330);
          ctx.fill();
        }
      } else if (stageInfo.themeType === 'castle') {
        ctx.fillStyle = '#1c1917';
        for (let i = 0; i < 16; i++) {
          const archX = i * 280;
          ctx.fillRect(archX, 0, 24, 340);
          ctx.fillRect(archX + 180, 0, 24, 340);
          ctx.beginPath();
          ctx.arc(archX + 102, 100, 90, Math.PI, 0);
          ctx.fill();
        }
        for (let i = 0; i < 16; i++) {
          const torchX = i * 280 + 12;
          ctx.fillStyle = '#78716c';
          ctx.fillRect(torchX - 3, 140, 6, 18);
          const flameGlow = Math.sin(tick * 0.25 + i) * 3;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(torchX, 134 + flameGlow * 0.3, 7 + Math.sin(tick * 0.3 + i) * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(torchX, 134, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        const lavaGrad = ctx.createLinearGradient(0, 340, 0, canvas.height);
        lavaGrad.addColorStop(0, '#f97316');
        lavaGrad.addColorStop(0.5, '#dc2626');
        lavaGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(state.cameraX - 100, 340, 1100, 120);
      } else if (stageInfo.themeType === 'sky') {
        // Floating pastel rainbow clouds and sunset sun
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 24; i++) {
          const cx = i * 220 + 30;
          const cy = 50 + ((i * 37) % 60);
          ctx.beginPath();
          ctx.arc(cx, cy, 30, 0, Math.PI * 2);
          ctx.arc(cx + 25, cy - 10, 35, 0, Math.PI * 2);
          ctx.arc(cx + 50, cy, 30, 0, Math.PI * 2);
          ctx.fill();
        }
        // Floating rainbow arc
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(state.cameraX + 420, 480, 380, Math.PI, 0);
        ctx.stroke();
      } else if (stageInfo.themeType === 'ice') {
        // Aurora Borealis curtains
        const aurora = ctx.createLinearGradient(0, 20, 0, 180);
        aurora.addColorStop(0, 'rgba(56, 189, 248, 0)');
        aurora.addColorStop(0.5, 'rgba(52, 211, 153, 0.28)');
        aurora.addColorStop(1, 'rgba(129, 140, 248, 0)');
        ctx.fillStyle = aurora;
        ctx.fillRect(state.cameraX - 100, 20, 1100, 160);

        // Snow mountain peaks
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < 12; i++) {
          const mx = i * 360 - 50;
          ctx.beginPath();
          ctx.moveTo(mx, 320);
          ctx.lineTo(mx + 160, 120);
          ctx.lineTo(mx + 320, 320);
          ctx.fill();
          // Snow cap
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(mx + 120, 170);
          ctx.lineTo(mx + 160, 120);
          ctx.lineTo(mx + 200, 170);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
        }

        // Falling snowflakes
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
          const sx = ((i * 97 + tick * 0.8) % 1200) + state.cameraX - 100;
          const sy = (i * 31 + tick * 1.5) % 360;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 + (i % 2), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Platforms Rendering
      platforms.forEach((plat) => {
        if (plat.type === 'ground') {
          ctx.fillStyle = stageInfo.groundGrassColor;
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          ctx.fillStyle = stageInfo.groundBodyColor;
          ctx.fillRect(plat.x, plat.y + 14, plat.width, plat.height - 14);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        } else if (plat.type === 'pipe') {
          ctx.fillStyle = stageInfo.pipeColor;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = stageInfo.pipeLipColor;
          ctx.fillRect(plat.x - 4, plat.y, plat.width + 8, 16);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x - 4, plat.y, plat.width + 8, 16);
          ctx.strokeRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
        } else if (plat.type === 'question') {
          ctx.fillStyle = plat.hit ? '#9c6c4c' : '#fc9838';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
          if (!plat.hit) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', plat.x + plat.width / 2, plat.y + plat.height - 5);
          }
        } else if (plat.type === 'brick') {
          ctx.fillStyle = stageInfo.brickColor;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        }
      });

      // Goal Flagpole
      const goalX = stageInfo.goalX;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(goalX, 140, 6, 180);
      ctx.fillStyle = '#fcbc3c';
      ctx.beginPath();
      ctx.arc(goalX + 3, 140, 8, 0, Math.PI * 2);
      ctx.fill();

      // Flag banner
      ctx.fillStyle =
        stageInfo.themeType === 'castle'
          ? '#ef4444'
          : stageInfo.themeType === 'cave'
          ? '#06b6d4'
          : stageInfo.themeType === 'sky'
          ? '#f59e0b'
          : stageInfo.themeType === 'ice'
          ? '#38bdf8'
          : '#00a800';
      ctx.beginPath();
      ctx.moveTo(goalX + 6, 150);
      ctx.lineTo(goalX + 50, 170);
      ctx.lineTo(goalX + 6, 190);
      ctx.fill();

      // Castle at the end
      ctx.fillStyle = stageInfo.brickColor;
      ctx.fillRect(goalX + 60, stageInfo.groundY - 140, 120, 140);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(goalX + 120, stageInfo.groundY - 10, 26, Math.PI, 0);
      ctx.fill();

      // Coins Rendering
      coins.forEach((c) => {
        if (c.collected) return;
        const floatY = c.y + Math.sin(tick * 0.1 + c.animOffset) * 3;
        ctx.fillStyle = '#fcbc3c';
        ctx.beginPath();
        ctx.ellipse(c.x, floatY, c.radius * 0.7, c.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(c.x - 2, floatY - 4, 3, 8);
      });

      // Mushrooms Rendering
      mushrooms.forEach((m) => {
        if (m.collected) return;
        ctx.save();
        // Red Cap
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(m.x + m.width / 2, m.y + 11, 12, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // White dots on mushroom cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.x + m.width / 2, m.y + 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x + 4, m.y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(m.x + m.width - 4, m.y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mushroom Stem
        ctx.fillStyle = '#fde047';
        ctx.fillRect(m.x + 5, m.y + 11, 14, 11);
        ctx.strokeRect(m.x + 5, m.y + 11, 14, 11);

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(m.x + 8, m.y + 13, 2, 4);
        ctx.fillRect(m.x + 14, m.y + 13, 2, 4);
        ctx.restore();
      });

      // Goombas Rendering
      goombas.forEach((g) => {
        if (!g.alive) {
          if (g.squishedTimer > 0) {
            ctx.fillStyle = stageInfo.goombaColor;
            ctx.fillRect(g.x, g.y + 16, g.width, 10);
            ctx.fillStyle = '#000000';
            ctx.fillRect(g.x + 6, g.y + 18, 3, 3);
            ctx.fillRect(g.x + 16, g.y + 18, 3, 3);
          }
          return;
        }

        ctx.fillStyle = stageInfo.goombaColor;
        ctx.beginPath();
        ctx.arc(g.x + g.width / 2, g.y + 10, g.width / 2, Math.PI, 0);
        ctx.lineTo(g.x + g.width, g.y + g.height - 4);
        ctx.lineTo(g.x, g.y + g.height - 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(g.x + 4, g.y + 7, 5, 8);
        ctx.fillRect(g.x + 16, g.y + 7, 5, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(g.x + 5, g.y + 9, 3, 5);
        ctx.fillRect(g.x + 17, g.y + 9, 3, 5);

        ctx.fillStyle = '#000000';
        const footOffset = Math.sin(tick * 0.2) * 2;
        ctx.fillRect(g.x + 2, g.y + g.height - 4, 8, 4 + footOffset);
        ctx.fillRect(g.x + g.width - 10, g.y + g.height - 4, 8, 4 - footOffset);
      });

      // Helper function to render a player sprite (Mario or Luigi, Small or Super)
      const renderPlayerSprite = (p: PlayerCharacter, invTimer: number) => {
        const px = p.x;
        const py = p.y;

        ctx.save();
        if (invTimer > 0) {
          if (Math.floor(tick / 4) % 2 === 0) {
            ctx.globalAlpha = 0.35;
          } else {
            ctx.globalAlpha = 0.85;
          }
        }

        if (p.facing === 'left') {
          ctx.translate(px + p.width, py);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(px, py);
        }

        // Scale factor if Super (grown from mushroom)
        const scale = p.isSuper ? 1.33 : 1.0;
        ctx.scale(scale, scale);

        // Cap
        ctx.fillStyle = p.colorHat;
        ctx.fillRect(4, 0, 18, 8);
        ctx.fillRect(10, 4, 16, 6); // visor

        // Face
        ctx.fillStyle = '#fc9838';
        ctx.fillRect(6, 8, 16, 10);

        // Eye & Moustache
        ctx.fillStyle = '#000000';
        ctx.fillRect(16, 9, 3, 4);
        ctx.fillRect(14, 13, 11, 4);
        ctx.fillRect(6, 12, 4, 5);

        // Shirt
        ctx.fillStyle = p.colorShirt;
        ctx.fillRect(4, 18, 18, 10);

        // Overalls
        ctx.fillStyle = p.colorOveralls;
        ctx.fillRect(6, 22, 14, 10);

        // Buttons
        ctx.fillStyle = '#fce000';
        ctx.fillRect(8, 23, 3, 3);
        ctx.fillRect(15, 23, 3, 3);

        // Running Legs
        ctx.fillStyle = p.colorOveralls;
        const legFrame = Math.floor(p.runFrame);
        if (!p.grounded) {
          ctx.fillRect(0, 26, 10, 8);
          ctx.fillRect(14, 28, 10, 8);
        } else if (legFrame === 1 || legFrame === 3) {
          ctx.fillRect(3, 28, 8, 8);
          ctx.fillRect(15, 28, 8, 8);
        } else {
          ctx.fillRect(1, 28, 10, 8);
          ctx.fillRect(15, 28, 10, 8);
        }

        // Brown Shoes
        ctx.fillStyle = '#6c3800';
        ctx.fillRect(1, 33, 10, 5);
        ctx.fillRect(15, 33, 10, 5);

        ctx.restore();

        // Player Tag above head in 2P Co-op mode
        if (state.isCoop) {
          ctx.save();
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = p.id === 'mario' ? '#f87171' : '#4ade80';
          ctx.fillText(p.id === 'mario' ? '1P 마리오' : '2P 루이지', px + p.width / 2, py - 6);
          ctx.restore();
        }
      };

      // Draw Mario (P1)
      renderPlayerSprite(player1, state.invincibleTimer1);

      // Draw Luigi (P2) if Co-op is active
      if (state.isCoop && player2.active) {
        renderPlayerSprite(player2, state.invincibleTimer2);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [initWorld, handleGameOver]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Player Name Banner for Quick Identification */}
      <PlayerNameBanner
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        gameTitle={isCoopMode ? '마리오 & 루이지 점프런 (짝꿍 협동 2인용)' : '마리오 점프런'}
      />

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>게임 허브로</span>
          </button>

          {/* Co-op / Partner Toggle Button */}
          <button
            onClick={handleToggleCoop}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition-all ${
              isCoopMode
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
          >
            {isCoopMode ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            <span>{isCoopMode ? '짝꿍 협동(루이지 합류 중!)' : '짝꿍과 같이하기(2인용)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Mushroom Super Status Badge */}
          {(isSuperMario || isSuperLuigi) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/30 to-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-black animate-pulse">
              <span>🍄</span>
              <span>
                {isSuperMario && isSuperLuigi
                  ? '둘 다 슈퍼 변신!'
                  : isSuperMario
                  ? '마리오 슈퍼 버섯!'
                  : '루이지 슈퍼 버섯!'}
              </span>
            </div>
          )}

          <button
            onClick={() => onOpenLeaderboard('mario')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>마리오 랭킹</span>
          </button>
        </div>
      </div>

      {/* Stage Selector Bar (All 5 Stages!) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 px-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>스테이지 선택 (1~5):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          {STAGE_DATA.map((stg) => {
            const isActive = stg.id === currentStageId;
            return (
              <button
                key={stg.id}
                onClick={() => handleSelectStage(stg.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
              >
                <span>{stg.badgeEmoji}</span>
                <span>
                  {stg.stageCode} {stg.name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                    stg.difficulty === '쉬움'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : stg.difficulty === '보통'
                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {stg.difficulty}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Screen */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col items-center">
        {/* Top HUD Bar */}
        <div className="w-full max-w-[840px] flex items-center justify-between px-4 py-2.5 mb-3 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-black">
          <div className="flex items-center gap-4 sm:gap-5 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">{userProfile.avatar}</span>
              <div>
                <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                  {isCoopMode ? '1P & 2P' : 'PLAYER'}
                </span>
                <span className="text-white text-xs font-bold truncate max-w-[120px] block">
                  {isCoopMode ? `${userProfile.name} & 루이지` : userProfile.name}
                </span>
              </div>
            </div>

            {/* Current Stage Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-sm">{getStageById(currentStageId).badgeEmoji}</span>
              <div>
                <span className="text-[9px] text-slate-400 block leading-tight">STAGE</span>
                <span className="text-amber-300 text-xs font-black leading-tight">
                  {getStageById(currentStageId).stageCode}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-tight">SCORE</span>
              <span className="text-amber-400 text-sm font-black">
                {score.toLocaleString().padStart(6, '0')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-tight">COINS</span>
              <span className="text-amber-300 text-sm font-black">
                🪙 x{coins.toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-tight">LIVES</span>
              <div className="flex items-center gap-0.5 mt-0.5" title={`남은 목숨: ${lives}개`}>
                {[1, 2, 3].map((heartIndex) => (
                  <Heart
                    key={heartIndex}
                    className={`w-4 h-4 transition-transform duration-200 ${
                      heartIndex <= lives
                        ? 'text-rose-500 fill-rose-500 scale-105 filter drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]'
                        : 'text-slate-600 fill-slate-800/60 scale-90 opacity-40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-normal leading-tight">DISTANCE</span>
              <span className="text-emerald-400 text-sm font-black">{distance}m</span>
            </div>

            {/* Mario BGM Toggle Button */}
            <button
              onClick={toggleBgm}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                bgmEnabled
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
              }`}
              title={bgmEnabled ? '마리오 배경음악 끄기' : '마리오 배경음악 켜기'}
            >
              <Music className={`w-3.5 h-3.5 ${bgmEnabled ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{bgmEnabled ? 'BGM 켜짐' : 'BGM 꺼짐'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-colors"
              title="다시하기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>다시하기</span>
            </button>
          </div>
        </div>

        {/* 2D Platformer Canvas */}
        <div className="relative w-full max-w-[840px] aspect-[840/460] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-[#5c94fc]">
          <canvas
            ref={canvasRef}
            width={840}
            height={460}
            className="w-full h-full block bg-[#5c94fc]"
          />

          {isGameOver && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <div className="text-3xl sm:text-5xl font-black text-rose-400 mb-2 animate-bounce">
                GAME OVER
              </div>
              <p className="text-sm text-slate-200 mb-5 font-semibold">
                {isCoopMode ? `${userProfile.name} & 짝꿍(루이지)` : userProfile.name} 님의 최종 기록이
                전교 실시간 랭킹에 등록되었습니다!
              </p>
              <button
                onClick={handleRestart}
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                다시 달리기!
              </button>
            </div>
          )}
        </div>

        {/* Mobile Touch Controls & Desktop Helper */}
        <div className="w-full max-w-[840px] mt-4 flex items-center justify-between gap-3">
          {/* 1P Touch buttons */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => (keysRef.current.p1Left = true)}
              onMouseUp={() => (keysRef.current.p1Left = false)}
              onTouchStart={() => (keysRef.current.p1Left = true)}
              onTouchEnd={() => (keysRef.current.p1Left = false)}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center text-xl shadow select-none"
              title="1P 왼쪽"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onMouseDown={() => (keysRef.current.p1Right = true)}
              onMouseUp={() => (keysRef.current.p1Right = false)}
              onTouchStart={() => (keysRef.current.p1Right = true)}
              onTouchEnd={() => (keysRef.current.p1Right = false)}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center text-xl shadow select-none"
              title="1P 오른쪽"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-xs text-slate-300 text-center font-medium bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
            {isCoopMode ? (
              <div className="space-y-0.5">
                <div>
                  <strong className="text-rose-400">1P(마리오)</strong>: A/D 이동 · W/스페이스바 점프
                </div>
                <div>
                  <strong className="text-emerald-400">2P(루이지)</strong>: 방향키(←/→) 이동 · ↑ 점프
                </div>
              </div>
            ) : (
              <div>
                ⌨️ <strong>A/D</strong> 또는 <strong>방향키</strong> 이동 · <strong>스페이스바/W</strong> 점프
                · 🍄 <strong>? 블록</strong>을 쳐서 슈퍼 버섯을 먹어보세요!
              </div>
            )}
          </div>

          {/* 1P Jump touch button */}
          <button
            onMouseDown={() => {
              keysRef.current.p1Jump = true;
            }}
            onMouseUp={() => {
              keysRef.current.p1Jump = false;
            }}
            onTouchStart={() => {
              keysRef.current.p1Jump = true;
            }}
            onTouchEnd={() => {
              keysRef.current.p1Jump = false;
            }}
            className="w-20 sm:w-24 h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 active:scale-95 text-slate-950 font-black border border-rose-400 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 select-none text-base"
          >
            <ArrowUp className="w-5 h-5 stroke-[3]" />
            <span>점프</span>
          </button>
        </div>
      </div>

      {/* Stage Clear & Bonus Quiz Modal (All 5 stages supported) */}
      <MarioBonusModal
        isOpen={isBonusModalOpen}
        stage={getStageById(currentStageId)}
        quiz={currentQuiz}
        currentScore={score}
        currentCoins={coins}
        onApplyBonus={handleApplyBonus}
        onNextStage={currentStageId < 5 ? handleNextStage : undefined}
        onFinishGame={handleFinishGame}
        onRetryStage={handleRetryStage}
      />

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="mario"
        title={isCoopMode ? '마리오 & 루이지 완주 성공!' : '마리오 러너 완주!'}
        subTitle="환상적인 점프 컨트롤과 팀워크로 신기록을 달성했습니다!"
        scoreText={lastScoreText}
        onPlayAgain={handleRestart}
        onViewLeaderboard={() => {
          setWinModalOpen(false);
          onOpenLeaderboard('mario');
        }}
        onBackToMenu={() => {
          setWinModalOpen(false);
          onBackToHub();
        }}
      />
    </div>
  );
}
