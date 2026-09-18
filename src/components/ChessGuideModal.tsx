import { X, Crown, Shield, Crosshair, Move, Compass, CheckCircle2 } from 'lucide-react';

interface ChessGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PieceGuide {
  symbol: { w: string; b: string };
  name: string;
  nameEn: string;
  value: string;
  role: string;
  moveDesc: string;
  tactics: string;
  colorBadge: string;
}

const PIECE_GUIDES: PieceGuide[] = [
  {
    symbol: { w: '♔', b: '♚' },
    name: '킹 (King)',
    nameEn: 'K',
    value: '무한대 (생명 그 자체)',
    role: '군대의 총사령관',
    moveDesc: '상하좌우 및 대각선 모든 방향으로 딱 1칸씩 이동합니다.',
    tactics: '킹이 잡히면(체크메이트) 게임이 즉시 종료됩니다! 안전한 위치에 보호하세요.',
    colorBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    symbol: { w: '♕', b: '♛' },
    name: '퀸 (Queen)',
    nameEn: 'Q',
    value: '9점 (필드 최강 기물)',
    role: '전장을 지배하는 에이스',
    moveDesc: '가로, 세로, 대각선 모든 방향으로 원하는 칸 수만큼 자유롭게 질주합니다.',
    tactics: '룩과 비숍의 힘을 합친 체스판 최강의 공격수! 초반에 함부로 잃지 않도록 조심하세요.',
    colorBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    symbol: { w: '♖', b: '♜' },
    name: '룩 (Rook)',
    nameEn: 'R',
    value: '5점 (중화력 기물)',
    role: '직선 돌파 전차',
    moveDesc: '가로(행)와 세로(열) 직선 방향으로 장애물 전까지 무제한 이동합니다.',
    tactics: '탁 트인 개방형 열(Open File)을 장악하면 엔드게임에서 엄청난 파괴력을 발휘합니다.',
    colorBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    symbol: { w: '♗', b: '♝' },
    name: '비숍 (Bishop)',
    nameEn: 'B',
    value: '3점 (경쾌한 저격수)',
    role: '대각선 저격수',
    moveDesc: '자신이 서 있는 칸 색상(밝은색/어두운색)의 대각선으로만 무제한 이동합니다.',
    tactics: '게임 내내 자신이 처음 출발한 색상의 칸만 밟을 수 있습니다. 퀸과 함께 대각선을 노려보세요.',
    colorBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    symbol: { w: '♘', b: '♞' },
    name: '나이트 (Knight)',
    nameEn: 'N',
    value: '3점 (변칙의 마술사)',
    role: '장벽을 뛰어넘는 기마병',
    moveDesc: '앞으로 2칸 직진 후 옆으로 1칸 꺾이는 "L자(2+1)" 모양으로 이동합니다.',
    tactics: '체스 기물 중 유일하게 아군이나 적군 말을 "뛰어넘을 수" 있어 복잡한 진형을 뚫는 해결사입니다.',
    colorBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    symbol: { w: '♙', b: '♟' },
    name: '폰 (Pawn)',
    nameEn: 'P',
    value: '1점 (보병이자 잠재적 퀸)',
    role: '돌격 보병 & 승급의 기적',
    moveDesc: '오직 앞으로만 1칸 전진(출발 위치에서는 2칸 전진 가능). 적을 잡을 때는 "대각선 앞 1칸"으로만 잡습니다.',
    tactics: '뒤로 후퇴할 수 없습니다. 적진의 맨 끝 8번째 줄에 도달하면 무조건 "퀸(Queen)"으로 승급(Promotion)합니다!',
    colorBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
];

export default function ChessGuideModal({ isOpen, onClose }: ChessGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
              ♟️
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                체스 완벽 가이드북
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  중1 눈높이
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                기물별 이동 규칙과 특수 승급 규칙, 승리 전략을 한눈에 익혀보세요!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Quick Rules Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-sm font-black text-amber-400">
              <Crown className="w-4 h-4" />
              <span>체스 기본 규칙 & 승리 조건</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong>백(White) 선공</strong>: 백군이 항상 먼저 첫 수를 두고, 흑군과 번갈아 가며 한 수씩 둡니다.
              </li>
              <li>
                <strong>체크(Check)와 대응 3원칙</strong>: 내 킹이 적에게 조준당하면 즉시 <strong>① 킹이 안전한 칸으로 피하기, ② 아군 기물로 공격 경로를 가로막기, ③ 공격하는 적의 기물을 잡아내기</strong> 중 하나로 반드시 벗어나야 합니다.
              </li>
              <li>
                <strong>체크메이트(Checkmate)</strong>: 체크를 피할 수 있는 합법적인 수가 전혀 없다면 체크메이트로 게임이 끝납니다!
              </li>
              <li>
                <strong>폰 승급(Promotion)</strong>: 폰이 상대 진영 끝까지 살아남아 전진하면 <strong>가장 강력한 퀸(Queen)</strong>으로 자동 승급합니다!
              </li>
            </ul>
          </div>

          {/* 6 Pieces Guide Cards */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>6가지 체스 기물 상세 설명</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PIECE_GUIDES.map((piece) => (
                <div
                  key={piece.name}
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow">
                        {piece.symbol.b}
                      </div>
                      <div>
                        <div className="font-black text-white text-sm">
                          {piece.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {piece.role}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${piece.colorBadge}`}>
                      가치: {piece.value}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <strong className="text-blue-400">📍 이동:</strong> {piece.moveDesc}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <strong className="text-amber-400">💡 전술 꿀팁:</strong> {piece.tactics}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">중1 체스 승리 비결 3가지</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                1. <strong>중앙(Center) 장악</strong>: d열과 e열의 폰을 전진시켜 중앙 영역을 선점하세요.<br />
                2. <strong>기물 전개</strong>: 초반에 나이트와 비숍을 먼저 전진시켜 공격 활로를 여세요.<br />
                3. <strong>무리한 퀸 돌출 금지</strong>: 퀸을 너무 일찍 내보내면 상대 마이너 기물들의 공격 목표가 됩니다!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
          >
            이해했어요! 게임 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
