const gameStateManager = require('./gameState');

module.exports = (io, socket) => {
    socket.on('join_room', (data, callback) => {
        // Support backward compatibility if frontend is still sending just a string, 
        // OR the new object format `{ roomId, username }`
        const roomId = typeof data === 'string' ? data : data.roomId;
        const username = typeof data === 'string' ? undefined : data.username;

        socket.join(roomId);
        const roomState = gameStateManager.getRoom(roomId);
        roomState.addPlayer(socket.id, username);
        socket.to(roomId).emit('player_joined', { id: socket.id, username });
        if (callback) callback({ status: "ok", roomId, state: roomState.getPublicState() });
    });

    socket.on('player_move', (data) => {
        const { roomId, position, rotation } = data;
        const roomState = gameStateManager.getRoom(roomId);
        if (roomState.players[socket.id]) {
            roomState.players[socket.id].position = position;
            roomState.players[socket.id].rotation = rotation;
        }
        socket.to(roomId).emit('player_moved', { id: socket.id, position, rotation });
    });

    socket.on('collect_item', (data) => {
        const { roomId, itemId, customMessage } = data;
        const roomState = gameStateManager.getRoom(roomId);
        if (roomState.collectItem(itemId)) {
            io.to(roomId).emit('inventory_updated', { inventory: roomState.inventory, collectedBy: socket.id, itemId });
            if (customMessage) {
                io.to(roomId).emit('server_message', { message: customMessage });
            }
        }
    });

    socket.on('attempt_puzzle', (data) => {
        const { roomId, puzzleType, payload } = data;
        const roomState = gameStateManager.getRoom(roomId);
        let success = false;
        let eventPayload = null;
        let customMessage = "";

        if (puzzleType === 'chair_key' && roomState.puzzleStage === 0) {
            roomState.collectItem('desk_key');
            success = roomState.advancePuzzleStage();
            customMessage = "Silver key acquired. A tag reads: 'Knowledge must be aligned before it can be unlocked. Face the shelf.'";
        }
        else if (puzzleType === 'align_book' && roomState.puzzleStage === 1) {
            if (['book1', 'book2', 'book3'].includes(payload)) {
                roomState.booksAligned[payload] = true;
                if (roomState.booksAligned.book1 && roomState.booksAligned.book2 && roomState.booksAligned.book3) {
                    roomState.collectItem('usb_drive');
                    success = roomState.advancePuzzleStage();
                    customMessage = "A hidden mechanism clicks. You found a USB drive. A dormant screen nearby awaits its data.";
                } else {
                    io.to(roomId).emit('puzzle_solved', {
                        stage: roomState.puzzleStage,
                        message: `Aligned ${payload}.`,
                        lampOff: roomState.lampOff,
                        inventory: roomState.inventory
                    });
                }
            }
        }
        else if (puzzleType === 'insert_usb' && roomState.puzzleStage === 2) {
            if (roomState.inventory.includes('usb_drive')) {
                success = roomState.advancePuzzleStage();
                customMessage = "System booting... 'The truth is often written in the dark. Kill the lights to see what the shadows hide.'";
            }
        }
        else if (puzzleType === 'toggle_lamp' && roomState.puzzleStage === 3) {
            roomState.lampOff = true;
            success = roomState.advancePuzzleStage();
            customMessage = "UV light illuminates the room... 'The thickest, strangest tome holds the next secret.'";
        }
        else if (puzzleType === 'push_book' && roomState.puzzleStage === 4) {
            success = roomState.advancePuzzleStage();
            customMessage = "A golden vault emerges! Look to the heavens to unlock it.";
        }
        else if (puzzleType === 'symbol_lock' && roomState.puzzleStage === 5) {
            const validCombinations = [
                'star_moon_sun', 'star_sun_moon',
                'moon_star_sun', 'moon_sun_star',
                'sun_star_moon', 'sun_moon_star'
            ];
            if (validCombinations.includes(payload)) {
                roomState.collectItem('ac_remote');
                success = roomState.advancePuzzleStage();
                customMessage = "You found a remote control. The air feels heavy... maybe it's time to cool things down?";
            } else {
                socket.emit('puzzle_failed', { message: "Incorrect symbols." });
            }
        }
        else if (puzzleType === 'turn_on_ac' && roomState.puzzleStage === 6) {
            if (roomState.inventory.includes('ac_remote')) {
                success = roomState.advancePuzzleStage();
                customMessage = "The blast of cold air stirs the room, shifting fabrics to reveal what was painted behind.";
            }
        }
        else if (puzzleType === 'escape_door' && roomState.puzzleStage === 7) {
            if (payload === '2026') {
                success = roomState.advancePuzzleStage();
                customMessage = "DOOR UNLOCKED!";
            } else {
                socket.emit('puzzle_failed', { message: "Invalid keypad code." });
            }
        }

        if (success) {
            io.to(roomId).emit('puzzle_solved', {
                stage: roomState.puzzleStage,
                message: customMessage,
                lampOff: roomState.lampOff,
                inventory: roomState.inventory
            });
            if (roomState.puzzleStage >= 8) {
                io.to(roomId).emit('escape_success', { score: roomState.score, time: roomState.timeLeft });
            }
        }
    });

    socket.on('answer_quiz', (data) => {
        const { roomId, objectId, answer } = data;
        const roomState = gameStateManager.getRoom(roomId);

        let customMessage = "";

        console.log(`[QUIZ ANSWERED] Room: ${roomId} | Object: ${objectId} | Answer: ${answer}`);
        console.log(`[STATE BEFORE] Puzzle Stage: ${roomState.puzzleStage}`);

        // Client validated the text, we just advance the stage and provide the next hint/item
        roomState.advancePuzzleStage();

        console.log(`[STATE AFTER]  Puzzle Stage: ${roomState.puzzleStage} | Next Step Ready`);

        if (roomState.puzzleStage === 1) {
            customMessage = "Hint: Click the Chair to continue.";
        } else if (roomState.puzzleStage === 2) {
            roomState.collectItem('desk_key');
            customMessage = "Key collected. Hint: Click the Drawer to continue.";
        } else if (roomState.puzzleStage === 3) {
            roomState.collectItem('usb_drive');
            customMessage = "USB drive collected. Hint: Click the PC Monitor again.";
        } else if (roomState.puzzleStage === 4) {
            customMessage = "Hint: Click the Desk Lamp.";
        } else if (roomState.puzzleStage === 5) {
            roomState.lampOff = true;
            customMessage = "Lamp off. Hint: Click the slightly pushed-in Book on the shelf.";
        } else if (roomState.puzzleStage === 6) {
            roomState.collectItem('ac_remote');
            customMessage = "AC Remote collected. Hint: Click the AC Unit.";
        } else if (roomState.puzzleStage === 7) {
            customMessage = "AC On. Hint: Click the Escape Door Keypad.";
        } else if (roomState.puzzleStage >= 8) {
            // Escaped!
            io.to(roomId).emit('escape_success', { score: roomState.score, time: roomState.timeLeft });
            return;
        }

        io.to(roomId).emit('puzzle_solved', {
            stage: roomState.puzzleStage,
            message: customMessage,
            lampOff: roomState.lampOff
        });
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                const roomState = gameStateManager.getRoom(roomId);
                roomState.removePlayer(socket.id);
                socket.to(roomId).emit('player_left', { id: socket.id });
            }
        }
    });
};
