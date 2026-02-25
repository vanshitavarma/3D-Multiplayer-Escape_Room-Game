import React, { useEffect, useState, Suspense, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center p-10 text-white overflow-auto">
                    <h1 className="text-4xl font-bold tracking-widest mb-4">RENDER CRASH</h1>
                    <p className="font-mono bg-black/50 p-6 rounded-lg whitespace-pre-wrap max-w-4xl text-sm">
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <button onClick={() => window.location.reload()} className="mt-8 bg-white text-black px-6 py-2 font-bold hover:bg-gray-200">RELOAD GAME</button>
                </div>
            );
        }
        return this.props.children;
    }
}

import { Canvas } from '@react-three/fiber';
import { PointerLockControls, Environment } from '@react-three/drei';
import useStore from '../store/useStore';
import HUD from '../components/ui/HUD';
import Scene from '../components/game/Scene';
import Player from '../components/game/Player';

export default function GameRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user, socket, room } = useStore();
    const [players, setPlayers] = useState({});

    useEffect(() => {
        if (!user || !socket || room !== roomId) {
            navigate('/lobby');
            return;
        }

        // Receive full state upon joining
        socket.on('room_state_sync', (state) => {
            useStore.getState().setGameState({
                puzzleStage: state.puzzleStage,
                inventory: state.inventory,
                timeLeft: state.timeLeft,
                booksAligned: state.booksAligned,
                lampOff: state.lampOff
            });

            // Sync all existing players
            if (state.players) {
                setPlayers(state.players);
            }

            // Show initial hint for Round 1 start if new room
            // Show initial hint for Round 1 start if new room
            // Show immediately on spawn
            if (state.puzzleStage === 0) {
                useStore.getState().setGameState({ serverMessage: "You are locked in! HINT: Find the desk key hidden under the chair." });
            }
        });

        // Other players joining/moving
        socket.on('player_joined', (data) => {
            console.log('Player Joined:', data);
            setPlayers(prev => ({
                ...prev,
                [data.id]: {
                    username: data.username,
                    position: [0, 1.9, 0],
                    rotation: [0, 0, 0]
                }
            }));
        });

        socket.on('player_left', (data) => {
            setPlayers(prev => {
                const newPlayers = { ...prev };
                delete newPlayers[data.id];
                return newPlayers;
            });
        });

        socket.on('player_moved', ({ id, position, rotation }) => {
            setPlayers((prev) => ({
                ...prev,
                [id]: {
                    ...(prev[id] || {}), // preserve username
                    position,
                    rotation
                }
            }));
        });

        // Global Game State Events
        socket.on('inventory_updated', (data) => {
            console.log(`User ${data.collectedBy} found item: ${data.itemId}`);
            useStore.getState().setGameState({ inventory: data.inventory });
        });

        socket.on('server_message', (data) => {
            useStore.getState().setGameState({ serverMessage: data.message });
        });

        socket.on('puzzle_solved', (data) => {
            console.log(`Puzzle Stage Advanced to: ${data.stage}`);
            useStore.getState().setGameState({
                puzzleStage: data.stage,
                serverMessage: data.message,
                lampOff: data.lampOff,
                inventory: data.inventory || useStore.getState().inventory
            });
        });

        socket.on('puzzle_failed', (data) => {
            console.log(`Puzzle failed: ${data.message}`);
            useStore.getState().setGameState({ serverMessage: data.message });
        });

        socket.on('escape_success', (data) => {
            console.log('ESCAPED!', data);
            useStore.getState().setGameState({ isEscaped: true, score: data.score, timeLeft: data.time });
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        });

        return () => {
            socket.off('room_state_sync');
            socket.off('player_joined');
            socket.off('player_left');
            socket.off('player_moved');
            socket.off('inventory_updated');
            socket.off('puzzle_solved');
            socket.off('puzzle_failed');
            socket.off('escape_success');
        };
    }, [user, socket, room, roomId, navigate]);

    return (
        <div className="w-screen h-screen relative bg-black">
            {/* 3D Canvas */}
            <div className="absolute inset-0 flex items-center justify-center">
                <ErrorBoundary>
                    <Canvas shadows camera={{ position: [0, 1.9, 0], fov: 75 }} className="w-full h-full outline-none block" onClick={(e) => {
                        // Re-acquire pointer lock if clicking on the background canvas
                        const isLocked = document.pointerLockElement;
                        if (!isLocked && !useStore.getState().isEscaped) {
                            e.target.requestPointerLock();
                        }
                    }}>
                        <color attach="background" args={['#1a1025']} />
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />

                        <Suspense fallback={null}>
                            {/* Standard first-person lock */}
                            <PointerLockControls />
                            <Player />
                            <Scene players={players} />
                        </Suspense>
                    </Canvas>
                </ErrorBoundary>
            </div>

            {/* 2D Overlay HUD */}
            <HUD roomId={roomId} />
        </div>
    );
}
