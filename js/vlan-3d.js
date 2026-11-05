/**
 * VLAN Defense - 3D Network Topology & Packet Flow Engine
 * Three.js WebGL Visualization of Cisco Catalyst 3850 Switch & 802.1Q Conduits
 * Professional Industrial NOC Aesthetic
 */

class Vlan3DWorld {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.packets = [];
        this.towers = {}; // portName -> { mesh, ledMesh, mode: 'access'|'trunk', vlanId: 10 }
        this.portLeds = [];
        this.cameraTargetPos = new THREE.Vector3(0, 32, 38);
        this.cameraLookPos = new THREE.Vector3(0, 0, 0);

        this.init();
    }

    init() {
        if (!window.THREE || !this.container) return;

        // 1. Scene, Camera & Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070B14);
        this.scene.fog = new THREE.FogExp2(0x070B14, 0.014);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
        this.camera.position.set(0, 32, 38);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 2. Lighting Setup (Industrial Laboratory Illumination)
        const hemiLight = new THREE.HemisphereLight(0xF8FAFC, 0x0F172A, 0.7);
        this.scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
        keyLight.position.set(20, 45, 30);
        keyLight.castShadow = true;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x38BDF8, 0.4);
        fillLight.position.set(-25, 20, -20);
        this.scene.add(fillLight);

        // 3. Build Lab Workstation Workbench Surface
        this.buildLabWorkbench();

        // 4. Build Realistic Cisco Catalyst 3850 1RU Chassis
        this.buildCiscoSwitch();

        // 5. Build Detailed Endpoints (Workstations, Intruder Node, Servers)
        this.buildEndpoints();

        // 6. Build Fiber Optic Conduits
        this.buildFiberConduits();

        // 7. Event Handlers & Render Loop
        this.setupResize();
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setCameraView(viewName) {
        if (viewName === "front") {
            // Front Faceplate Focus View
            this.cameraTargetPos.set(0, 6, 22);
            this.cameraLookPos.set(0, 1.8, 0);
        } else if (viewName === "top") {
            // Top Orthogonal Layout View
            this.cameraTargetPos.set(0, 46, 1);
            this.cameraLookPos.set(0, 0, 0);
        } else {
            // Default Isometric Overview
            this.cameraTargetPos.set(0, 32, 38);
            this.cameraLookPos.set(0, 0, 0);
        }
    }

    buildLabWorkbench() {
        // Heavy Matte Datacenter Tile Surface
        const floorGeo = new THREE.BoxGeometry(64, 1.2, 44);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0A0F1D,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.6;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Technical Grid Matrix
        const grid = new THREE.GridHelper(60, 30, 0x1E293B, 0x0F172A);
        grid.position.y = 0.02;
        this.scene.add(grid);
    }

    buildCiscoSwitch() {
        const switchGroup = new THREE.Group();

        // 1RU Metal Chassis (Cisco Catalyst 3850)
        const chassisGeo = new THREE.BoxGeometry(17, 2.4, 11);
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x1E293B,
            metalness: 0.85,
            roughness: 0.25
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.position.y = 1.2;
        chassis.castShadow = true;
        switchGroup.add(chassis);

        // Cisco Faceplate Bezel
        const faceGeo = new THREE.BoxGeometry(17.05, 2.1, 0.4);
        const faceMat = new THREE.MeshStandardMaterial({
            color: 0x0F172A,
            metalness: 0.4,
            roughness: 0.7
        });
        const faceplate = new THREE.Mesh(faceGeo, faceMat);
        faceplate.position.set(0, 1.2, 5.55);
        switchGroup.add(faceplate);

        // Rack Mount Brackets (Ears)
        const earMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        [-8.8, 8.8].forEach(x => {
            const earGeo = new THREE.BoxGeometry(0.6, 2.4, 1.8);
            const ear = new THREE.Mesh(earGeo, earMat);
            ear.position.set(x, 1.2, 4.6);
            switchGroup.add(ear);
        });

        // 24 RJ-45 Port Sockets & Status LEDs on Faceplate
        const portMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x334155 });

        for (let i = 0; i < 12; i++) {
            const posX = -6.5 + (i * 1.15);
            // Top and Bottom row
            [-0.35, 0.35].forEach((offsetY, rowIdx) => {
                const jackGeo = new THREE.BoxGeometry(0.8, 0.65, 0.2);
                const jack = new THREE.Mesh(jackGeo, portMat);
                jack.position.set(posX, 1.2 + offsetY, 5.76);
                switchGroup.add(jack);

                // LED Indicator
                const ledGeo = new THREE.BoxGeometry(0.25, 0.15, 0.1);
                const led = new THREE.Mesh(ledGeo, ledMat.clone());
                led.position.set(posX, 1.2 + offsetY + (rowIdx === 0 ? 0.45 : -0.45), 5.76);
                switchGroup.add(led);
                this.portLeds.push(led);
            });
        }

        // Cisco Logo Badge Area
        const badgeGeo = new THREE.BoxGeometry(2.2, 0.6, 0.1);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(-6.5, 1.2, 5.76);
        switchGroup.add(badge);

        this.scene.add(switchGroup);
    }

    buildEndpoints() {
        const createComputer = (color, name) => {
            const g = new THREE.Group();
            // Desk Stand
            const baseGeo = new THREE.BoxGeometry(2.5, 0.2, 2);
            const standGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2);
            const matDark = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.6, roughness: 0.4 });
            const base = new THREE.Mesh(baseGeo, matDark);
            const stand = new THREE.Mesh(standGeo, matDark);
            stand.position.y = 0.6;
            g.add(base);
            g.add(stand);

            // Screen
            const screenGeo = new THREE.BoxGeometry(4.2, 2.6, 0.3);
            const screen = new THREE.Mesh(screenGeo, matDark);
            screen.position.set(0, 1.8, 0);
            g.add(screen);

            // Display Active Glow
            const dispGeo = new THREE.PlaneGeometry(3.8, 2.2);
            const dispMat = new THREE.MeshBasicMaterial({ color: color });
            const disp = new THREE.Mesh(dispGeo, dispMat);
            disp.position.set(0, 1.8, 0.17);
            g.add(disp);

            // PC Tower
            const towerGeo = new THREE.BoxGeometry(1.6, 3.8, 3.6);
            const tower = new THREE.Mesh(towerGeo, matDark);
            tower.position.set(2.8, 1.9, 0);
            g.add(tower);

            return g;
        };

        const createServerRack = (color) => {
            const g = new THREE.Group();
            const serverGeo = new THREE.BoxGeometry(5.2, 4.4, 4.2);
            const serverMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, metalness: 0.7, roughness: 0.3 });
            const server = new THREE.Mesh(serverGeo, serverMat);
            server.position.y = 2.2;
            g.add(server);

            // LED Grille
            const grillGeo = new THREE.PlaneGeometry(4.4, 3.6);
            const grillMat = new THREE.MeshBasicMaterial({ color: color });
            const grill = new THREE.Mesh(grillGeo, grillMat);
            grill.position.set(0, 2.2, 2.12);
            g.add(grill);
            return g;
        };

        // Client A (Finance - VLAN 10)
        const clientA = createComputer(0x06B6D4, "Finance");
        clientA.position.set(-22, 0, -12);
        this.scene.add(clientA);

        // Client B (Engineering - VLAN 20)
        const clientB = createComputer(0x10B981, "Engineering");
        clientB.position.set(-22, 0, 0);
        this.scene.add(clientB);

        // Client C (Guest/Mgmt - VLAN 30)
        const clientC = createComputer(0xF59E0B, "Guest");
        clientC.position.set(-22, 0, 12);
        this.scene.add(clientC);

        // Rogue Intruder Node (Fa0/4)
        const intruder = createComputer(0xEF4444, "Intruder");
        intruder.position.set(-22, 0, 6);
        this.scene.add(intruder);

        // Destination Servers (Finance Server, Engineering Server, Uplink Core)
        const serverFin = createServerRack(0x06B6D4);
        serverFin.position.set(22, 0, -12);
        this.scene.add(serverFin);

        const serverEng = createServerRack(0x10B981);
        serverEng.position.set(22, 0, 0);
        this.scene.add(serverEng);

        const serverCore = createServerRack(0xF59E0B);
        serverCore.position.set(22, 0, 12);
        this.scene.add(serverCore);
    }

    buildFiberConduits() {
        const conduitLines = [
            { from: new THREE.Vector3(-19, 1.2, -12), to: new THREE.Vector3(-8.5, 1.2, -3.5), color: 0x06B6D4 },
            { from: new THREE.Vector3(-19, 1.2, 0), to: new THREE.Vector3(-8.5, 1.2, 0), color: 0x10B981 },
            { from: new THREE.Vector3(-19, 1.2, 12), to: new THREE.Vector3(-8.5, 1.2, 3.5), color: 0xF59E0B },
            { from: new THREE.Vector3(-19, 1.2, 6), to: new THREE.Vector3(-8.5, 1.2, 1.8), color: 0xEF4444 },
            // Outputs
            { from: new THREE.Vector3(8.5, 1.2, -3.5), to: new THREE.Vector3(19, 1.2, -12), color: 0x06B6D4 },
            { from: new THREE.Vector3(8.5, 1.2, 0), to: new THREE.Vector3(19, 1.2, 0), color: 0x10B981 },
            { from: new THREE.Vector3(8.5, 1.2, 3.5), to: new THREE.Vector3(19, 1.2, 12), color: 0xF59E0B }
        ];

        conduitLines.forEach(c => {
            const curve = new THREE.LineCurve3(c.from, c.to);
            const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.1, 6, false);
            const tubeMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.5 });
            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            this.scene.add(tube);
        });

        this.buildPortFilterTowers();
    }

    buildPortFilterTowers() {
        const portConfigs = [
            { port: "fa0/1", x: -8.5, z: -3.5 },
            { port: "fa0/2", x: -8.5, z: 0 },
            { port: "fa0/3", x: -8.5, z: 3.5 },
            { port: "fa0/4", x: -8.5, z: 1.8 },
            { port: "fa0/10", x: 8.5, z: -3.5 },
            { port: "fa0/11", x: 8.5, z: 0 },
            { port: "fa0/12", x: 8.5, z: 3.5 },
            { port: "gi0/1", x: 8.5, z: 5.5 }
        ];

        portConfigs.forEach(p => {
            const towerGeo = new THREE.CylinderGeometry(0.7, 0.7, 3.2, 12);
            const towerMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                metalness: 0.5,
                roughness: 0.3,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(towerGeo, towerMat);
            mesh.position.set(p.x, 1.6, p.z);
            this.scene.add(mesh);

            // LED ring
            const ringGeo = new THREE.TorusGeometry(0.75, 0.08, 8, 20);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x64748B });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(p.x, 2.8, p.z);
            this.scene.add(ring);

            this.towers[p.port] = {
                mesh: mesh,
                ringMesh: ring,
                material: towerMat,
                ringMat: ringMat,
                mode: "unconfigured",
                vlanId: 1
            };
        });
    }

    updatePortConfiguration(portName, mode, vlanId, allowedVlans = []) {
        const tower = this.towers[portName.toLowerCase()];
        if (!tower) return;

        tower.mode = mode;
        tower.vlanId = vlanId;
        tower.allowedVlans = allowedVlans;

        let color = 0x334155;
        if (mode === "access") {
            if (vlanId === 10) color = 0x06B6D4;
            else if (vlanId === 20) color = 0x10B981;
            else if (vlanId === 30) color = 0xF59E0B;
            else color = 0x8B5CF6;
        } else if (mode === "trunk") {
            color = 0x38BDF8;
        }

        tower.material.color.setHex(color);
        tower.ringMat.color.setHex(color);
    }

    spawnPacket(sourceType, vlanTag, isRogue = false) {
        let startX = -20;
        let startZ = -12;
        let targetZ = -12;
        let color = 0x06B6D4;

        if (sourceType === "clientA") { startZ = -12; targetZ = -12; color = 0x06B6D4; }
        else if (sourceType === "clientB") { startZ = 0; targetZ = 0; color = 0x10B981; }
        else if (sourceType === "clientC") { startZ = 12; targetZ = 12; color = 0xF59E0B; }
        else if (sourceType === "attacker") { startX = -20; startZ = 6; targetZ = 0; color = 0xEF4444; }

        const packetGeo = new THREE.SphereGeometry(0.55, 12, 12);
        const packetMat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(packetGeo, packetMat);
        mesh.position.set(startX, 1.2, startZ);
        this.scene.add(mesh);

        this.packets.push({
            mesh: mesh,
            vlanTag: vlanTag,
            isRogue: isRogue,
            progress: 0,
            startX: startX,
            startZ: startZ,
            targetZ: targetZ,
            stage: "inbound",
            color: color
        });
    }

    updatePackets(delta) {
        const speed = 15.0;

        for (let i = this.packets.length - 1; i >= 0; i--) {
            const p = this.packets[i];
            p.progress += delta * speed;

            if (p.stage === "inbound") {
                const totalDist = 11.5;
                const ratio = Math.min(1.0, p.progress / totalDist);
                p.mesh.position.x = p.startX + (ratio * (-8.5 - p.startX));
                p.mesh.position.z = p.startZ;

                if (ratio >= 1.0) {
                    p.stage = "switch";
                    p.progress = 0;

                    if (window.vlanGame) {
                        const accepted = window.vlanGame.evaluatePacketEntry(p);
                        if (!accepted) {
                            this.scene.remove(p.mesh);
                            this.packets.splice(i, 1);
                            continue;
                        }
                    }
                }
            } else if (p.stage === "switch") {
                p.mesh.position.x = -8.5 + (p.progress / 3.5) * 17;
                p.mesh.position.z = p.targetZ;

                if (p.progress >= 3.5) {
                    p.stage = "outbound";
                    p.progress = 0;
                }
            } else if (p.stage === "outbound") {
                const totalDist = 11.5;
                const ratio = Math.min(1.0, p.progress / totalDist);
                p.mesh.position.x = 8.5 + (ratio * 11.5);
                p.mesh.position.z = p.targetZ;

                if (ratio >= 1.0) {
                    if (window.vlanGame) {
                        window.vlanGame.handlePacketDelivered(p);
                    }
                    this.scene.remove(p.mesh);
                    this.packets.splice(i, 1);
                }
            }
        }
    }

    setupResize() {
        window.addEventListener("resize", () => {
            if (!this.container || !this.renderer || !this.camera) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = this.clock.getDelta();

        this.updatePackets(delta);

        // Smooth Camera Transition towards target position
        this.camera.position.lerp(this.cameraTargetPos, 0.05);
        this.camera.lookAt(this.cameraLookPos);

        // Subtle port LED flicker
        const time = this.clock.getElapsedTime();
        if (this.portLeds.length > 0 && Math.sin(time * 8) > 0.3) {
            const randLed = this.portLeds[Math.floor(Math.random() * this.portLeds.length)];
            randLed.material.color.setHex(0x10B981);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.Vlan3DWorld = Vlan3DWorld;
