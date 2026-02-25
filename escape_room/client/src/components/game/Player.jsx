import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import { Vector3, Raycaster } from 'three';

export default function Player() {
    const { camera, scene } = useThree();
    const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false });
    const raycaster = useRef(new Raycaster());

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setMovement((m) => ({ ...m, forward: true }));
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    setMovement((m) => ({ ...m, backward: true }));
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    setMovement((m) => ({ ...m, left: true }));
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    setMovement((m) => ({ ...m, right: true }));
                    break;
            }
        };
        const handleKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    setMovement((m) => ({ ...m, forward: false }));
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    setMovement((m) => ({ ...m, backward: false }));
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    setMovement((m) => ({ ...m, left: false }));
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    setMovement((m) => ({ ...m, right: false }));
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        const speed = 5;
        const velocity = new Vector3();

        if (movement.forward) velocity.z -= speed * delta;
        if (movement.backward) velocity.z += speed * delta;
        if (movement.right) velocity.x += speed * delta;
        if (movement.left) velocity.x -= speed * delta;

        // Apply rotation of the camera to the movement direction so we move where we look
        velocity.applyEuler(camera.rotation);
        // Keep movement on the horizontal plane (no flying)
        velocity.y = 0;

        const checkCollision = (moveVec) => {
            if (moveVec.lengthSq() < 0.0001) return false;

            const dir = moveVec.clone().normalize();
            // Cast a ray from player center (waist height ~1.0)
            const origin = new Vector3(camera.position.x, 1.0, camera.position.z);
            raycaster.current.set(origin, dir);

            const intersects = raycaster.current.intersectObjects(scene.children, true);
            const collisionDist = 0.5; // player radius thickness

            for (let i = 0; i < intersects.length; i++) {
                const obj = intersects[i].object;
                // Ignore floors/ceilings (PlaneGeometry) and other remote players (SkinnedMesh)
                if (obj.isMesh && obj.geometry.type !== "PlaneGeometry" && obj.type !== "SkinnedMesh") {
                    if (intersects[i].distance < collisionDist) {
                        return true;
                    }
                }
            }
            return false;
        };

        const moveX = new Vector3(velocity.x, 0, 0);
        const moveZ = new Vector3(0, 0, velocity.z);

        if (!checkCollision(moveX)) {
            camera.position.x += velocity.x;
        }
        if (!checkCollision(moveZ)) {
            camera.position.z += velocity.z;
        }

        // Room hard bounds to prevent escaping Map completely
        const ROOM_BOUND = 6.6;
        camera.position.x = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, camera.position.x));
        camera.position.z = Math.max(-ROOM_BOUND, Math.min(ROOM_BOUND, camera.position.z));
    });

    return null;
}
