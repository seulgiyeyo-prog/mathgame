interface RealisticPieceProps {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
  isSelected?: boolean;
}

const PIECE_LABELS: Record<string, string> = {
  k: '킹',
  q: '퀸',
  r: '룩',
  b: '비숍',
  n: '나이트',
  p: '폰',
};

export default function RealisticChessPiece({ type, color, isSelected = false }: RealisticPieceProps) {
  const isWhite = color === 'w';

  // SVG-based 3D realistic rendering with gradients, bevels, inner shadows, and rim highlights
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none transition-all duration-150 ${
        isSelected ? 'scale-115 -translate-y-1.5' : 'hover:scale-105'
      }`}
      title={`${isWhite ? '백군' : '흑군'} ${PIECE_LABELS[type]}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[82%] h-[82%] drop-shadow-[0_6px_5px_rgba(0,0,0,0.55)] filter"
      >
        <defs>
          {/* White Piece 3D Ivory Gradient */}
          <linearGradient id="whitePieceBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f8f5ee" />
            <stop offset="75%" stopColor="#e2d8c3" />
            <stop offset="100%" stopColor="#bfae92" />
          </linearGradient>

          {/* White Piece Specular Highlight */}
          <linearGradient id="whitePieceHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>

          {/* Black Piece 3D Obsidian Gradient */}
          <linearGradient id="blackPieceBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d4451" />
            <stop offset="35%" stopColor="#252a34" />
            <stop offset="80%" stopColor="#12161f" />
            <stop offset="100%" stopColor="#080a0f" />
          </linearGradient>

          {/* Black Piece Rim Light */}
          <linearGradient id="blackPieceRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
          </linearGradient>

          {/* Base Pedestal Gradient */}
          <linearGradient id="basePedestalWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#cfc2aa" />
            <stop offset="100%" stopColor="#9a8a70" />
          </linearGradient>
          <linearGradient id="basePedestalBlack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0a0f1d" />
          </linearGradient>
        </defs>

        {/* Global Common Base Pedestal */}
        <g>
          {/* Base bottom ring */}
          <ellipse
            cx="50"
            cy="86"
            rx="32"
            ry="9"
            fill={isWhite ? 'url(#basePedestalWhite)' : 'url(#basePedestalBlack)'}
            stroke={isWhite ? '#a39379' : '#05070a'}
            strokeWidth="1.5"
          />
          {/* Base bottom edge shadow */}
          <ellipse
            cx="50"
            cy="88"
            rx="30"
            ry="6"
            fill="none"
            stroke={isWhite ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.7)'}
            strokeWidth="1.2"
          />
          {/* Base collar */}
          <ellipse
            cx="50"
            cy="81"
            rx="24"
            ry="5.5"
            fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
            stroke={isWhite ? '#b8a990' : '#1e293b'}
            strokeWidth="1.2"
          />
        </g>

        {/* --- PIECE SPECIFIC SHAPES --- */}

        {/* 1. PAWN */}
        {type === 'p' && (
          <g>
            {/* Stem */}
            <path
              d="M36 81 C36 70, 42 62, 44 48 L56 48 C58 62, 64 70, 64 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Neck Ring */}
            <ellipse
              cx="50"
              cy="47"
              rx="15"
              ry="4"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#b8a990' : '#1e293b'}
              strokeWidth="1.2"
            />
            {/* Head Ball */}
            <circle
              cx="50"
              cy="31"
              r="15"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Head Specular Highlight */}
            <ellipse
              cx="45"
              cy="25"
              rx="6"
              ry="4"
              fill="white"
              opacity={isWhite ? '0.75' : '0.25'}
            />
          </g>
        )}

        {/* 2. ROOK */}
        {type === 'r' && (
          <g>
            {/* Column Body */}
            <path
              d="M33 81 L36 44 L64 44 L67 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Middle decorative band */}
            <ellipse
              cx="50"
              cy="44"
              rx="18"
              ry="4"
              fill={isWhite ? '#f5ede0' : '#334155'}
              stroke={isWhite ? '#b8a990' : '#0f172a'}
              strokeWidth="1"
            />
            {/* Castle Ramparts base */}
            <path
              d="M28 42 L28 24 L72 24 L72 42 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Castle crenels (embrasures) */}
            <rect
              x="37"
              y="22"
              width="7"
              height="10"
              fill={isWhite ? '#e2d8c3' : '#0f172a'}
            />
            <rect
              x="56"
              y="22"
              width="7"
              height="10"
              fill={isWhite ? '#e2d8c3' : '#0f172a'}
            />
            {/* Highlight */}
            <path
              d="M32 26 L34 40"
              stroke="white"
              strokeWidth="1.5"
              opacity={isWhite ? '0.8' : '0.3'}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 3. KNIGHT */}
        {type === 'n' && (
          <g>
            {/* Horse Head and Mane Profile */}
            <path
              d="M32 81 C32 75 36 68 35 56 C33 46 25 43 25 36 C25 28 32 24 38 22 C42 16 50 14 55 16 C57 17 58 20 62 21 C68 22 73 27 74 34 C75 42 70 50 71 58 C72 66 68 76 68 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Mane Tufts */}
            <path
              d="M62 22 C67 26 69 32 68 38 M68 40 C73 45 74 53 72 60 M71 63 C75 68 74 74 70 78"
              stroke={isWhite ? '#c7b9a1' : '#475569'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Horse Ear */}
            <polygon
              points="48,14 53,24 45,22"
              fill={isWhite ? '#f8f5ee' : '#334155'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.2"
            />
            {/* Horse Eye */}
            <ellipse
              cx="40"
              cy="29"
              rx="2.5"
              ry="3.5"
              fill={isWhite ? '#2d3748' : '#38bdf8'}
            />
            <circle cx="39" cy="28" r="1" fill="white" />
            {/* Snout and Mouth */}
            <path
              d="M26 36 C27 40 33 41 37 39"
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        )}

        {/* 4. BISHOP */}
        {type === 'b' && (
          <g>
            {/* Stem */}
            <path
              d="M35 81 C36 68, 42 60, 44 48 L56 48 C58 60, 64 68, 65 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Collar */}
            <ellipse
              cx="50"
              cy="48"
              rx="16"
              ry="4"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#b8a990' : '#1e293b'}
              strokeWidth="1.2"
            />
            {/* Mitre (Head oval) */}
            <path
              d="M34 46 C32 30 40 18 50 14 C60 18 68 30 66 46 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Bishop Mitre Cut/Slash */}
            <path
              d="M48 24 L58 35"
              stroke={isWhite ? '#ab9b82' : '#0a0f1d'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Top pommel ball */}
            <circle
              cx="50"
              cy="12"
              r="3.5"
              fill={isWhite ? '#fef08a' : '#94a3b8'}
              stroke={isWhite ? '#ca8a04' : '#0f172a'}
              strokeWidth="1"
            />
          </g>
        )}

        {/* 5. QUEEN */}
        {type === 'q' && (
          <g>
            {/* Body Sweep */}
            <path
              d="M34 81 C35 66 42 56 44 44 L56 44 C58 56 65 66 66 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Waist Ring */}
            <ellipse
              cx="50"
              cy="44"
              rx="17"
              ry="4"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#b8a990' : '#1e293b'}
              strokeWidth="1.2"
            />
            {/* Crown Flairs */}
            <path
              d="M29 28 L37 44 L50 34 L63 44 L71 28 L61 32 L50 20 L39 32 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Crown Jewel Pearls */}
            <circle cx="29" cy="26" r="2.8" fill={isWhite ? '#fef08a' : '#38bdf8'} stroke="#000" strokeWidth="0.5" />
            <circle cx="39" cy="20" r="2.5" fill={isWhite ? '#fef08a' : '#38bdf8'} stroke="#000" strokeWidth="0.5" />
            <circle cx="50" cy="17" r="3.2" fill={isWhite ? '#fef08a' : '#38bdf8'} stroke="#000" strokeWidth="0.5" />
            <circle cx="61" cy="20" r="2.5" fill={isWhite ? '#fef08a' : '#38bdf8'} stroke="#000" strokeWidth="0.5" />
            <circle cx="71" cy="26" r="2.8" fill={isWhite ? '#fef08a' : '#38bdf8'} stroke="#000" strokeWidth="0.5" />
          </g>
        )}

        {/* 6. KING */}
        {type === 'k' && (
          <g>
            {/* Royal Cloak Body */}
            <path
              d="M33 81 C34 65 41 55 43 42 L57 42 C59 55 66 65 67 81 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Royal Belt */}
            <ellipse
              cx="50"
              cy="42"
              rx="18"
              ry="4.5"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#b8a990' : '#1e293b'}
              strokeWidth="1.2"
            />
            {/* King Crown Dome */}
            <path
              d="M31 38 C28 26 38 20 50 20 C62 20 72 26 69 38 Z"
              fill={isWhite ? 'url(#whitePieceBody)' : 'url(#blackPieceBody)'}
              stroke={isWhite ? '#ab9b82' : '#0f172a'}
              strokeWidth="1.5"
            />
            {/* Cross On Top */}
            <g stroke={isWhite ? '#d97706' : '#94a3b8'} strokeWidth="2.8" strokeLinecap="round">
              <line x1="50" y1="8" x2="50" y2="19" />
              <line x1="44" y1="12" x2="56" y2="12" />
            </g>
            <circle cx="50" cy="12" r="1.5" fill={isWhite ? '#fef08a' : '#38bdf8'} />
          </g>
        )}
      </svg>
    </div>
  );
}
