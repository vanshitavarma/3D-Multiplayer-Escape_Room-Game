import { create } from 'zustand';

const useStore = create((set) => ({
    user: null,
    socket: null,
    room: null,
    inventory: [], // Array of item IDs collected so far
    puzzleStage: 0,
    serverMessage: null,
    timeLeft: 3600,
    score: 0,
    isEscaped: false,
    booksAligned: { book1: false, book2: false, book3: false },
    lampOff: false,
    modalPrompt: null,

    // Setters
    setUser: (user) => set({ user }),
    setSocket: (socket) => set({ socket }),
    setRoom: (room) => set({ room }),
    setGameState: (stateUpdate) => set((state) => ({ ...state, ...stateUpdate })),
    addToInventory: (itemId) => set((state) => ({ inventory: [...state.inventory, itemId] })),
    removeFromInventory: (itemId) => set((state) => ({ inventory: state.inventory.filter(id => id !== itemId) })),
}));

export default useStore;
