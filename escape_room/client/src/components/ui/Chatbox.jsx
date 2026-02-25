import { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';

export default function Chatbox() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const socket = useStore(state => state.socket);
    const room = useStore(state => state.room);
    const user = useStore(state => state.user);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_chat', (data) => {
            setMessages(prev => [...prev, data]);
            // Flash chat open slightly or show badge if closed
        });

        return () => {
            socket.off('receive_chat');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !socket) return;

        const username = user?.username || `Guest_${Math.floor(Math.random() * 1000)}`;

        socket.emit('send_chat', {
            roomId: room,
            message: inputValue,
            username: username
        });

        setInputValue("");
    };

    return (
        <div className="absolute bottom-24 right-6 z-20 pointer-events-auto w-80" style={{ fontFamily: "'Playfair Display', ui-serif, Georgia, serif" }}>
            {isOpen ? (
                <div className="bg-[#1c1611]/95 h-72 flex flex-col overflow-hidden animate-slideUp border border-[#3a2a18] shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.1)_inset] relative backdrop-blur-sm">
                    {/* Decorative Corner Filigree */}
                    <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/30"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d4af37]/30"></div>

                    {/* Header */}
                    <div className="bg-[#0c0a08]/60 px-4 py-3 flex justify-between items-center border-b border-[#3a2a18]">
                        <span className="font-medium text-xs tracking-[0.2em] text-[#d4af37] uppercase">Council Registry</span>
                        <button onClick={() => setIsOpen(false)} className="text-[#8a7a60] hover:text-[#d4af37] transition-colors">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm scrollbar-thin scrollbar-thumb-[#3a2a18]">
                        {messages.length === 0 ? (
                            <div className="text-[#5a4a38] italic text-xs text-center mt-4">The ledger is empty. Await communications.</div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className="break-words leading-relaxed">
                                    <span className={`tracking-wider ${msg.username === user?.username ? "text-[#d4af37]" : "text-[#a08a70]"}`}>
                                        {msg.username}:
                                    </span>
                                    <span className="text-[#e8dcb8] ml-2 font-light italic">{msg.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-[#0c0a08]/80 border-t border-[#3a2a18] flex items-center relative group">
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[#e8dcb8] px-2 placeholder:text-[#5a4a38] placeholder:font-light focus:ring-0"
                            placeholder="Inscribe message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); e.stopPropagation(); }}
                        />
                        <button type="submit" className="text-[#8a7a60] hover:text-[#d4af37] px-2 transition-colors">✍</button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="float-right bg-[#1c1611]/90 border border-[#3a2a18] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.1)_inset] px-6 py-3 flex items-center gap-3 hover:border-[#d4af37]/50 transition-all animate-pulse relative"
                >
                    <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d4af37]/30"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d4af37]/30"></div>
                    <span className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
                    <span className="font-medium text-xs tracking-[0.2em] text-[#d4af37] uppercase">Registry</span>
                </button>
            )}
        </div>
    );
}
