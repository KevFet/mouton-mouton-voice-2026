import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, XOctagon, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface GameProps {
    theme: string;
    gameState: 'idle' | 'ready' | 'countdown' | 'flash' | 'validating' | 'match' | 'fail';
    countdownValue: number;
    score: number;
    tempScore: number;
    isReady: boolean;
    onReady: () => void;
    onValidate: (result: 'match' | 'fail') => void;
    onNext: (action: 'secure' | 'continue') => void;
}

export default function Game({
    theme,
    gameState,
    countdownValue,
    score,
    tempScore,
    isReady,
    onReady,
    onValidate,
    onNext
}: GameProps) {

    return (
        <div className="w-full flex-1 flex flex-col items-center justify-between z-10 p-6 max-w-sm mx-auto relative h-[100dvh]">

            {/* HUD (Header) */}
            <AnimatePresence>
                {gameState !== 'flash' && (
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 mt-8"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">Score</span>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-300 to-indigo-500">
                                {score}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">En jeu</span>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-teal-300 to-teal-500">
                                {tempScore}
                            </span>
                        </div>
                    </motion.header>
                )}
            </AnimatePresence>

            {/* Main View */}
            <main className="flex-1 flex flex-col justify-center items-center w-full relative">
                <AnimatePresence mode="wait">

                    {(gameState === 'idle' || gameState === 'ready') && (
                        <motion.div
                            key="theme"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center w-full flex flex-col items-center"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-16 tracking-tight px-4 break-words">
                                "{theme}"
                            </h2>

                            <motion.button
                                onClick={onReady}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-full h-20 rounded-3xl glass backdrop-blur-2xl border-2 flex items-center justify-center font-black uppercase tracking-widest text-xl transition-all duration-300 ${isReady ? 'border-teal-400 bg-teal-500/10 text-teal-400' : 'border-white/20 hover:border-white text-white shadow-[0_0_40px_rgba(255,255,255,0.1)]'}`}
                            >
                                {isReady ? 'EN ATTENTE...' : 'PRÊTS ?'}
                            </motion.button>
                        </motion.div>
                    )}

                    {gameState === 'countdown' && (
                        <motion.div
                            key="countdown"
                            className="absolute inset-0 flex items-center justify-center flex-col"
                        >
                            <motion.div
                                key={countdownValue}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-9xl font-black text-white mix-blend-overlay drop-shadow-[0_0_80px_rgba(255,255,255,1)]"
                            >
                                {countdownValue}
                            </motion.div>
                            <div className="absolute inset-0 border-[40px] border-white/10 rounded-full animate-ping z-[-1] opacity-20"></div>
                        </motion.div>
                    )}

                    {gameState === 'flash' && (
                        <motion.div
                            key="flash"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="fixed top-0 left-0 w-[100vw] h-[100vh] bg-white z-50 pointer-events-none"
                        />
                    )}

                    {gameState === 'validating' && (
                        <motion.div
                            key="validating"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full h-full flex flex-col items-center justify-center gap-6"
                        >
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onValidate('match')}
                                className="w-full h-32 rounded-[2rem] bg-gradient-to-br from-teal-400/20 to-teal-600/10 backdrop-blur-2xl border-2 border-teal-400 text-teal-100 font-extrabold uppercase tracking-widest text-3xl shadow-[0_0_50px_rgba(20,184,166,0.3)] flex items-center justify-center gap-4"
                            >
                                <CheckCircle2 className="w-10 h-10 text-teal-300" />
                                ON L'A !
                            </motion.button>
                            <div className="text-white/30 text-xs font-bold uppercase tracking-widest">Self Report</div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onValidate('fail')}
                                className="w-full h-24 rounded-[2rem] bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-2xl border border-red-500/50 text-red-200 font-bold uppercase tracking-widest text-xl shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-center justify-center gap-3"
                            >
                                <XOctagon className="w-6 h-6 text-red-400" />
                                RATÉ
                            </motion.button>
                        </motion.div>
                    )}

                    {gameState === 'match' && (
                        <motion.div
                            key="match"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5 }}
                            >
                                <Sparkles className="w-24 h-24 text-teal-400 drop-shadow-[0_0_40px_rgba(45,212,191,0.8)] mb-8" />
                            </motion.div>

                            <h3 className="text-2xl font-black text-white mb-10 tracking-widest uppercase">Incroyable !</h3>

                            <div className="w-full flex gap-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onNext('secure')}
                                    className="flex-1 h-20 rounded-2xl glass backdrop-blur-md border border-indigo-400/50 text-indigo-200 font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                                >
                                    <ShieldCheck className="w-6 h-6 mb-1 text-indigo-300" />
                                    Sécuriser
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onNext('continue')}
                                    className="flex-1 h-20 rounded-2xl bg-teal-500/20 backdrop-blur-md border-2 border-teal-400 text-teal-100 font-bold uppercase tracking-wider text-sm flex flex-col items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)]"
                                >
                                    <ArrowRight className="w-6 h-6 mb-1 text-teal-300" />
                                    Continuer
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'fail' && (
                        <motion.div
                            key="fail"
                            initial={{ x: [-10, 10, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                            className="w-full flex flex-col items-center"
                        >
                            <h3 className="text-4xl font-black text-red-500 tracking-widest uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] mb-8">BRISÉ</h3>
                            <p className="text-white/60 mb-12">Retour à la case départ.</p>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onNext('continue')}
                                className="w-full h-16 rounded-2xl glass backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                            >
                                Nouveau Thème
                            </motion.button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
