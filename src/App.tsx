import { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { supabase } from './lib/supabase';
import { prompts } from './data/prompts';

type GameState = 'idle' | 'ready' | 'countdown' | 'flash' | 'validating' | 'match' | 'fail';

export default function App() {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [players, setPlayers] = useState<{ id: string; username: string }[]>([]);
  const [room, setRoom] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');

  const [gameState, setGameState] = useState<GameState>('idle');
  const [countdownValue, setCountdownValue] = useState(3);
  const [theme, setTheme] = useState(prompts[0].text);
  const [score, setScore] = useState(0);
  const [tempScore, setTempScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const [remoteValidation, setRemoteValidation] = useState<'match' | 'fail' | null>(null);
  const [localValidation, setLocalValidation] = useState<'match' | 'fail' | null>(null);

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
        setPlayers(activePlayers);
      })
      .on('broadcast', { event: 'ready' }, () => {
        setRemoteReady(true);
      })
      .on('broadcast', { event: 'validate' }, (payload) => {
        setRemoteValidation(payload.payload.result);
      })
      .on('broadcast', { event: 'next' }, (payload) => {
        handleNextState(payload.payload.action, payload.payload.newTheme);
      })
      .on('broadcast', { event: 'start_game' }, () => {
        setView('game');
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
  }, [room, currentUsername, view]);

  useEffect(() => {
    // If both ready, start countdown
    if (isReady && remoteReady && gameState === 'ready') {
      startCountdown();
    }
  }, [isReady, remoteReady, gameState]);

  useEffect(() => {
    if (localValidation && remoteValidation && gameState === 'validating') {
      if (localValidation === 'match' && remoteValidation === 'match') {
        setGameState('match');
        setTempScore(prev => prev + 100);
      } else {
        setGameState('fail');
        setTempScore(0);
      }
      setLocalValidation(null);
      setRemoteValidation(null);
      setIsReady(false);
      setRemoteReady(false);
    }
  }, [localValidation, remoteValidation, gameState]);

  const startCountdown = () => {
    setGameState('countdown');
    setCountdownValue(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
      } else {
        clearInterval(interval);
        setGameState('flash');
        setTimeout(() => setGameState('validating'), 1000);
      }
    }, 1000);
  };

  const handleJoin = (username: string, rCode: string) => {
    setCurrentUsername(username);
    setRoom(rCode);
  };

  const handleReady = () => {
    if (gameState === 'idle') setGameState('ready');
    setIsReady(true);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'ready',
      payload: {},
    });

    // Fallback for single player testing if Supabase is unconfigured
    if (players.length <= 1) {
      setTimeout(() => setRemoteReady(true), 1000);
    }
  };

  const handleValidate = (result: 'match' | 'fail') => {
    setLocalValidation(result);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'validate',
      payload: { result },
    });

    // Fallback for single player testing
    if (players.length <= 1) {
      setTimeout(() => setRemoteValidation(result), 500);
    }
  };

  const handleNext = (action: 'secure' | 'continue') => {
    const nextTheme = prompts[Math.floor(Math.random() * prompts.length)].text;
    handleNextState(action, nextTheme);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'next',
      payload: { action, newTheme: nextTheme },
    });
  };

  const handleNextState = (action: 'secure' | 'continue', newTheme: string) => {
    if (action === 'secure') {
      setScore(prev => prev + tempScore);
      setTempScore(0);
    }
    setTheme(newTheme);
    setGameState('idle');
    setIsReady(false);
    setRemoteReady(false);
  };

  const handleStartGame = () => {
    setView('game');
    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_game',
      payload: {},
    });
  };

  return (
    <>
      <div className="mesh-bg" />
      <div className="noise-overlay" />
      {view === 'lobby' ? (
        <Lobby
          onJoinRoom={handleJoin}
          players={players}
          currentUsername={currentUsername}
          onStartGame={handleStartGame}
        />
      ) : (
        <Game
          theme={theme}
          gameState={gameState}
          countdownValue={countdownValue}
          score={score}
          tempScore={tempScore}
          isReady={isReady}
          onReady={handleReady}
          onValidate={handleValidate}
          onNext={handleNext}
        />
      )}
    </>
  );
}
