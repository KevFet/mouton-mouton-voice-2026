import { motion, AnimatePresence } from 'framer-motion';
import { XOctagon, CheckCircle2, ArrowRight, Play, RefreshCw, Eye } from 'lucide-react';

interface GameProps {
    theme: string;
    gameState: 'ready' | 'playing' | 'word_result' | 'turn_over';
    role: 'reader' | 'guesser';
    scores: Record<string, number>;
    turnWordIndex: number;
    lastResult: 'match' | 'fail' | null;
    teams: { id: string; username: string }[];
    activeTeamId: string;
    myTeamId: string;
    onAction: (action: 'start_turn' | 'match' | 'fail' | 'next_word', payload?: any) => void;
    t: any;
}

export default function Game({
    theme,
    gameState,
    role,
    scores,
    turnWordIndex,
    lastResult,
    teams,
    activeTeamId,
    myTeamId,
    onAction,
    t
}: GameProps) {

    const activeTeamName = teams.find(team => team.id === activeTeamId)?.username || '';
    const myScore = scores[myTeamId] || 0;
    const otherTeamId = teams.find(team => team.id !== myTeamId)?.id || '';
    const otherScore = scores[otherTeamId] || 0;

    const levelLabel = turnWordIndex === 0 ? t.level0 : turnWordIndex === 1 ? t.level1 : t.level2;

    return (
        <div className="w-full flex-1 flex flex-col items-center justify-between z-10 p-6 mx-auto relative h-[100dvh]">

            {/* HUD (Header) */}
            <header className="w-full max-w-sm flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 mt-8">
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">{t.you} ({myScore})</span>
                </div>
                <div className="flex flex-col items-center w-1/3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-teal-300">{gameState === 'ready' || gameState === 'turn_over' ? '' : levelLabel}</span>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-teal-300 to-indigo-400">
                        {gameState === 'ready' || gameState === 'turn_over' ? '-' : `${turnWordIndex + 1}/3`}
                    </span>
                </div>
                <div className="flex flex-col items-end w-1/3">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">{t.them} ({otherScore})</span>
                </div>
            </header>

            {/* Main View */}
            <main className="flex-1 flex flex-col justify-center items-center w-full max-w-lg relative px-4">
                <AnimatePresence mode="wait">

                    {gameState === 'ready' && (
                        <motion.div
                            key="ready"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center w-full flex flex-col items-center"
                        >
                            <h2 className={`text-4xl font-black mb-4 tracking-widest uppercase ${role === 'reader' ? 'text-indigo-300' : 'text-teal-300'}`}>
                                {role === 'reader' ? t.readerTurn : t.yourTurn}
                            </h2>
                            <p className="text-white/60 mb-12 uppercase tracking-widest text-sm">
                                {t.activeTeamLabel}: <span className="text-white font-bold">{activeTeamName}</span>
                            </p>

                            {role === 'reader' ? (
                                <motion.button
                                    onClick={() => onAction('start_turn')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full h-20 rounded-3xl bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-black uppercase tracking-widest text-xl shadow-[0_0_40px_rgba(20,184,166,0.3)] flex items-center justify-center gap-3"
                                >
                                    <Play className="w-6 h-6" /> {t.startTurnBtn}
                                </motion.button>
                            ) : (
                                <div className="text-white/50 uppercase tracking-widest text-sm text-center animate-pulse flex flex-col items-center gap-4">
                                    <Eye className="w-8 h-8 opacity-50" />
                                    {t.readerWait}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full flex flex-col items-center"
                        >
                            {role === 'reader' ? (
                                <>
                                    <div className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-6 text-center">{t.readThis}</div>
                                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-16 tracking-tight text-center break-words bg-white/5 p-8 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)] w-full">
                                        "{theme}"
                                    </h2>

                                    <div className="w-full flex gap-4 mt-8">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onAction('fail')}
                                            className="flex-1 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-2xl border border-red-500/50 text-red-200 font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(239,68,68,0.1)] flex flex-col items-center justify-center gap-2"
                                        >
                                            <XOctagon className="w-6 h-6 text-red-400" />
                                            {t.failBtn}
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onAction('match')}
                                            className="flex-1 h-20 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/10 backdrop-blur-2xl border-2 border-teal-400 text-teal-100 font-extrabold uppercase tracking-widest text-sm shadow-[0_0_50px_rgba(20,184,166,0.3)] flex flex-col items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-7 h-7 text-teal-300" />
                                            {t.matchBtn}
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-48 h-48 rounded-full border-[10px] border-white/5 border-t-teal-400 animate-spin mb-12 shadow-[0_0_50px_rgba(20,184,166,0.3)]"></div>
                                    <h3 className="text-2xl font-black text-white text-center tracking-widest uppercase leading-loose text-shadow-lg p-6">
                                        {t.listen}
                                    </h3>
                                </>
                            )}
                        </motion.div>
                    )}

                    {gameState === 'word_result' && (
                        <motion.div
                            key="word_result"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full flex flex-col items-center"
                        >
                            <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}>
                                {lastResult === 'match' ? (
                                    <CheckCircle2 className="w-24 h-24 text-teal-400 drop-shadow-[0_0_40px_rgba(45,212,191,0.8)] mb-8" />
                                ) : (
                                    <XOctagon className="w-24 h-24 text-red-400 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] mb-8" />
                                )}
                            </motion.div>
                            <h3 className={`text-4xl font-black mb-8 tracking-widest uppercase ${lastResult === 'match' ? 'text-teal-300' : 'text-red-300'}`}>
                                {lastResult === 'match' ? t.wordMatched : t.wordFailed}
                            </h3>

                            {role === 'reader' ? (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onAction('next_word')}
                                    className="w-full h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 backdrop-blur-md border border-indigo-400/50 text-indigo-100 font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                                >
                                    {turnWordIndex < 2 ? t.nextWord : t.finishTurn}
                                    <ArrowRight className="w-6 h-6 text-indigo-300" />
                                </motion.button>
                            ) : (
                                <div className="text-white/50 uppercase tracking-widest text-sm loading-dots flex flex-col items-center gap-4 mt-8">
                                    <Eye className="w-8 h-8 opacity-50" />
                                    {t.readerWait}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {gameState === 'turn_over' && (
                        <motion.div
                            key="turn_over"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <h3 className="text-4xl font-black text-white tracking-widest uppercase mb-4 text-center">{t.turnOver}</h3>
                            <p className="text-white/60 mb-12 uppercase tracking-widest text-center text-sm leading-loose">
                                {t.rolesSwitched}<br />
                                <span className="text-indigo-400 font-bold mt-4 block text-lg">{t.nextTurnLabel}: {activeTeamName}</span>
                            </p>

                            {role === 'reader' ? (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onAction('start_turn')}
                                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                >
                                    <RefreshCw className="w-5 h-5" /> {t.startTurnBtn}
                                </motion.button>
                            ) : (
                                <div className="text-white/50 uppercase tracking-widest text-sm loading-dots flex flex-col items-center gap-4 mt-8">
                                    <Eye className="w-8 h-8 opacity-50" />
                                    {t.readerWait}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
