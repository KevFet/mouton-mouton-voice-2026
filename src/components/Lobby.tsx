import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, LogIn, PlayCircle } from 'lucide-react';

interface LobbyProps {
    onJoinRoom: (username: string, roomCode: string) => void;
    players: { id: string; username: string }[];
    currentUsername: string;
    onStartGame: () => void;
}

export default function Lobby({ onJoinRoom, players, currentUsername, onStartGame }: LobbyProps) {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && room.trim()) {
            onJoinRoom(name.trim(), room.trim().toUpperCase());
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen z-10 relative px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md flex flex-col items-center glass p-8 rounded-3xl"
            >
                <h1 className="text-4xl font-extrabold tracking-tighter mb-2 text-center bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                    MOUTON MOUTON
                </h1>
                <p className="text-white/50 text-sm font-medium tracking-widest uppercase mb-12">
                    Sync your mind
                </p>

                {!currentUsername ? (
                    <form onSubmit={handleJoin} className="w-full flex-col flex gap-4">
                        <input
                            type="text"
                            placeholder="Ton pseudo"
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium backdrop-blur-md"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={12}
                        />
                        <input
                            type="text"
                            placeholder="Code Salle (ex: 2026)"
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white placeholder-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all font-medium backdrop-blur-md uppercase tracking-widest text-center"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            required
                            maxLength={6}
                        />
                        <button
                            type="submit"
                            className="w-full h-14 mt-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
                        >
                            <LogIn className="w-5 h-5" /> REJOINDRE
                        </button>
                    </form>
                ) : (
                    <div className="w-full flex flex-col items-center gap-8">
                        <div className="text-center">
                            <p className="text-white/50 font-medium tracking-widest uppercase text-xs mb-2">Salle Actuelle</p>
                            <h2 className="text-5xl font-bold tracking-widest text-white">{room}</h2>
                        </div>

                        <div className="flex justify-center items-center gap-6 mt-4 w-full">
                            {players.length > 0 ? players.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, y: [-5, 5, -5] }}
                                    transition={{
                                        y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: idx * 0.5 },
                                        scale: { type: "spring", stiffness: 200, damping: 20 }
                                    }}
                                    className="w-24 h-24 rounded-full glass flex items-center justify-center overflow-hidden border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-teal-500/20 mix-blend-overlay" />
                                    <span className="font-bold tracking-wider uppercase truncate max-w-full px-2 z-10 text-white shadow-black/50 drop-shadow-md">
                                        {p.username}
                                    </span>
                                </motion.div>
                            )) : (
                                <div className="flex items-center gap-3 text-white/40">
                                    <Users className="animate-pulse" />
                                    <span className="tracking-widest uppercase text-sm">En attente des joueurs...</span>
                                </div>
                            )}
                        </div>

                        {players.length === 2 && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onStartGame}
                                className="w-full h-16 mt-8 bg-gradient-to-r from-teal-400 to-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(20,184,166,0.3)] flex items-center justify-center gap-3"
                            >
                                <PlayCircle className="w-6 h-6" /> DÉMARRER LA PARTIE
                            </motion.button>
                        )}
                        {players.length < 2 && currentUsername && (
                            <motion.div
                                className="text-center text-white/50 font-medium tracking-widest uppercase text-xs mt-8 loading-dots"
                            >
                                Attente du partenaire
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
