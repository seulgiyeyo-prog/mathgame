import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, ArrowLeft, ArrowRight, ArrowUp, Sparkles, Volume2, VolumeX, Music, Heart, Layers, Flame, Award } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { marioBGM } from '../../utils/marioAudio';
import { saveLeaderboardEntry } from '../../utils/storage';
import { STAGE_DATA, getStageById, getRandomQuizForStage, MarioStage, BonusQuiz, Platform, Goomba, Coin } from '../../utils/marioStages';
import WinModal from '../WinModal';
import MarioBonusModal from './MarioBonusModal';
import PlayerNameBanner from '../PlayerNameBanner';

interface MarioGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

export default function MarioGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: MarioGameProps) {
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
  const [isSuper, setIsSuper] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(() => !marioBGM.getIsMuted());

  // BGM lifecycle
  useEffect(() => {
    // Attempt auto-start on mount
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

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  // Game internal state ref for 60fps loop
  const gameStateRef = useRef({
    player: {
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
    },
    cameraX: 0,
    platforms: [] as Platform[],
    goombas: [] as Goomba[],
    coins: [] as Coin[],
    score: 0,
    coinsCount: 0,
    distance: 0,
    lives: 3,
    invincibleTimer: 0,
    isOver: false,
    worldWidth: 3800,
    stageId: 1,
  });

  // Init World from Stage
  const initWorld = useCallback(
    (stageId = currentStageId, preserveScore = false, carryScore = 0, carryCoins = 0) => {
      const stage = getStageById(stageId);
      setCurrentStageId(stageId);

      const platforms: Platform[] = stage.platforms.map((p) => ({ ...p }));
      const goombas: Goomba[] = stage.goombas.map((g) => ({ ...g }));
      const coinsList: Coin[] = stage.coins.map((c) => ({ ...c }));

      const initialScore = preserveScore ? carryScore : 0;
      const initialCoins = preserveScore ? carryCoins : 0;

      gameStateRef.current = {
        player: {
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
        },
        cameraX: 0,
        platforms,
        goombas,
        coins: coinsList,
        score: initialScore,
        coinsCount: initialCoins,
        distance: 0,
        lives: 3,
        invincibleTimer: 0,
        isOver: false,
        worldWidth: stage.worldWidth,
        stageId: stage.id,
      };

      setScore(initialScore);
      setCoins(initialCoins);
      setDistance(0);
      setLives(3);
      setIsGameOver(false);
      setIsSuper(false);
      setWinModalOpen(false);
      setIsBonusModalOpen(false);
    },
    [currentStageId]
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
      const sub = isWin
        ? `${stage.stageCode} (${stage.name}) 골인 클리어! (거리 ${finalDist}m · 코인 ${finalCoins}개)`
        : `${stage.stageCode} (${stage.name}) 게임오버 (거리 ${finalDist}m · 코인 ${finalCoins}개)`;
      setLastScoreText(sub);

      saveLeaderboardEntry({
        game: 'mario',
        playerName: userProfile.name,
        gradeClass: userProfile.gradeClass,
        score: finalScore,
        subText: sub,
        avatar: userProfile.avatar,
      });

      setWinModalOpen(true);
    },
    [userProfile, currentStageId]
  );

  // Reached Flagpole Goal -> Trigger Quiz Time!
  const handleStageGoal = useCallback(() => {
    if (gameStateRef.current.isOver) return;
    gameStateRef.current.isOver = true;
    marioBGM.playStageClear();
    soundEffects.win();

    // Add +2,000 base stage clear bonus
    const clearScore = gameStateRef.current.score + 2000;
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
    initWorld(nextStageId, true, gameStateRef.current.score, gameStateRef.current.coinsCount);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [currentStageId, initWorld]);

  // Finish Game & Record Score
  const handleFinishGame = useCallback(() => {
    setIsBonusModalOpen(false);
    handleGameOver(
      gameStateRef.current.score,
      Math.floor(gameStateRef.current.player.x / 10),
      gameStateRef.current.coinsCount,
      true
    );
  }, [handleGameOver]);

  // Retry Current Stage
  const handleRetryStage = useCallback(() => {
    setIsBonusModalOpen(false);
    initWorld(currentStageId, false, 0, 0);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [currentStageId, initWorld]);

  // Stage Switch from UI Buttons
  const handleSelectStage = useCallback((stageId: number) => {
    soundEffects.click();
    initWorld(stageId, false, 0, 0);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [initWorld]);

  // Restart Current Stage
  const handleRestart = useCallback(() => {
    soundEffects.click();
    initWorld(currentStageId, false, 0, 0);
    if (!marioBGM.getIsMuted()) {
      marioBGM.start();
    }
  }, [initWorld, currentStageId]);

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Auto resume BGM if not playing and not muted
      if (!marioBGM.getIsPlaying() && !marioBGM.getIsMuted() && !gameStateRef.current.isOver) {
        marioBGM.start();
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!keysRef.current.jump) {
          keysRef.current.jump = true;
        }
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keysRef.current.jump = false;
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
      const { player, platforms, goombas, coins } = state;

      if (!state.isOver) {
        // Decrease invulnerability timer
        if (state.invincibleTimer > 0) {
          state.invincibleTimer--;
        }
        // Player input physics
        if (keysRef.current.left) {
          player.vx -= 0.8;
          player.facing = 'left';
        }
        if (keysRef.current.right) {
          player.vx += 0.8;
          player.facing = 'right';
        }

        player.vx *= friction;
        if (Math.abs(player.vx) > maxSpeed) {
          player.vx = Math.sign(player.vx) * maxSpeed;
        }
        if (Math.abs(player.vx) < 0.05) player.vx = 0;

        // Jump
        if (keysRef.current.jump && player.grounded) {
          player.vy = jumpStrength;
          player.grounded = false;
          soundEffects.jump();
        }

        // Apply gravity
        player.vy += gravity;
        if (player.vy > 14) player.vy = 14;

        // Move horizontally
        player.x += player.vx;

        // Keep inside world left bound
        if (player.x < 10) player.x = 10;

        // Check horizontal platform collision
        platforms.forEach((plat) => {
          if (
            player.x + player.width > plat.x &&
            player.x < plat.x + plat.width &&
            player.y + player.height > plat.y + 4 &&
            player.y < plat.y + plat.height - 4
          ) {
            if (player.vx > 0) player.x = plat.x - player.width;
            else if (player.vx < 0) player.x = plat.x + plat.width;
          }
        });

        // Move vertically
        player.y += player.vy;
        player.grounded = false;

        // Check vertical platform collision
        platforms.forEach((plat) => {
          if (
            player.x + player.width > plat.x &&
            player.x < plat.x + plat.width &&
            player.y + player.height >= plat.y &&
            player.y + player.height <= plat.y + 16 &&
            player.vy >= 0
          ) {
            player.grounded = true;
            player.vy = 0;
            player.y = plat.y - player.height;
          }

          // Bump from below
          if (
            player.x + player.width > plat.x &&
            player.x < plat.x + plat.width &&
            player.y <= plat.y + plat.height &&
            player.y >= plat.y + plat.height - 12 &&
            player.vy < 0
          ) {
            player.vy = 1;
            if (plat.type === 'question' && !plat.hit) {
              plat.hit = true;
              soundEffects.coin();
              state.coinsCount += 1;
              state.score += 200;
              setCoins(state.coinsCount);
              setScore(state.score);
            }
          }
        });

        // Helper function for losing a life
        const loseLife = (reason: 'pit' | 'enemy') => {
          state.lives -= 1;
          setLives(state.lives);

          if (state.lives <= 0) {
            soundEffects.lose();
            handleGameOver(state.score, Math.floor(player.x / 10), state.coinsCount, false);
          } else {
            // Player still has lives remaining!
            soundEffects.out();
            // Grant ~2.5 seconds of invincibility
            state.invincibleTimer = 150;

            if (reason === 'pit') {
              // Find safe ground platform behind or near current position
              const safePlat = platforms.find(
                (p) => p.type === 'ground' && p.x <= player.x && p.x + p.width >= player.x - 60
              ) || platforms.find((p) => p.type === 'ground' && p.x <= player.x) || platforms[0];

              player.x = Math.max(50, safePlat.x + 40);
              player.y = safePlat.y - player.height;
              player.vx = 0;
              player.vy = -4; // gentle bounce
              player.grounded = true;
            } else {
              // Enemy hit bounce back
              player.vy = -6;
              player.vx = player.facing === 'left' ? 4 : -4;
              if (player.isSuper) {
                player.isSuper = false;
                player.height = 36;
                setIsSuper(false);
              }
            }
          }
        };

        // Fall into pit
        if (player.y > 420) {
          loseLife('pit');
        }

        // Update Goombas
        goombas.forEach((g) => {
          if (!g.alive) {
            g.squishedTimer--;
            return;
          }

          g.x += g.vx;

          // Simple wall bounce against pipes
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

          // Player collides with Goomba
          const dx = player.x + player.width / 2 - (g.x + g.width / 2);
          const dy = player.y + player.height / 2 - (g.y + g.height / 2);

          if (Math.abs(dx) < player.width / 2 + g.width / 2 && Math.abs(dy) < player.height / 2 + g.height / 2) {
            // Stomp on top
            if (player.vy > 0 && player.y + player.height <= g.y + 12) {
              g.alive = false;
              g.squishedTimer = 30;
              player.vy = -8.5; // bounce Mario up!
              soundEffects.stomp();
              state.score += 250;
              setScore(state.score);
            } else {
              // Player hit by monster (only if not currently invincible)
              if (state.invincibleTimer <= 0) {
                loseLife('enemy');
              }
            }
          }
        });

        // Update Coins collection
        coins.forEach((c) => {
          if (c.collected) return;
          const cx = player.x + player.width / 2;
          const cy = player.y + player.height / 2;
          const dist = Math.hypot(cx - c.x, cy - c.y);
          if (dist < c.radius + player.width / 2) {
            c.collected = true;
            soundEffects.coin();
            state.coinsCount += 1;
            state.score += 100;
            setCoins(state.coinsCount);
            setScore(state.score);
          }
        });

        // Goal stage reach
        const currentStageData = getStageById(state.stageId);
        if (player.x > currentStageData.goalX) {
          handleStageGoal();
        }

        // Camera follow
        const targetCamX = player.x - 220;
        state.cameraX += (targetCamX - state.cameraX) * 0.12;
        if (state.cameraX < 0) state.cameraX = 0;

        // Run frame animation
        if (Math.abs(player.vx) > 0.5 && player.grounded) {
          player.runFrame = (player.runFrame + 0.25) % 4;
        }

        // Distance state
        const curDist = Math.max(state.distance, Math.floor(player.x / 10));
        state.distance = curDist;
        setDistance(curDist);
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const stageInfo = getStageById(state.stageId);

      // Sky gradient based on stage theme
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, stageInfo.skyColors[0]);
      skyGrad.addColorStop(0.5, stageInfo.skyColors[1]);
      skyGrad.addColorStop(1, stageInfo.skyColors[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.cameraX, 0);

      // Stage-specific Parallax Background
      if (stageInfo.themeType === 'grass') {
        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 20; i++) {
          const cloudX = i * 260 + 50;
          ctx.beginPath();
          ctx.arc(cloudX, 70, 24, 0, Math.PI * 2);
          ctx.arc(cloudX + 22, 60, 28, 0, Math.PI * 2);
          ctx.arc(cloudX + 44, 70, 24, 0, Math.PI * 2);
          ctx.fill();
        }

        // Green Hills
        ctx.fillStyle = '#00a800';
        for (let i = 0; i < 15; i++) {
          const hillX = i * 380;
          ctx.beginPath();
          ctx.arc(hillX + 100, 340, 90, Math.PI, 0);
          ctx.fill();
        }
      } else if (stageInfo.themeType === 'cave') {
        // Cave ceiling stalactites
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
        // Background cave pillars
        ctx.fillStyle = '#0f172a';
        for (let i = 0; i < 14; i++) {
          const colX = i * 320 + 40;
          ctx.fillRect(colX, 0, 32, canvas.height);
        }
        // Glowing cyan crystals
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
        // Castle battlements and arches
        ctx.fillStyle = '#1c1917';
        for (let i = 0; i < 16; i++) {
          const archX = i * 280;
          ctx.fillRect(archX, 0, 24, 340);
          ctx.fillRect(archX + 180, 0, 24, 340);
          ctx.beginPath();
          ctx.arc(archX + 102, 100, 90, Math.PI, 0);
          ctx.fill();
        }
        // Torch flames on columns
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

        // Lava pit floor in background
        const lavaGrad = ctx.createLinearGradient(0, 340, 0, canvas.height);
        lavaGrad.addColorStop(0, '#f97316');
        lavaGrad.addColorStop(0.5, '#dc2626');
        lavaGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(state.cameraX - 100, 340, 1100, 120);

        // Lava bubbles
        for (let i = 0; i < 14; i++) {
          const bx = ((i * 130 + tick * 1.6) % 1200) + state.cameraX - 100;
          const by = 350 + Math.sin(tick * 0.15 + i) * 8;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Platforms Rendering
      platforms.forEach((plat) => {
        if (plat.type === 'ground') {
          // Top grass / stone line
          ctx.fillStyle = stageInfo.groundGrassColor;
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          // Dirt / stone body
          ctx.fillStyle = stageInfo.groundBodyColor;
          ctx.fillRect(plat.x, plat.y + 14, plat.width, plat.height - 14);
          // Dark border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        } else if (plat.type === 'pipe') {
          // Pipe Body
          ctx.fillStyle = stageInfo.pipeColor;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          // Pipe Top Lip
          ctx.fillStyle = stageInfo.pipeLipColor;
          ctx.fillRect(plat.x - 4, plat.y, plat.width + 8, 16);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x - 4, plat.y, plat.width + 8, 16);
          ctx.strokeRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
        } else if (plat.type === 'question') {
          // Question Block
          ctx.fillStyle = plat.hit ? '#9c6c4c' : '#fc9838';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
          // Question mark
          if (!plat.hit) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('?', plat.x + plat.width / 2, plat.y + plat.height - 5);
          }
        } else if (plat.type === 'brick') {
          // Brick Block
          ctx.fillStyle = stageInfo.brickColor;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        }
      });

      // Goal Flagpole at stage.goalX
      const goalX = stageInfo.goalX;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(goalX, 140, 6, 180);
      ctx.fillStyle = '#fcbc3c';
      ctx.beginPath();
      ctx.arc(goalX + 3, 140, 8, 0, Math.PI * 2);
      ctx.fill();

      // Flag banner
      ctx.fillStyle = stageInfo.themeType === 'castle' ? '#ef4444' : stageInfo.themeType === 'cave' ? '#06b6d4' : '#00a800';
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

      // Goombas Rendering
      goombas.forEach((g) => {
        if (!g.alive) {
          if (g.squishedTimer > 0) {
            // Flattened Goomba
            ctx.fillStyle = stageInfo.goombaColor;
            ctx.fillRect(g.x, g.y + 16, g.width, 10);
            ctx.fillStyle = '#000000';
            ctx.fillRect(g.x + 6, g.y + 18, 3, 3);
            ctx.fillRect(g.x + 16, g.y + 18, 3, 3);
          }
          return;
        }

        // Goomba Body
        ctx.fillStyle = stageInfo.goombaColor;
        ctx.beginPath();
        ctx.arc(g.x + g.width / 2, g.y + 10, g.width / 2, Math.PI, 0);
        ctx.lineTo(g.x + g.width, g.y + g.height - 4);
        ctx.lineTo(g.x, g.y + g.height - 4);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(g.x + 4, g.y + 7, 5, 8);
        ctx.fillRect(g.x + 16, g.y + 7, 5, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(g.x + 5, g.y + 9, 3, 5);
        ctx.fillRect(g.x + 17, g.y + 9, 3, 5);

        // Feet (waddling)
        ctx.fillStyle = '#000000';
        const footOffset = Math.sin(tick * 0.2) * 2;
        ctx.fillRect(g.x + 2, g.y + g.height - 4, 8, 4 + footOffset);
        ctx.fillRect(g.x + g.width - 10, g.y + g.height - 4, 8, 4 - footOffset);
      });

      // Mario Player Rendering
      const px = player.x;
      const py = player.y;

      ctx.save();
      // Invulnerability blinking effect (flash every 4 frames)
      if (state.invincibleTimer > 0) {
        if (Math.floor(tick / 4) % 2 === 0) {
          ctx.globalAlpha = 0.35;
        } else {
          ctx.globalAlpha = 0.85;
        }
      }

      if (player.facing === 'left') {
        ctx.translate(px + player.width, py);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(px, py);
      }

      // Red Cap
      ctx.fillStyle = '#d82800';
      ctx.fillRect(4, 0, 18, 8);
      ctx.fillRect(10, 4, 16, 6); // visor

      // Face
      ctx.fillStyle = '#fc9838';
      ctx.fillRect(6, 8, 16, 10);

      // Eye & Moustache
      ctx.fillStyle = '#000000';
      ctx.fillRect(16, 9, 3, 4); // eye
      ctx.fillRect(14, 13, 11, 4); // moustache
      ctx.fillRect(6, 12, 4, 5); // sideburn

      // Red Shirt
      ctx.fillStyle = '#d82800';
      ctx.fillRect(4, 18, 18, 10);

      // Blue Overalls
      ctx.fillStyle = '#0028a0';
      ctx.fillRect(6, 22, 14, 10);
      // Yellow buttons
      ctx.fillStyle = '#fce000';
      ctx.fillRect(8, 23, 3, 3);
      ctx.fillRect(15, 23, 3, 3);

      // Running Legs Animation
      ctx.fillStyle = '#0028a0';
      const legFrame = Math.floor(player.runFrame);
      if (!player.grounded) {
        // Jumping pose
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
        gameTitle="마리오 점프런"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-2xl">
            🍄
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              마리오 점프런 아케이드
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                멀티 스테이지 & 보너스 퀴즈
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              스페이스바 / 방향키로 장애물을 넘고, 결승선 골인 후 보너스 상식 퀴즈를 맞혀 신기록을 달성하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenLeaderboard('mario')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>마리오 랭킹</span>
          </button>
        </div>
      </div>

      {/* Stage Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 px-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>맵 스테이지 선택:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          {STAGE_DATA.map((stg) => {
            const isActive = stg.id === currentStageId;
            return (
              <button
                key={stg.id}
                onClick={() => handleSelectStage(stg.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
              >
                <span>{stg.badgeEmoji}</span>
                <span>{stg.stageCode} {stg.name}</span>
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
                <span className="text-[10px] text-slate-400 block font-normal leading-tight">PLAYER</span>
                <span className="text-white text-xs font-bold truncate max-w-[90px] block">{userProfile.name}</span>
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
              <span className="text-amber-400 text-sm font-black">{score.toLocaleString().padStart(6, '0')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-normal leading-tight">COINS</span>
              <span className="text-amber-300 text-sm font-black">🪙 x{coins.toString().padStart(2, '0')}</span>
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

        {/* 2D Platformer Canvas - Enlarged Wide Screen */}
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
                {userProfile.name} 님의 최종 기록이 전교 실시간 랭킹에 등록되었습니다!
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
          {/* Left / Right touch buttons */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="w-14 h-14 rounded-2xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center text-xl shadow select-none"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="w-14 h-14 rounded-2xl bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-200 border border-slate-700 flex items-center justify-center text-xl shadow select-none"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-400 text-center font-medium bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
            ⌨️ 키보드: <strong>A/D</strong> 또는 <strong>방향키</strong> 이동 · <strong>스페이스바</strong> 점프
          </div>

          {/* Jump touch button */}
          <button
            onMouseDown={() => {
              keysRef.current.jump = true;
            }}
            onMouseUp={() => {
              keysRef.current.jump = false;
            }}
            onTouchStart={() => {
              keysRef.current.jump = true;
            }}
            onTouchEnd={() => {
              keysRef.current.jump = false;
            }}
            className="w-24 h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 active:scale-95 text-slate-950 font-black border border-rose-400 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 select-none text-base"
          >
            <ArrowUp className="w-5 h-5 stroke-[3]" />
            <span>점프</span>
          </button>
        </div>
      </div>

      {/* Stage Clear & Bonus Quiz Modal */}
      <MarioBonusModal
        isOpen={isBonusModalOpen}
        stage={getStageById(currentStageId)}
        quiz={currentQuiz}
        currentScore={score}
        currentCoins={coins}
        onApplyBonus={handleApplyBonus}
        onNextStage={currentStageId < 3 ? handleNextStage : undefined}
        onFinishGame={handleFinishGame}
        onRetryStage={handleRetryStage}
      />

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="mario"
        title="마리오 러너 완주!"
        subTitle="환상적인 점프 컨트롤로 신기록을 달성했습니다!"
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
