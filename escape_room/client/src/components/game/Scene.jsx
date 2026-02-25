import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Text, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';

function RemotePlayerModel({ position, rotation, username }) {
    const group = useRef();
    const { scene, animations } = useGLTF('/models/Walking.glb');
    const { actions } = useAnimations(animations, group);
    const targetPos = useRef(new THREE.Vector3(...position));

    useEffect(() => {
        targetPos.current.set(...position);
    }, [position]);

    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const action = actions[Object.keys(actions)[0]];
            action.play();
            action.paused = true;
        }
    }, [actions]);

    useFrame((state, delta) => {
        if (!group.current) return;

        // Smoothly interpolate position towards the target position
        group.current.position.lerp(targetPos.current, 10 * delta);

        if (actions && Object.keys(actions).length > 0) {
            const action = actions[Object.keys(actions)[0]];
            // Calculate remaining distance to target
            const dist = group.current.position.distanceTo(targetPos.current);

            // If we are still smoothly moving towards the target, play walking animation
            if (dist > 0.05) {
                action.paused = false;
            } else {
                // If we've reached the target, stop moving legs
                action.paused = true;
                action.time = 0; // return to idle/standing frame
            }
        }
    });

    return (
        // Apply Y-axis rotation (yaw) directly so looking up/down doesn't tilt the body upwards into the sky
        // Note: we do not pass `position={position}` as a prop, to ensure the useFrame lerping isn't abruptly overridden
        <group ref={group} rotation={[0, rotation[1] || 0, 0]}>
            {/* 
              The camera is usually at y=1.9. We lower the model by 1.9 
              so its feet touch the ground if its origin is at the feet.
              We also rotate the model 180 degrees (Math.PI) so its front (eyes) faces the direction of travel.
            */}
            <primitive object={scene} scale={1} position={[0, -1.9, 0]} rotation={[0, Math.PI, 0]} />

            {/* Floating Username */}
            <Text
                position={[0, 0.4, 0]}
                fontSize={0.2}
                color="#fff"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.02}
                outlineColor="#000"
            >
                {username || "Player"}
            </Text>
        </group>
    );
}

// Preload the model so it doesn't pop in late
useGLTF.preload('/models/Walking.glb');

export default function Scene({ players }) {
    const socket = useStore(state => state.socket);
    const room = useStore(state => state.room);
    const inventory = useStore(state => state.inventory);

    // Sub-states for rendering
    const puzzleStage = useStore(state => state.puzzleStage);
    const lampOff = useStore(state => state.lampOff);
    const booksAligned = useStore(state => state.booksAligned);

    const { camera, scene } = useThree();
    const raycaster = useRef(new THREE.Raycaster());

    useFrame(() => {
        if (socket && room) {
            // Only emit if we have actually moved significantly to save network / prevent false walk triggers
            const pos = camera.position;
            const rot = camera.rotation;

            // Simple check using a ref
            if (!camera.userData.lastPos) {
                camera.userData.lastPos = new THREE.Vector3();
                camera.userData.lastRot = new THREE.Euler();
            }

            const dist = camera.userData.lastPos.distanceTo(pos);
            const rotDist = Math.abs(camera.userData.lastRot.y - rot.y);

            if (dist > 0.01 || rotDist > 0.05) {
                socket.emit('player_move', {
                    roomId: room,
                    position: [pos.x, pos.y, pos.z],
                    rotation: [rot.x, rot.y, rot.z]
                });
                camera.userData.lastPos.copy(pos);
                camera.userData.lastRot.copy(rot);
            }
        }
    });

    useEffect(() => {
        const handleGlobalClick = () => {
            if (!document.pointerLockElement) return;

            raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.current.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                let hitName = null;
                for (let hit of intersects) {
                    let obj = hit.object;
                    while (obj) {
                        if (obj.name && [
                            'desk_notebook', 'chair_key', 'book1', 'book2', 'book3',
                            'chest_puzzle', 'terminal_puzzle', 'lamp_switch',
                            'hidden_book', 'symbol_lock', 'ac_unit', 'curtain', 'escape_door_puzzle'
                        ].includes(obj.name)) {
                            hitName = obj.name;
                            break;
                        }
                        obj = obj.parent;
                    }
                    if (hitName) break;
                }

                if (!hitName) return;

                const state = useStore.getState();
                const currentStage = state.puzzleStage;

                // Round 1
                if (hitName === 'desk_notebook') {
                    state.setGameState({ serverMessage: "Notebook: 'I am so forgetful. I hid the brass key where my legs rest when I read.'" });
                }
                else if (hitName === 'chair_key' && currentStage === 0) {
                    socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'chair_key', payload: null });
                }
                else if (hitName.startsWith('book') && currentStage === 1) {
                    socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'align_book', payload: hitName });
                }

                // Round 2
                else if (hitName === 'terminal_puzzle' && currentStage === 2) {
                    if (state.inventory.includes('usb_drive')) {
                        socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'insert_usb', payload: null });
                    } else {
                        state.setGameState({ serverMessage: "The laptop requires a USB drive." });
                    }
                }
                else if (hitName === 'lamp_switch' && currentStage === 3) {
                    socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'toggle_lamp', payload: null });
                }
                else if (hitName === 'hidden_book' && currentStage === 4) {
                    socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'push_book', payload: null });
                }
                else if (hitName === 'symbol_lock' && currentStage === 5) {
                    document.exitPointerLock();
                    useStore.getState().setGameState({
                        modalPrompt: {
                            title: "Symbol Lock",
                            message: "The lock requires 3 symbols.\nRiddle: 'Look to the heavens above. What three celestial bodies glow brightest in the sky?'",
                            placeholder: "e.g. word_word_word",
                            onSubmit: (code) => {
                                if (code) socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'symbol_lock', payload: code.toLowerCase().trim() });
                                document.body.requestPointerLock();
                            }
                        }
                    });
                }

                // Round 3
                else if (hitName === 'ac_unit' && currentStage === 6) {
                    if (state.inventory.includes('ac_remote')) {
                        socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'turn_on_ac', payload: null });
                    } else {
                        state.setGameState({ serverMessage: "The AC is off. It requires a remote." });
                    }
                }
                else if (hitName === 'curtain' && currentStage === 7) {
                    state.setGameState({ serverMessage: "A scratch behind the curtain says: 'Desk then Air... Side by side.'" });
                }
                else if (hitName === 'escape_door_puzzle' && currentStage === 7) {
                    document.exitPointerLock();
                    useStore.getState().setGameState({
                        modalPrompt: {
                            title: "Keypad Lock",
                            message: "Enter 4-digit Keypad Code:",
                            placeholder: "----",
                            onSubmit: (code) => {
                                if (code) socket.emit('attempt_puzzle', { roomId: room, puzzleType: 'escape_door', payload: code });
                                document.body.requestPointerLock();
                            }
                        }
                    });
                }
            }
        };

        window.addEventListener('pointerdown', handleGlobalClick);
        return () => window.removeEventListener('pointerdown', handleGlobalClick);
    }, [camera, scene, inventory, socket, room]);

    const ROOM_SIZE = 14;
    const WALL_HEIGHT = 6;
    const WALL_COLOR = "#151520";
    const FLOOR_COLOR = "#111116";
    const CEILING_COLOR = "#0c0c14";

    // LED Colors
    const NEON_CYAN = "#00e5ff";
    const NEON_BLUE = "#2962ff";

    return (
        <group>
            {/* Ambient Lighting - Deep Blue Overall */}
            <ambientLight intensity={1.2} color="#2a3b6a" />

            {/* Glowing Ceiling LED Light Spills - All 4 Corners */}
            <pointLight position={[-6, 5.5, -6]} intensity={3.0} color={NEON_CYAN} distance={15} decay={2.0} />
            <pointLight position={[6, 5.5, -6]} intensity={3.0} color={NEON_CYAN} distance={15} decay={2.0} />
            <pointLight position={[-6, 5.5, 6]} intensity={3.0} color={NEON_CYAN} distance={15} decay={2.0} />
            <pointLight position={[6, 5.5, 6]} intensity={3.0} color={NEON_CYAN} distance={15} decay={2.0} />

            {/* TV/PC Monitor Glow (Deep Blue) */}
            <pointLight position={[6, 2.5, -2]} intensity={2.0} color={NEON_BLUE} distance={12} decay={1.5} />
            <pointLight position={[4, 2, 0]} intensity={1.5} color="#4477ff" distance={8} decay={1.5} />

            {/* Practical UV Light if Lamp is OFF and Stage > 3 */}
            {lampOff && <pointLight position={[4, 2, -2]} intensity={3.0} color="#aa00ff" distance={6} decay={2} />}
            {/* Desk Practical Lamp Light */}
            {!lampOff && <pointLight position={[4, 2.2, -3]} intensity={2.5} color="#ffddaa" distance={6} decay={2} castShadow />}

            {/* ARCHITECTURE */}
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
                <meshStandardMaterial color={FLOOR_COLOR} roughness={0.8} />
            </mesh>
            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]} receiveShadow>
                <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
                <meshStandardMaterial color={CEILING_COLOR} roughness={0.9} />
            </mesh>
            {/* Walls */}
            <Box position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]} args={[ROOM_SIZE, WALL_HEIGHT, 0.5]} receiveShadow><meshStandardMaterial color={WALL_COLOR} /></Box>
            <Box position={[0, WALL_HEIGHT / 2, ROOM_SIZE / 2]} args={[ROOM_SIZE, WALL_HEIGHT, 0.5]} receiveShadow><meshStandardMaterial color={WALL_COLOR} /></Box>
            <Box position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} args={[0.5, WALL_HEIGHT, ROOM_SIZE]} receiveShadow><meshStandardMaterial color={WALL_COLOR} /></Box>
            <Box position={[ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} args={[0.5, WALL_HEIGHT, ROOM_SIZE]} receiveShadow><meshStandardMaterial color={WALL_COLOR} /></Box>

            {/* --- ACTUAL LED STRIPS (GLOWING MESHES) --- */}
            {/* Top Left Edge */}
            <Box position={[-6.7, 5.9, 0]} args={[0.1, 0.1, ROOM_SIZE]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={3} /></Box>
            {/* Top Back Edge */}
            <Box position={[0, 5.9, -6.7]} args={[ROOM_SIZE, 0.1, 0.1]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={3} /></Box>
            {/* Top Right Edge */}
            <Box position={[6.7, 5.9, 0]} args={[0.1, 0.1, ROOM_SIZE]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={3} /></Box>
            {/* Top Front Edge */}
            <Box position={[0, 5.9, 6.7]} args={[ROOM_SIZE, 0.1, 0.1]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={3} /></Box>

            {/* Glowing Headboard light */}
            <Box position={[-4.5, 1.8, -6.5]} args={[3.8, 0.05, 0.2]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={5} /></Box>

            {/* --- ROUND 3 MECHANICS: WALL AC UNIT --- */}
            <group position={[-6.7, 5, -4.5]} rotation={[0, Math.PI / 2, 0]}>
                <Box name="ac_unit" args={[2, 0.6, 0.4]} receiveShadow castShadow><meshStandardMaterial color="#ddd" /></Box>
                {/* Temp Display renders blinking 26 if puzzleStage >= 6 */}
                {puzzleStage >= 6 && (
                    <Text position={[0.5, 0, 0.21]} color="#ff0000" fontSize={0.2} material-toneMapped={false}>
                        26°
                    </Text>
                )}
            </group>

            {/* Curtain (Moves if AC is ON) */}
            <group position={[3.5, 3.0, -6.7]}>
                {/* Scratch behind curtain - Actual readable NEON text */}
                <Box position={[0, 0, -0.05]} args={[2.5, 1.2, 0.01]}><meshStandardMaterial color="#222" /></Box>
                {puzzleStage >= 6 && (
                    <Text position={[0, 0, 0.05]} color="#00ffff" fontSize={0.25} maxWidth={2.4} textAlign="center" material-toneMapped={false}>
                        "Desk then Air...\nSide by side."
                    </Text>
                )}

                {/* The Curtain itself */}
                <Box name="curtain" position={puzzleStage >= 6 ? [1.5, 0, 0.1] : [0, 0, 0.1]} args={[3, 4, 0.05]} receiveShadow castShadow>
                    <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
                </Box>
            </group>


            {/* --- ROUND 1 / ROUND 2 MECHANICS: BOOKSHELF --- */}
            <group position={[0.5, 0, -6.1]}>
                {/* Specific Spotlight for the Shelf so it's not missed */}
                <pointLight position={[2, 4, 2]} intensity={5} color="#fff" distance={10} decay={2} castShadow />

                {/* Main Shelf Body - Wood color */}
                <Box position={[0, 2.5, 0]} args={[1.5, 5, 2]} receiveShadow castShadow><meshStandardMaterial color="#5c4033" roughness={0.7} /></Box>
                {/* Shelves */}
                <Box position={[0, 1.5, 0]} args={[1.6, 0.1, 2.1]} receiveShadow castShadow><meshStandardMaterial color="#8b5a2b" /></Box>
                <Box position={[0, 3.0, 0]} args={[1.6, 0.1, 2.1]} receiveShadow castShadow><meshStandardMaterial color="#8b5a2b" /></Box>

                {/* The 3 Alignment Books (Round 1) */}
                <group position={[0.7, 1.8, 0]}>
                    <Box name="book1" position={[0, 0, -0.6]} args={[0.5, 1.1, 0.3]} rotation={[0, booksAligned?.book1 ? 0 : 0.4, 0]} castShadow><meshStandardMaterial color="#ff3333" roughness={0.4} /></Box>
                    <Box name="book2" position={[0, 0, -0.1]} args={[0.5, 1.1, 0.3]} rotation={[0, booksAligned?.book2 ? 0 : -0.3, 0]} castShadow><meshStandardMaterial color="#3333ff" roughness={0.4} /></Box>
                    <Box name="book3" position={[0, 0, 0.4]} args={[0.5, 1.1, 0.3]} rotation={[0, booksAligned?.book3 ? 0 : 0.5, 0]} castShadow><meshStandardMaterial color="#33ff33" roughness={0.4} /></Box>
                </group>

                {/* The Hidden Book (Round 2) */}
                <group position={[0.7, 3.4, -0.5]}>
                    {/* Permanent pulsing light next to the hidden book to draw attention */}
                    <pointLight position={[0.5, 0, 0]} intensity={lampOff ? 4 : 1} color="#aa00ff" distance={4} />
                    <Box name="hidden_book" args={[0.5, 1.1, 0.3]} rotation={[0, puzzleStage >= 6 ? 0.3 : 0, 0]} castShadow>
                        <meshStandardMaterial color={lampOff ? "#aa00ff" : "#888"} emissive={lampOff ? "#aa00ff" : "black"} emissiveIntensity={lampOff ? 0.5 : 0} />
                    </Box>
                </group>

                {/* Hidden Compartment & Symbol Lock */}
                {puzzleStage >= 5 && (
                    <group position={[0.6, 3.4, 0.3]}>
                        <pointLight intensity={2} color="gold" distance={3} />
                        <Box name="symbol_lock" args={[0.7, 0.7, 0.7]} castShadow>
                            <meshStandardMaterial color="gold" metalness={0.9} roughness={0.1} />
                        </Box>
                    </group>
                )}
            </group>


            {/* --- ROUND 1 MECHANICS: BED & CHAIR KEY --- */}
            <group position={[-4.5, 0, -4.5]}>
                <Box position={[0, 0.4, 0]} args={[3.8, 0.8, 4.2]} receiveShadow castShadow><meshStandardMaterial color="#0a0a0f" /></Box>
                <Box position={[0, 1.2, -2.0]} args={[3.8, 1.4, 0.2]} receiveShadow castShadow><meshStandardMaterial color="#1f1f2e" /></Box>
                <Box position={[0, 0.9, 0]} args={[3.5, 0.3, 4.0]} receiveShadow castShadow><meshStandardMaterial color="#c0c5d0" /></Box>
                <Box position={[0, 0.95, 0.7]} args={[3.6, 0.3, 3.0]} receiveShadow castShadow><meshStandardMaterial color="#2d1c3a" roughness={0.9} /></Box>
                <Box position={[-0.8, 1.1, -1.5]} args={[1.2, 0.2, 0.8]} receiveShadow castShadow><meshStandardMaterial color="#cccccc" /></Box>
                <Box position={[0.8, 1.1, -1.5]} args={[1.2, 0.2, 0.8]} receiveShadow castShadow><meshStandardMaterial color="#cccccc" /></Box>
            </group>

            {/* Gaming Chair */}
            <group position={[4.5, 0, -1.2]} rotation={[0, -0.3, 0]}>
                <Box name="chair_key" position={[0, 0.7, 0]} args={[0.8, 0.15, 0.8]} receiveShadow castShadow><meshStandardMaterial color="#111" /></Box>
                <Box name="chair_key" position={[0, 1.7, -0.3]} args={[0.7, 1.9, 0.2]} receiveShadow castShadow><meshStandardMaterial color="#222" /></Box>
                <Cylinder name="chair_key" position={[0, 0.35, 0]} args={[0.05, 0.05, 0.7]} receiveShadow castShadow><meshStandardMaterial color="silver" /></Cylinder>
                <Box name="chair_key" position={[0, 0.05, 0]} args={[0.9, 0.1, 0.9]}><meshStandardMaterial color="#111" /></Box>

                {/* Hidden Key Under Chair */}
                {!inventory.includes('desk_key') && (
                    <Box position={[0, 0.15, 0]} args={[0.2, 0.05, 0.4]}>
                        <meshStandardMaterial color="silver" metalness={1} />
                    </Box>
                )}
            </group>


            {/* --- ROUND 1 & 2 MECHANICS: DESK AREA --- */}
            <group position={[5, 0, -3]}>
                {/* Invisible Collision Box for Desk to prevent walking through the legs/table */}
                <Box position={[0, 0.7, 0]} args={[3.5, 1.4, 2.2]}>
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </Box>

                <Box position={[0, 1.4, 0]} args={[3.5, 0.1, 2.2]} receiveShadow castShadow><meshStandardMaterial color="#eeeeee" roughness={0.3} /></Box>
                <Box position={[-1.6, 0.7, 0]} args={[0.05, 1.4, 2.1]} receiveShadow castShadow><meshStandardMaterial color="#333" /></Box>
                <Box position={[1.6, 0.7, 0]} args={[0.05, 1.4, 2.1]} receiveShadow castShadow><meshStandardMaterial color="#333" /></Box>

                {/* Chest / Desk Drawer */}
                <Box name="chest_puzzle" position={[1.2, 1.0, 0]} args={[0.8, 0.6, 1.8]} receiveShadow castShadow>
                    <meshStandardMaterial color="#222" />
                </Box>

                {/* Clue Notebook */}
                <Box name="desk_notebook" position={[-1.2, 1.46, 0.6]} args={[0.6, 0.05, 0.8]} rotation={[0, 0.2, 0]} castShadow>
                    <meshStandardMaterial color="#aa3333" />
                </Box>

                {/* Thermometer Object */}
                <group position={[1.0, 1.46, 0.8]} rotation={[0, -0.3, 0]}>
                    <Box args={[0.4, 0.05, 0.1]}><meshStandardMaterial color="#fff" /></Box>
                    <Text position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} color="black" fontSize={0.1}>20°C</Text>
                </group>

                {/* Desk Lamp Switch */}
                <group position={[1.4, 1.46, -0.6]}>
                    <Cylinder args={[0.15, 0.15, 0.1]}><meshStandardMaterial color="#222" /></Cylinder>
                    <Box name="lamp_switch" position={[0, 0.1, 0]} args={[0.05, 0.1, 0.05]}><meshStandardMaterial color={lampOff ? "red" : "green"} /></Box>
                </group>

                {/* UV Message reveals if Lamp is Off */}
                {lampOff && puzzleStage >= 4 && (
                    <Text position={[0, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#aa00ff" fontSize={0.15} material-toneMapped={false}>
                        "The quiet shelf remembers..."
                    </Text>
                )}

                {/* Glowing PC Tower */}
                <group position={[1.6, 0.7, 1.5]}>
                    <Box args={[0.8, 1.4, 1.6]} receiveShadow castShadow><meshStandardMaterial color="#050510" /></Box>
                    <Box position={[0, 0, 0.85]} args={[0.6, 1.2, 0.05]}><meshStandardMaterial color={NEON_CYAN} emissive={NEON_CYAN} emissiveIntensity={1.5} /></Box>
                </group>

                {/* Main PC Monitor */}
                <group name="terminal_puzzle" position={[-0.2, 2.1, -0.6]}>
                    <Box position={[0, 0, 0]} args={[2.0, 1.2, 0.1]} castShadow><meshStandardMaterial color="#050510" /></Box>
                    <Box position={[0, 0, 0.06]} args={[1.9, 1.1, 0.01]}>
                        <meshStandardMaterial color="#2962ff" emissive="#2962ff" emissiveIntensity={1.2} />
                    </Box>
                    <Box position={[0, -0.6, 0.1]} args={[0.15, 0.1, 0.3]} castShadow><meshStandardMaterial color="#222" /></Box>
                    <Box position={[0, -0.65, 0.2]} args={[0.8, 0.05, 0.5]} castShadow><meshStandardMaterial color="#333" /></Box>
                </group>

                {/* Keyboard & Mouse area */}
                <Box position={[0, 1.46, 0.4]} args={[1.2, 0.05, 0.4]}><meshStandardMaterial color="#111" /></Box>
                <Box position={[1.0, 1.46, 0.4]} args={[0.2, 0.05, 0.3]}><meshStandardMaterial color="#111" /></Box>
            </group>

            {/* Massive Wall TV */}
            <group position={[6.8, 3.5, 2]} rotation={[0, -Math.PI / 2, 0]}>
                <Box position={[0, 0, 0]} args={[4, 2.5, 0.1]}><meshStandardMaterial color="#050510" /></Box>
                <Box position={[0, 0, 0.06]} args={[3.8, 2.3, 0.01]}>
                    <meshStandardMaterial color="#3366ff" emissive="#3366ff" emissiveIntensity={0.8} />
                </Box>
            </group>

            {/* Rug under chair/desk */}
            <Box position={[2.5, 0.02, -2.5]} args={[6, 0.02, 5]} receiveShadow>
                <meshStandardMaterial color="#3a3a45" roughness={1} />
            </Box>

            {/* --- ROUND 3 MECHANICS: ESCAPE DOOR --- */}

            {/* Spotlight directly over the Escape Door */}
            <pointLight position={[-2, 4.5, 5]} intensity={3} color="#fff" distance={8} decay={1.5} />

            <Box name="escape_door_puzzle" position={[-2, 2.5, 6.8]} args={[3, 5, 0.2]} castShadow receiveShadow>
                <meshStandardMaterial color={useStore.getState().isEscaped ? "#00e5ff" : "#111827"} metalness={0.6} roughness={0.3} />
            </Box>
            {/* Door Frame Highlight */}
            <Box position={[-2, 2.5, 6.9]} args={[3.3, 5.3, 0.1]}><meshStandardMaterial color="#fff" /></Box>

            {/* Keypad */}
            <Box name="escape_door_puzzle" position={[0.2, 2.5, 6.8]} args={[0.4, 0.6, 0.1]} castShadow>
                <meshStandardMaterial color={useStore.getState().isEscaped ? "#00e5ff" : "#ff2244"} />
            </Box>
            <Box name="escape_door_puzzle" position={[0.2, 2.6, 6.75]} args={[0.25, 0.2, 0.12]}>
                <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.5} />
            </Box>

            {/* Remote Players */}
            {Object.entries(players).map(([id, data]) => {
                // Do not render the local player
                if (id === socket?.id) return null;
                return (
                    <RemotePlayerModel
                        key={id}
                        position={data.position}
                        rotation={data.rotation}
                        username={data.username}
                    />
                );
            })}
        </group>
    );
}
