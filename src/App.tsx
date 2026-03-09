import { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { supabase } from './lib/supabase';
import { prompts } from './data/prompts';

type GameState = 'lobby' | 'ready' | 'playing' | 'word_result' | 'turn_over';

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
    rulesTitle: "HOW TO PLAY",
    rulesText: "1. The Reading Team sees a theme.\n2. The Guessing Team listens and shouts ONE word together.\n3. If they say the exact same word, it's a MATCH (+1 pt).\n4. 3 words per turn: Easy, Medium, Hard.\n5. Then teams switch roles!",
    readerWait: "Waiting for the other team...",
    yourTurn: "GUESSING TEAM",
    readerTurn: "READING TEAM",
    listen: "Listen to the other team and shout the same word together!",
    readThis: "READ THIS LOUDLY:",
    matchBtn: "THEY MATCHED!",
    failBtn: "THEY FAILED",
    wordMatched: "MATCH! +1 PT",
    wordFailed: "FAILED",
    nextWord: "NEXT WORD",
    finishTurn: "FINISH TURN",
    level0: "EASY",
    level1: "MEDIUM",
    level2: "HARD",
    turnOver: "TURN FINISHED",
    rolesSwitched: "Roles have switched.",
    activeTeamLabel: "GUESSING",
    nextTurnLabel: "NEXT TO GUESS",
    startTurnBtn: "DRAW THEME",
    score: "Score",
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
    rulesTitle: "CÓMO JUGAR",
    rulesText: "1. El Equipo Lector ve un tema.\n2. El Equipo Adivinador escucha y grita UN palabra al mismo tiempo.\n3. Si dicen lo mismo, ¡COINCIDENCIA! (+1 pt).\n4. 3 temas por turno: Fácil, Medio, Difícil.\n5. ¡Luego cambian de roles!",
    readerWait: "Esperando al otro equipo...",
    yourTurn: "EQUIPO ADIVINADOR",
    readerTurn: "EQUIPO LECTOR",
    listen: "¡Escuchen al otro equipo y griten la misma palabra a la vez!",
    readThis: "LEE ESTO EN VOZ ALTA:",
    matchBtn: "¡COINCIDIERON!",
    failBtn: "FALLARON",
    wordMatched: "¡COINCIDENCIA! +1 PT",
    wordFailed: "FALLARON",
    nextWord: "SIGUIENTE",
    finishTurn: "TERMINAR TURNO",
    level0: "FÁCIL",
    level1: "MEDIO",
    level2: "DIFÍCIL",
    turnOver: "FIN DEL TURNO",
    rolesSwitched: "Se han cambiado los roles.",
    activeTeamLabel: "ADIVINANDO",
    nextTurnLabel: "SIGUIENTES EN ADIVINAR",
    startTurnBtn: "SACAR TEMA",
    score: "Puntos",
    you: "Tú",
    them: "Ellos"
  },
  fr: {
    title: "MÊME PAGE",
    subtitle: "Synchronisez vos esprits",
    teamName: "Nom de l'Équipe",
    roomCode: "Code de Salle",
    join: "REJOINDRE",
    currentRoom: "Salle Actuelle",
    waiting: "En attente de l'autre équipe...",
    readyToPlay: "Prêts à jouer !",
    startGame: "DÉMARRER",
    rulesTitle: "RÈGLES DU JEU",
    rulesText: "1. L'Équipe qui Lit annonce le thème.\n2. L'Équipe qui Devine écoute et crie UN SEUL mot ensemble.\n3. S'ils disent le même mot : MATCH (+1 pt).\n4. 3 mots par tour : Facile, Moyen, Difficile.\n5. Ensuite, les rôles s'inversent !",
    readerWait: "En attente de l'autre équipe...",
    yourTurn: "ÉQUIPE QUI DEVINE",
    readerTurn: "ÉQUIPE QUI LIT",
    listen: "Écoutez l'autre équipe et criez le même mot tous ensemble !",
    readThis: "LISEZ CECI À VOIX HAUTE :",
    matchBtn: "ILS L'ONT EU !",
    failBtn: "ILS ONT RATÉ",
    wordMatched: "MATCH ! +1 PT",
    wordFailed: "RATÉ",
    nextWord: "SUIVANT",
    finishTurn: "FINIR LE TOUR",
    level0: "FACILE",
    level1: "MOYEN",
    level2: "DIFFICILE",
    turnOver: "TOUR TERMINÉ",
    rolesSwitched: "Les rôles ont été inversés.",
    activeTeamLabel: "QUI DEVINE",
    nextTurnLabel: "PROCHAINS À DEVINER",
    startTurnBtn: "TIRER UN THÈME",
    score: "Score",
    you: "Vous",
    them: "Eux"
  }
}

export default function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [teams, setTeams] = useState<{ id: string; username: string }[]>([]);
  const [room, setRoom] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  const [lang, setLang] = useState<'en' | 'es' | 'fr'>('en');
  const t = translations[lang];

  const [gameState, setGameState] = useState<GameState>('lobby');
  const [theme, setTheme] = useState(prompts.en.easy[0]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeTeamId, setActiveTeamId] = useState<string>('');

  const [clientId] = useState(() => Math.random().toString(36).substring(2, 10));

  const [turnWordIndex, setTurnWordIndex] = useState(0);
  const [lastResult, setLastResult] = useState<'match' | 'fail' | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!room) return;

    const channel = supabase.channel(`room:${room}`, {
      config: {
        presence: { key: clientId },
        broadcast: { self: false }
      }
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
  }, [room, currentUsername, clientId]);

  const processAction = (action: string, data: any) => {
    if (action === 'start_game') {
      setActiveTeamId(data.activeTeamId);
      setView('game');
      setGameState('ready');
    } else if (action === 'start_turn') {
      setTurnWordIndex(0);
      setTheme(data.theme);
      setGameState('playing');
    } else if (action === 'match' || action === 'fail') {
      setLastResult(action);
      setGameState('word_result');
      if (action === 'match') {
        setScores(prev => ({ ...prev, [data.activeTeamId]: (prev[data.activeTeamId] || 0) + 1 }));
      }
    } else if (action === 'next_word') {
      if (data.newActiveTeamId) {
        setGameState('turn_over');
        setActiveTeamId(data.newActiveTeamId);
      } else {
        setTurnWordIndex(data.turnWordIndex);
        setTheme(data.theme);
        setGameState('playing');
      }
    } else if (action === 'lang') {
      setLang(data.lang);
    }
  };

  const getRandomThemeByLevel = (currentLang: 'en' | 'es' | 'fr', levelIndex: number) => {
    const list = prompts[currentLang];
    const levelKey = levelIndex === 0 ? 'easy' : levelIndex === 1 ? 'medium' : 'hard';
    const levelList = list[levelKey];
    return levelList[Math.floor(Math.random() * levelList.length)];
  };

  const handleAction = (action: 'start_turn' | 'match' | 'fail' | 'next_word') => {
    const data: any = {};

    if (action === 'start_turn') {
      data.theme = getRandomThemeByLevel(lang, 0);
    } else if (action === 'match' || action === 'fail') {
      data.activeTeamId = activeTeamId;
    } else if (action === 'next_word') {
      if (turnWordIndex < 2) {
        data.theme = getRandomThemeByLevel(lang, turnWordIndex + 1);
        data.turnWordIndex = turnWordIndex + 1;
      } else {
        data.newActiveTeamId = teams.find(p => p.id !== activeTeamId)?.id || activeTeamId;
      }
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
    const firstActive = teams[0]?.id || clientId; // Fallback
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

  const handleSetLang = (newLang: 'en' | 'es' | 'fr') => {
    setLang(newLang);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'game_action',
      payload: { action: 'lang', data: { lang: newLang } }
    });
  };

  const myTeamId = clientId;
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
          gameState={gameState as 'ready' | 'playing' | 'word_result' | 'turn_over'}
          role={role as 'guesser' | 'reader'}
          scores={scores}
          turnWordIndex={turnWordIndex}
          lastResult={lastResult}
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
