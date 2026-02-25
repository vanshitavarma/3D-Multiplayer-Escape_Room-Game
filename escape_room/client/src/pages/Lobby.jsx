import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { io } from 'socket.io-client';

export default function Lobby() {
    const [roomCode, setRoomCode] = useState('');
    const [isHoveringCreate, setIsHoveringCreate] = useState(false);
    const [isHoveringJoin, setIsHoveringJoin] = useState(false);

    const user = useStore((state) => state.user);
    const { setSocket, setRoom } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    const connectToRoom = (code) => {
        const serverUrl = `http://${window.location.hostname}:5000`;
        const newSocket = io(serverUrl);

        newSocket.on('connect', () => {
            newSocket.emit('join_room', { roomId: code, username: user?.username }, (response) => {
                if (response.status === 'ok') {
                    setSocket(newSocket);
                    setRoom(code);
                    navigate(`/game/${code}`);
                }
            });
        });

        newSocket.on('connect_error', (error) => {
            console.error("Socket Connection Error:", error);
            alert("Failed to connect to game server. Please ensure the backend server is running on port 5000.");
            newSocket.close();
        });
    };

    const handleCreateRoom = () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        connectToRoom(newCode);
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomCode.trim()) {
            connectToRoom(roomCode.trim().toUpperCase());
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden text-[#fdfbf7]" style={{ fontFamily: "'Playfair Display', ui-serif, Georgia, serif" }}>

            {/* Dark, moody background simulating a dimly lit vintage room */}
            <div className="absolute inset-0 z-0 bg-[#0c0a08] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,35,20,0.8)_0%,rgba(10,5,0,1)_100%)]"></div>
                {/* Subtle vertical stripes simulating wallpaper or wood panels */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_100%]"></div>
            </div>

            {/* Floating dust particles */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30 w-full h-full">
                {[...Array(25)].map((_, i) => (
                    <div key={i} className="absolute bg-[#d4af37] rounded-full animate-pulse"
                        style={{
                            width: Math.random() * 3 + 'px',
                            height: Math.random() * 3 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDuration: (Math.random() * 4 + 2) + 's',
                            boxShadow: '0 0 5px #d4af37',
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            <div className="z-10 text-center mb-10 w-full">
                <h2 className="text-xl sm:text-2xl font-light tracking-[0.3em] uppercase text-[#a08a70] italic">
                    Welcome to the Manor,
                </h2>
                <h1 className="text-3xl sm:text-4xl tracking-[0.2em] font-medium mt-2 text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {user?.username}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10">

                {/* Create Room Ledger Panel */}
                <div className="bg-[#1c1611] rounded-sm p-8 flex flex-col items-center justify-center text-center relative shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] border border-[#3a2a18] group hover:shadow-[0_20px_60px_rgba(0,0,0,1),0_0_0_1px_rgba(212,175,55,0.2)_inset] transition-all duration-700">

                    {/* Decorative Corner Filigree */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#d4af37]/30"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#d4af37]/30"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#d4af37]/30"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#d4af37]/30"></div>

                    <div className="w-16 h-16 rounded-full bg-[#2a1f14] border border-[#d4af37]/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                        <svg className="w-8 h-8 text-[#d4af37]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>

                    <h3 className="text-[#d4af37] text-2xl tracking-[0.1em] font-medium mb-4 uppercase">Host Session</h3>
                    <p className="text-[#8a7a60] mb-8 text-sm italic tracking-widest px-4 leading-relaxed">
                        "Forge a new realm and gather your associates to face the trials within."
                    </p>

                    <button
                        onClick={handleCreateRoom}
                        onMouseEnter={() => setIsHoveringCreate(true)}
                        onMouseLeave={() => setIsHoveringCreate(false)}
                        className="relative w-full overflow-hidden bg-[#2a1f14] border border-[#5a4a38] hover:border-[#d4af37]/60 transition-all duration-500 py-4 px-8 mt-auto cursor-pointer"
                    >
                        <div className={`absolute inset-0 bg-[#d4af37]/10 transition-opacity duration-500 ${isHoveringCreate ? 'opacity-100' : 'opacity-0'}`}></div>
                        <span className={`relative z-10 text-[#d4af37] text-sm sm:text-lg tracking-[0.2em] uppercase font-medium transition-all duration-500 ${isHoveringCreate ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : ''}`}>
                            Forge Session
                        </span>
                    </button>
                </div>

                {/* Join Room Envelop Panel */}
                <div className="bg-[#1c1611] rounded-sm p-8 flex flex-col items-center justify-center text-center relative shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] border border-[#3a2a18] group hover:shadow-[0_20px_60px_rgba(0,0,0,1),0_0_0_1px_rgba(212,175,55,0.2)_inset] transition-all duration-700">

                    {/* Decorative Corner Filigree */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#d4af37]/30"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#d4af37]/30"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#d4af37]/30"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#d4af37]/30"></div>

                    <div className="w-16 h-16 rounded-full bg-[#2a1f14] border border-[#d4af37]/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                        <svg className="w-8 h-8 text-[#d4af37]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-4.257l2.808-2.808A6 6 0 1115 7h0z" />
                        </svg>
                    </div>

                    <h3 className="text-[#d4af37] text-2xl tracking-[0.1em] font-medium mb-4 uppercase">Enter Chamber</h3>
                    <p className="text-[#8a7a60] mb-6 text-sm italic tracking-widest px-4 leading-relaxed">
                        "Present your entry cipher to reunite with your stranded companions."
                    </p>

                    <form onSubmit={handleJoinRoom} className="w-full mt-auto flex flex-col items-center">
                        <div className="w-full relative group/input mb-6">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value)}
                                className="w-full bg-[#110d0a] border-b-2 border-[#4a3a28] text-[#e8dcb8] px-4 py-3 text-center text-xl tracking-[0.2em] uppercase focus:outline-none focus:border-[#d4af37] transition-all placeholder:text-[#5a4a38] placeholder:font-light"
                                placeholder="ROOM CIPHER"
                                maxLength={8}
                            />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#d4af37] transition-all duration-500 group-focus-within/input:w-full"></div>
                        </div>

                        <button
                            type="submit"
                            onMouseEnter={() => setIsHoveringJoin(true)}
                            onMouseLeave={() => setIsHoveringJoin(false)}
                            className="relative w-full overflow-hidden bg-transparent border border-[#5a4a38] hover:border-[#d4af37]/60 transition-all duration-500 py-4 px-8 mt-2 cursor-pointer"
                        >
                            <div className={`absolute inset-0 bg-[#d4af37]/5 transition-opacity duration-500 ${isHoveringJoin ? 'opacity-100' : 'opacity-0'}`}></div>
                            <span className={`relative z-10 text-[#d4af37]/80 group-hover:text-[#d4af37] text-sm sm:text-lg tracking-[0.2em] uppercase font-medium transition-all duration-500 ${isHoveringJoin ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''}`}>
                                Decrypt & Enter
                            </span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-6 text-[#4a3a28] text-xs tracking-[0.3em] uppercase">
                Awaiting clearance...
            </div>

        </div>
    );
}
