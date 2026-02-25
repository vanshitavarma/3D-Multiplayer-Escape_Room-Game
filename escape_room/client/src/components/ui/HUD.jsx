import { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
export default function HUD({ roomId }) {
    const [timeLeft, setTimeLeft] = useState(601); // 10 minutes
    const inventory = useStore(state => state.inventory);
    const serverMessage = useStore(state => state.serverMessage);
    const [showIntro, setShowIntro] = useState(useStore.getState().puzzleStage === 0);
    const modalPrompt = useStore(state => state.modalPrompt);
    const [modalInput, setModalInput] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6" style={{ fontFamily: "'Playfair Display', ui-serif, Georgia, serif" }}>
            {/* Top Bar */}
            <div className="flex justify-between items-start z-10 w-full pointer-events-auto">
                {/* Timer Plate */}
                <div className="bg-[#1c1611] border border-[#3a2a18] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.1)_inset] px-6 py-3 flex items-center gap-4 relative">
                    <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/30"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d4af37]/30"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#d4af37]/30"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d4af37]/30"></div>

                    <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_8px_#d4af37]" />
                    <span className="font-light text-3xl tracking-[0.1em] text-[#d4af37] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{formatTime(timeLeft)}</span>
                </div>

                <div className="flex gap-4">
                    {/* Room Plate */}
                    <div className="bg-[#1c1611] border border-[#3a2a18] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.1)_inset] px-6 py-3 text-[#a08a70] text-sm tracking-[0.2em] flex items-center uppercase relative">
                        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/30"></div>
                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d4af37]/30"></div>
                        Chamber: <span className="text-[#d4af37] ml-2 font-medium">{roomId}</span>
                    </div>
                    {/* Abort Button */}
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to abandon the mission and quit the game?")) {
                                window.location.href = '/lobby';
                            }
                        }}
                        className="bg-[#2a1f14] border border-[#5a4a38] shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-6 py-3 text-xs tracking-[0.2em] font-medium text-[#c0392b] hover:border-[#c0392b]/60 hover:text-[#e74c3c] transition-all uppercase relative group"
                    >
                        <div className="absolute inset-0 bg-[#c0392b]/5 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                        <span className="relative z-10">Flee Chamber</span>
                    </button>
                </div>

                {/* Persistent Hint/Message Box */}
                {serverMessage && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 w-fit max-w-2xl pointer-events-auto mt-4 px-8 py-4 bg-[#110d0a]/90 backdrop-blur-sm border border-[#d4af37]/50 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.2)_inset] animate-slideDown">
                        <p className="text-[#d4af37] text-center tracking-[0.1em] text-lg font-light italic">"{serverMessage}"</p>
                    </div>
                )}
            </div>

            {/* Center Crosshair - elegant gold dot */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full opacity-60 shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            </div>

            {/* Bottom Bar: Inventory and Puzzle Progress */}
            <div className="flex justify-between items-end z-10 w-full pointer-events-auto">

                {/* Inventory Ledger */}
                <div className="flex flex-col gap-3">
                    <span className="text-[#8a7a60] text-xs tracking-[0.3em] uppercase mix-blend-screen px-1">Possessions</span>
                    <div className="flex gap-3">
                        {Array(3).fill(null).map((_, i) => (
                            <div
                                key={`inv-${i}`}
                                className={`w-20 h-20 flex flex-col items-center justify-center font-bold text-xs text-center transition-all bg-[#1c1611]/80 backdrop-blur-sm border relative shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                                  ${inventory[i] ? 'border-[#d4af37]/60 text-[#d4af37]' : 'border-[#3a2a18] text-transparent'}`}
                            >
                                <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/20"></div>
                                <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d4af37]/20"></div>
                                {inventory[i] ? <span className="tracking-[0.15em] leading-tight px-1 font-light uppercase">{inventory[i].replace('_', '\n')}</span> : ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Puzzle Progress Tracker (3 Rounds) */}
                <div className="flex flex-col items-center gap-3">
                    <span className="text-[#8a7a60] text-xs tracking-[0.3em] uppercase mix-blend-screen px-1">Chronicles</span>
                    <div className="flex gap-5">
                        {Array(3).fill(null).map((_, i) => {
                            const currentStage = useStore.getState().puzzleStage;
                            let currentVisualRound = 0;
                            if (currentStage >= 2 && currentStage < 6) currentVisualRound = 1;
                            if (currentStage >= 6 && currentStage < 8) currentVisualRound = 2;
                            if (currentStage >= 8) currentVisualRound = 3; // Game Won

                            const isCompleted = currentVisualRound > i;
                            const isActive = currentVisualRound === i;
                            return (
                                <div
                                    key={`prog-${i}`}
                                    className={`w-14 h-14 rotate-45 flex flex-col items-center justify-center transition-all duration-700 relative
                                        ${isCompleted ? 'bg-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.6)] border-none text-[#110d0a]'
                                            : isActive ? 'bg-[#2a1f14] border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)] text-[#d4af37]'
                                                : 'bg-[#110d0a]/60 border border-[#3a2a18] text-[#5a4a38]'}`}
                                >
                                    <div className="-rotate-45 font-medium tracking-widest text-sm">
                                        {isCompleted ? '✓' : `I${'I'.repeat(i)}`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Escape overlay */}
            {useStore.getState().isEscaped && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0a08]/95 backdrop-blur-md pointer-events-auto">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01OSAwSDBWMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPgpcPGEydj4=')] pointer-events-none opacity-20" />

                    <div className="w-24 h-24 rounded-full bg-[#1c1611] border-2 border-[#d4af37] flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                        <svg className="w-12 h-12 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-light text-[#d4af37] mb-6 tracking-[0.2em] uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">Freedom</h1>
                    <div className="text-[#a08a70] text-xl tracking-[0.2em] mb-8 font-light italic">
                        Surviving Time: <span className="text-[#d4af37] font-medium not-italic">{formatTime(useStore.getState().timeLeft)}</span>
                    </div>
                    <div className="text-2xl text-[#d4af37] mb-16 tracking-[0.3em] uppercase">
                        Final Verdict: {useStore.getState().score}
                    </div>

                    <button
                        onClick={() => window.location.href = '/lobby'}
                        className="bg-[#1c1611] border border-[#d4af37]/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-10 py-4 text-sm tracking-[0.2em] uppercase font-medium text-[#d4af37] hover:bg-[#2a1f14] hover:shadow-[0_10px_40px_rgba(0,0,0,1),0_0_15px_rgba(212,175,55,0.3)] transition-all"
                    >
                        Depart Manor
                    </button>
                </div>
            )}

            {/* Intro overlay */}
            {showIntro && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0c0a08]/95 backdrop-blur-md pointer-events-auto p-4">
                    <div className="max-w-2xl w-full text-center flex flex-col items-center p-10 bg-[#1c1611] border border-[#3a2a18] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] relative">
                        {/* Decorative corner pieces */}
                        <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#d4af37]/30"></div>
                        <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#d4af37]/30"></div>
                        <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-[#d4af37]/30"></div>
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#d4af37]/30"></div>

                        <h1 className="text-4xl text-[#d4af37] mb-8 tracking-[0.2em] uppercase font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">The Enigma Begins</h1>
                        <p className="text-lg text-[#a08a70] mb-10 leading-relaxed italic font-light px-4">
                            You awaken confined within these walls. Collaborate with any present associates, uncover hidden mechanisms, and secure your exit before time exhausts itself.
                        </p>

                        <div className="w-full bg-[#110d0a]/80 border-l-2 border-[#d4af37] p-6 mb-12 text-left shadow-[0_4px_15px_rgba(0,0,0,0.5)_inset]">
                            <h2 className="text-xs text-[#8a7a60] uppercase tracking-[0.3em] mb-3">Initial Directive:</h2>
                            <p className="text-[#e8dcb8] text-lg font-light italic">"Investigate the physical space. Observe the study table closely."</p>
                        </div>

                        <button
                            onClick={() => {
                                setShowIntro(false);
                                document.body.requestPointerLock();
                            }}
                            className="bg-[#2a1f14] border border-[#d4af37]/50 text-[#d4af37] px-12 py-4 text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#110d0a] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                        >
                            Accept Fate
                        </button>
                    </div>
                </div>
            )}
            {/* Modal Prompt Overlay */}
            {modalPrompt && (
                <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#0c0a08]/95 backdrop-blur-md pointer-events-auto p-4">
                    <div className="max-w-md w-full text-center flex flex-col items-center p-8 bg-[#1c1611] border border-[#3a2a18] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] relative">
                        {/* Decorative corner pieces */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#d4af37]/30"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#d4af37]/30"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#d4af37]/30"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#d4af37]/30"></div>

                        <div className="w-12 h-12 bg-[#2a1f14] rounded-full border border-[#d4af37]/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                            <svg className="w-6 h-6 text-[#d4af37]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h2 className="text-2xl text-[#d4af37] mb-4 tracking-[0.2em] uppercase font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {modalPrompt.title}
                        </h2>

                        <p className="text-[#a08a70] mb-8 leading-relaxed italic font-light px-2 whitespace-pre-wrap">
                            "{modalPrompt.message}"
                        </p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                modalPrompt.onSubmit(modalInput);
                                setModalInput("");
                                useStore.getState().setGameState({ modalPrompt: null });
                            }}
                            className="w-full flex flex-col items-center"
                        >
                            <input
                                type="text"
                                autoFocus
                                value={modalInput}
                                onChange={(e) => setModalInput(e.target.value)}
                                placeholder={modalPrompt.placeholder || ""}
                                className="w-full bg-[#110d0a] border-b-2 border-[#4a3a28] text-[#e8dcb8] px-4 py-3 text-center text-lg tracking-[0.15em] focus:outline-none focus:border-[#d4af37] transition-all placeholder:text-[#5a4a38] placeholder:font-light mb-8"
                            />

                            <div className="flex gap-4 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalInput("");
                                        useStore.getState().setGameState({ modalPrompt: null });
                                        document.body.requestPointerLock();
                                    }}
                                    className="flex-1 bg-transparent border border-[#5a4a38] text-[#8a7a60] py-3 text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#2a1f14] hover:text-[#d4af37] hover:border-[#d4af37]/50"
                                >
                                    Abandon
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#2a1f14] border border-[#d4af37]/50 text-[#d4af37] py-3 text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#110d0a] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
