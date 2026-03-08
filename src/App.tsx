import { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { supabase } from './lib/supabase';
import { prompts } from './data/prompts';

type GameState = 'lobby' | 'ready' | 'playing' | 'decision' | 'turn_over';

const translations = {
  en: {
    title: "SAME PAGE",
    subtitle: "Sync your mind",
    teamName: "Team Name",
    roomCode: "Room Code",
    join: "JOIN ROOM",
    currentRoom: "Current Room",
    waiting: "Waiting for other team...",
    readyToPlay: "Ready to play!",
    startGame: "START GAME",
    readerWait: "Waiting for the other team...",
    yourTurn: "GUESSING TEAM",
    readerTurn: "READING TEAM",
    listen: "Listen to the other team and shout the same word together!",
    readThis: "READ THIS LOUDLY:",
    matchBtn: "THEY MATCHED!",
    failBtn: "THEY FAILED",
    waitingDecision: "They matched! Waiting for their decision...",
    youMatched: "MATCH!",
    secure: "SECURE POINTS",
    continue: "KEEP GOING",
    turnOver: "TURN FINISHED",
    rolesSwitched: "Roles have switched.",
    activeTeamLabel: "GUESSING",
    nextTurnLabel: "NEXT TO GUESS",
    startTurnBtn: "DRAW THEME",
    score: "Score",
    tempScore: "Streak",
    you: "You",
    them: "Them"
  },
  es: {
    title: "¡IGUALITO!",
    subtitle: "Sincroniza tu mente",
    teamName: "Nombre del Equipo",
    roomCode: "Código de Sala",
    join: "UNIRSE A LA SALA",
    currentRoom: "Sala Actual",
    waiting: "Esperando al otro equipo...",
    readyToPlay: "¡Listos para jugar!",
    startGame: "COMENZAR PARTIDA",
    readerWait: "Esperando al otro equipo...",
    yourTurn: "EQUIPO ADIVINADOR",
    readerTurn: "EQUIPO LECTOR",
    listen: "¡Escuchen al otro equipo y griten la misma palabra a la vez!",
    readThis: "LEE ESTO EN VOZ ALTA:",
    matchBtn: "¡COINCIDIERON!",
    failBtn: "FALLARON",
    waitingDecision: "¡Coincidieron! Esperando su decisión...",
    youMatched: "¡COINCIDENCIA!",
    secure: "ASEGURAR PUNTOS",
    continue: "CONTINUAR",
    turnOver: "FIN DEL TURNO",
    rolesSwitched: "Se han cambiado los roles.",
    activeTeamLabel: "ADIVINANDO",
    nextTurnLabel: "SIGUIENTES EN ADIVINAR",
    startTurnBtn: "SACAR TEMA",
    score: "Puntos",
    tempScore: "Racha",
    you: "Tú",
    them: "Ellos"
  }
}

export default function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [teams, setTeams] = useState<{ id: string; username: string }[]>([]);
  const [room, setRoom] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = translations[lang];

  const [gameState, setGameState] = useState<GameState>('lobby');
  const [theme, setTheme] = useState(prompts.en[0]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [tempScore, setTempScore] = useState(0);
  const [activeTeamId, setActiveTeamId] = useState<string>('');

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!room) return;

    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: currentUsername } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activePlayers = Object.keys(state).map(key => {
          const presenceObj = state[key][0] as any;
          return {
            id: key,
            username: presenceObj.username as string
          };
        });
        setTeams(activePlayers);
      })
      .on('broadcast', { event: 'game_action' }, (payload) => {
        processAction(payload.payload.action, payload.payload.data);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username: currentUsername });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, currentUsername]);

  const processAction = (action: string, data: any) => {
    if (action === 'start_game') {
      setActiveTeamId(data.activeTeamId);
      setView('game');
      setGameState('ready');
    } else if (action === 'start_turn' || action === 'continue') {
      setTheme(data.theme);
      setGameState('playing');
      if (action === 'start_turn') setTempScore(0);
    } else if (action === 'match') {
      setGameState('decision');
      setTempScore(prev => prev + 100);
    } else if (action === 'fail') {
      setGameState('turn_over');
      setTempScore(0);
      setActiveTeamId(data.newActiveTeamId);
    } else if (action === 'secure') {
      setScores(prev => ({ ...prev, [data.oldActiveTeamId]: (prev[data.oldActiveTeamId] || 0) + data.tempScore }));
      setTempScore(0);
      setGameState('turn_over');
      setActiveTeamId(data.newActiveTeamId);
    } else if (action === 'lang') {
      setLang(data.lang);
    }
  };

  const getRandomTheme = (currentLang: 'en' | 'es') => {
    const list = prompts[currentLang];
    return list[Math.floor(Math.random() * list.length)];
  };

  const handleAction = (action: 'start_turn' | 'match' | 'fail' | 'secure' | 'continue') => {
    const data: any = {};

    if (action === 'start_turn' || action === 'continue') {
      data.theme = getRandomTheme(lang);
    } else if (action === 'fail') {
      data.newActiveTeamId = teams.find(p => p.id !== activeTeamId)?.id || activeTeamId;
    } else if (action === 'secure') {
      data.oldActiveTeamId = activeTeamId;
      data.tempScore = tempScore;
      data.newActiveTeamId = teams.find(p => p.id !== activeTeamId)?.id || activeTeamId;
    }

    // Optimistic update
    processAction(action, data);

    // Broadcast update
    channelRef.current?.send({
      type: 'broadcast',
      event: 'game_action',
      payload: { action, data }
    });
  };

  const handleStartGame = () => {
    const firstActive = teams[0]?.id || currentUsername; // Fallback
    const data = { activeTeamId: firstActive };

    processAction('start_game', data);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'game_action',
      payload: { action: 'start_game', data }
    });
  };

  const handleJoin = (username: string, rCode: string) => {
    setCurrentUsername(username);
    setRoom(rCode);
  };

  const handleSetLang = (newLang: 'en' | 'es') => {
    setLang(newLang);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'game_action',
      payload: { action: 'lang', data: { lang: newLang } }
    });
  };

  const myTeamId = teams.find(t => t.username === currentUsername)?.id || currentUsername;
  const role = myTeamId === activeTeamId ? 'guesser' : 'reader';

  return (
    <>
      <div className="mesh-bg" />
      <div className="noise-overlay" />
      {view === 'lobby' ? (
        <Lobby
          onJoinRoom={handleJoin}
          teams={teams}
          currentUsername={currentUsername}
          onStartGame={handleStartGame}
          lang={lang}
          setLang={handleSetLang}
          t={t}
        />
      ) : (
        <Game
          theme={theme}
          gameState={gameState as 'ready' | 'playing' | 'decision' | 'turn_over'}
          role={role as 'guesser' | 'reader'}
          scores={scores}
          tempScore={tempScore}
          teams={teams}
          activeTeamId={activeTeamId}
          myTeamId={myTeamId}
          onAction={handleAction}
          t={t}
        />
      )}
    </>
  );
}
