// In-memory data store for active rooms
const activeRooms = {};

const INITIAL_TIME = 600; // 10 minutes in seconds

class GameRoomState {
    constructor(roomId) {
        this.roomId = roomId;
        this.startTime = Date.now();
        this.timeLeft = INITIAL_TIME;
        this.isActive = true;
        this.score = 0;
        this.hintsUsed = 0;

        // Progressive Puzzle System (Environmental Narrative)
        // Round 1
        // 0: Start -> Find notebook (optional) -> find chair_key
        // 1: Found chair_key -> click 3 books to align -> drawer unlocks -> get usb (Round 1 Complete)
        // Round 2
        // 2: Got USB -> insert to laptop
        // 3: Laptop active -> turn off lamp
        // 4: Lamp off (UV visible) -> click hidden book
        // 5: Hidden compartment open -> solve symbol lock -> get AC remote (Round 2 Complete)
        // Round 3
        // 6: Got AC remote -> turn on AC
        // 7: AC on -> look at thermometer/curtain -> enter 6 on keypad -> Escaped (Round 3 Complete)
        this.puzzleStage = 0;

        // Sub-state tracking
        this.booksAligned = { book1: false, book2: false, book3: false };
        this.lampOff = false;

        // Shared Inventory: Array of item IDs
        this.inventory = [];

        // Connected players { socketId: { username, position, rotation } }
        this.players = {};

        this.timerInterval = setInterval(() => this.tick(), 1000);
    }

    tick() {
        if (!this.isActive) return;
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.isActive = false;
            clearInterval(this.timerInterval);
        }
    }

    addPlayer(socketId, username) {
        this.players[socketId] = {
            username: username || 'Operator',
            position: [0, 1.6, 0],
            rotation: [0, 0, 0]
        };
    }

    removePlayer(socketId) {
        delete this.players[socketId];
        if (Object.keys(this.players).length === 0) {
            this.endGame();
        }
    }

    collectItem(itemId) {
        if (!this.inventory.includes(itemId)) {
            this.inventory.push(itemId);
            return true;
        }
        return false;
    }

    advancePuzzleStage() {
        this.puzzleStage++;
        if (this.puzzleStage >= 8) {
            this.puzzleStage = 8;
            this.endGame(true); // Escaped!
        }
        return true;
    }

    useHint() {
        this.hintsUsed++;
        this.timeLeft = Math.max(0, this.timeLeft - 300);
    }

    endGame(escaped = false) {
        this.isActive = false;
        clearInterval(this.timerInterval);

        if (escaped) {
            this.score = Math.floor(this.timeLeft * 10) - (this.hintsUsed * 500);
            if (this.score < 0) this.score = 0;
        } else {
            this.score = 0;
        }
    }

    getPublicState() {
        return {
            roomId: this.roomId,
            timeLeft: this.timeLeft,
            isActive: this.isActive,
            puzzleStage: this.puzzleStage,
            inventory: this.inventory,
            players: this.players,
            hintsUsed: this.hintsUsed,
            score: this.score,
            booksAligned: this.booksAligned,
            lampOff: this.lampOff
        };
    }
}

module.exports = {
    getRoom: (roomId) => {
        if (!activeRooms[roomId]) {
            activeRooms[roomId] = new GameRoomState(roomId);
        }
        return activeRooms[roomId];
    },
    removeRoom: (roomId) => {
        if (activeRooms[roomId]) {
            activeRooms[roomId].endGame();
            delete activeRooms[roomId];
        }
    },
    getAllRooms: () => activeRooms
};
