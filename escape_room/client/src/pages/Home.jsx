import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Home() {
    const [username, setUsername] = useState('');
    const [isHovering, setIsHovering] = useState(false);
    const navigate = useNavigate();
    const setUser = useStore((state) => state.setUser);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!username.trim()) return;

        const mockUser = { id: 'user_' + Math.floor(Math.random() * 1000), username };
        setUser(mockUser);
        navigate('/lobby');
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center py-10 px-4 overflow-hidden text-[#fdfbf7]" style={{ fontFamily: "'Playfair Display', ui-serif, Georgia, serif" }}>

            {/* Dark, moody background simulating a dimly lit vintage room */}
            <div className="absolute inset-0 z-0 bg-[#0c0a08] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,35,20,0.8)_0%,rgba(10,5,0,1)_100%)]"></div>
                {/* Subtle vertical stripes simulating wallpaper or wood panels */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_100%]"></div>
            </div>

            {/* Floating dust particles */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                {[...Array(20)].map((_, i) => (
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

            {/* The "Invitation" / "Journal" Card */}
            <div className="z-10 bg-[#1c1611] rounded-sm p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] border border-[#3a2a18] w-full max-w-lg flex flex-col items-center relative transition-all duration-700 hover:shadow-[0_20px_60px_rgba(0,0,0,1),0_0_0_1px_rgba(212,175,55,0.2)_inset] group">

                {/* Decorative corner pieces */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-[#d4af37]/40"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t border-r border-[#d4af37]/40"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-[#d4af37]/40"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-[#d4af37]/40"></div>

                <div className="w-16 h-16 bg-[#2a1f14] rounded-full border border-[#d4af37]/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
                    <svg className="w-8 h-8 text-[#d4af37]/70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                    </svg>
                </div>

                <h1 className="text-[#d4af37] text-4xl sm:text-5xl text-center tracking-[0.2em] uppercase font-light mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    ESCAPE
                </h1>
                <div className="flex items-center gap-4 w-full mb-8 opacity-60">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">The Room</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
                </div>

                <p className="text-[#a08a70] text-center mb-10 text-sm tracking-widest italic leading-relaxed">
                    "Only the sharpest minds will find their way out. <br /> Sign the ledger to begin."
                </p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <div className="w-full relative group/input mb-10">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#110d0a] border-b-2 border-[#4a3a28] text-[#e8dcb8] px-4 py-4 text-center text-xl tracking-[0.15em] focus:outline-none focus:border-[#d4af37] transition-all placeholder:text-[#5a4a38] placeholder:font-light"
                            placeholder="YOUR ALIAS"
                            required
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#d4af37] transition-all duration-500 group-focus-within/input:w-full"></div>
                    </div>

                    <button
                        type="submit"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        className="relative w-full overflow-hidden bg-[#2a1f14] border border-[#5a4a38] hover:border-[#d4af37]/60 transition-all duration-500 py-4 px-8 mt-2 cursor-pointer"
                    >
                        <div className={`absolute inset-0 bg-[#d4af37]/10 transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-0'}`}></div>
                        <span className={`relative z-10 text-[#d4af37] text-lg tracking-[0.2em] uppercase font-medium transition-all duration-500 ${isHovering ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : ''}`}>
                            Unlock Door
                        </span>
                    </button>

                    {/* Small lock mechanism detail below button */}
                    <div className="mt-8 relative w-full h-4 flex justify-center items-center gap-2 opacity-70">
                        <div className={`w-2 h-2 rounded-full border border-[#d4af37] transition-all duration-700 ${username.length > 0 ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37]' : 'bg-transparent'}`}></div>
                        <div className={`w-2 h-2 rounded-full border border-[#d4af37] transition-all duration-700 delay-100 ${username.length > 2 ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37]' : 'bg-transparent'}`}></div>
                        <div className={`w-2 h-2 rounded-full border border-[#d4af37] transition-all duration-700 delay-200 ${username.length > 4 ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37]' : 'bg-transparent'}`}></div>
                    </div>
                </form>
            </div>

            <div className="absolute bottom-6 text-[#705a40] text-xs tracking-[0.2em] uppercase">
                A devhacks codered 2026 experience
            </div>
        </div>
    );
}
