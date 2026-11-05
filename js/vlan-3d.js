/**
 * VLAN Defense - 3D Network Topology & Packet Flow Engine
 * Three.js WebGL Visualization of Cisco 802.1Q VLAN Tagging & Switching
 */

class Vlan3DWorld {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.packets = [];
        this.towers = {}; // portName -> { mesh, mode: 'access'|'trunk', vlanId: 10 }

        this.init();
    }

    init() {
        if (!window.THREE) return;

        // 1. Scene, Camera & Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050811);
        this.scene.fog = new THREE.FogExp2(0x050811, 0.015);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
        this.camera.position.set(0, 32, 38);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // 2. Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111827, 0.6);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        dirLight.position.set(20, 40, 25);
        this.scene.add(dirLight);

        // Point lights for network nodes
        this.cyanLight = new THREE.PointLight(0x06b6d4, 1.5, 25);
        this.cyanLight.position.set(-20, 4, -10);
        this.scene.add(this.cyanLight);

        this.greenLight = new THREE.PointLight(0x10b981, 1.5, 25);
        this.greenLight.position.set(-20, 4, 10);
        this.scene.add(this.greenLight);

        // 3. Build Circuit Board Ground
        this.buildNetworkBoard();

        // 4. Build Central 3D Switch Chassis
        this.buildSwitchChassis();

        // 5. Build Source Clients & Destination Servers
        this.buildEndpoints();

        // 6. Build Fiber Optic Conduits
        this.buildFiberConduits();

        // 7. Listeners & Render Loop
        this.setupResize();
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    buildNetworkBoard() {
        const boardGeo = new THREE.BoxGeometry(60, 1.5, 42);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0a101f, roughness: 0.6, metalness: 0.3 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = -0.75;
        this.scene.add(board);

        // Glowing Grid Lines
        const gridHelper = new THREE.GridHelper(56, 28, 0x06b6d4, 0x1f293d);
        gridHelper.position.y = 0.02;
        this.scene.add(gridHelper);
    }

    buildSwitchChassis() {
        const switchGroup = new THREE.Group();

        // Cisco Catalyst Switch Body
        const bodyGeo = new THREE.BoxGeometry(16, 3, 10);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.5;
        switchGroup.add(body);

        // Front Faceplate
        const faceGeo = new THREE.BoxGeometry(16.1, 2.6, 0.4);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.set(0, 1.5, 5.1);
        switchGroup.add(face);

        // FastEthernet & Gigabit Port Rows (Visual representations)
        for (let i = 0; i < 8; i++) {
            const portGeo = new THREE.BoxGeometry(1.2, 0.8, 0.2);
            const portMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
            const portTop = new THREE.Mesh(portGeo, portMat);
            portTop.position.set(-6 + (i * 1.5), 2.0, 5.35);
            switchGroup.add(portTop);

            const portBot = portTop.clone();
            portBot.position.y = 1.0;
            switchGroup.add(portBot);
        }

        // 2 Gigabit Trunk Uplinks on right
        for (let g = 0; g < 2; g++) {
            const gigGeo = new THREE.BoxGeometry(1.4, 1.4, 0.3);
            const gigMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
            const gig = new THREE.Mesh(gigGeo, gigMat);
            gig.position.set(6.8, 1.5, 5.35);
            switchGroup.add(gig);
        }

        this.scene.add(switchGroup);
        this.switchGroup = switchGroup;
    }

    buildEndpoints() {
        this.endpoints = {};

        // 1. Client A (Finance - VLAN 10)
        this.endpoints.clientA = this.createNodeCube("CLIENT A\n(Finance)", -22, -12, 0x06b6d4, "💻");
        // 2. Client B (Engineering - VLAN 20)
        this.endpoints.clientB = this.createNodeCube("CLIENT B\n(Eng)", -22, 0, 0x10b981, "💻");
        // 3. Client C (Guest - VLAN 30)
        this.endpoints.clientC = this.createNodeCube("CLIENT C\n(Guest)", -22, 12, 0xf59e0b, "📱");

        // 4. Rogue Attacker (VLAN Hopping / Broadcast Storm)
        this.endpoints.attacker = this.createNodeCube("ROGUE INTRUDER\n(Untagged)", -26, 6, 0xf43f5e, "⚠️");

        // 5. Destination Server A (Finance DB - VLAN 10)
        this.endpoints.serverA = this.createNodeCube("FINANCE DB\n(VLAN 10)", 22, -12, 0x06b6d4, "🗄️");
        // 6. Destination Server B (Git Server - VLAN 20)
        this.endpoints.serverB = this.createNodeCube("GIT REPO\n(VLAN 20)", 22, 0, 0x10b981, "🗄️");
        // 7. Destination Server C (Syslog - VLAN 30)
        this.endpoints.serverC = this.createNodeCube("SYSLOG MGMT\n(VLAN 30)", 22, 12, 0xf59e0b, "🗄️");
    }

    createNodeCube(label, x, z, color, icon) {
        const group = new THREE.Group();

        const geo = new THREE.BoxGeometry(5, 4, 4);
        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 2;
        group.add(mesh);

        // Indicator Light
        const lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: color });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(0, 4.4, 0);
        group.add(light);

        group.position.set(x, 0, z);
        this.scene.add(group);
        return { group, x, z, color };
    }

    buildFiberConduits() {
        this.conduits = [];

        // Conduits from Clients to Switch (Ports Fa0/1, Fa0/2, Fa0/3, Fa0/4)
        const inputs = [
            { from: this.endpoints.clientA, port: "fa0/1", inZ: -3.5, color: 0x06b6d4 },
            { from: this.endpoints.clientB, port: "fa0/2", inZ: 0, color: 0x10b981 },
            { from: this.endpoints.clientC, port: "fa0/3", inZ: 3.5, color: 0xf59e0b },
            { from: this.endpoints.attacker, port: "fa0/4", inZ: 1.8, color: 0xf43f5e }
        ];

        inputs.forEach(conn => {
            const curve = new THREE.LineCurve3(
                new THREE.Vector3(conn.from.x + 2.5, 1.5, conn.from.z),
                new THREE.Vector3(-8, 1.5, conn.inZ)
            );
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.15, 6, false);
            const tubeMat = new THREE.MeshBasicMaterial({ color: conn.color, transparent: true, opacity: 0.6 });
            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            this.scene.add(tube);
            this.conduits.push({ curve, port: conn.port, type: "input" });
        });

        // Conduits from Switch to Destination Servers (Ports Fa0/10, Fa0/11, Fa0/12)
        const outputs = [
            { to: this.endpoints.serverA, port: "fa0/10", outZ: -3.5, color: 0x06b6d4 },
            { to: this.endpoints.serverB, port: "fa0/11", outZ: 0, color: 0x10b981 },
            { to: this.endpoints.serverC, port: "fa0/12", outZ: 3.5, color: 0xf59e0b }
        ];

        outputs.forEach(conn => {
            const curve = new THREE.LineCurve3(
                new THREE.Vector3(8, 1.5, conn.outZ),
                new THREE.Vector3(conn.to.x - 2.5, 1.5, conn.to.z)
            );
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.15, 6, false);
            const tubeMat = new THREE.MeshBasicMaterial({ color: conn.color, transparent: true, opacity: 0.6 });
            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            this.scene.add(tube);
            this.conduits.push({ curve, port: conn.port, type: "output" });
        });

        // Build Visual Port Filter Towers
        this.buildPortFilterTowers();
    }

    buildPortFilterTowers() {
        const portConfigs = [
            { port: "fa0/1", x: -8, z: -3.5 },
            { port: "fa0/2", x: -8, z: 0 },
            { port: "fa0/3", x: -8, z: 3.5 },
            { port: "fa0/4", x: -8, z: 1.8 },
            { port: "fa0/10", x: 8, z: -3.5 },
            { port: "fa0/11", x: 8, z: 0 },
            { port: "fa0/12", x: 8, z: 3.5 },
            { port: "gi0/1", x: 8, z: 5.5 }
        ];

        portConfigs.forEach(p => {
            const towerGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.5, 12);
            const towerMat = new THREE.MeshStandardMaterial({
                color: 0x475569, // Default: untagged/disabled grey
                emissive: 0x1e293b,
                roughness: 0.3,
                transparent: true,
                opacity: 0.85
            });
            const mesh = new THREE.Mesh(towerGeo, towerMat);
            mesh.position.set(p.x, 1.75, p.z);
            this.scene.add(mesh);

            this.towers[p.port] = {
                mesh: mesh,
                material: towerMat,
                mode: "unconfigured",
                vlanId: 1
            };
        });
    }

    /**
     * Called when student executes Cisco command in CLI:
     * e.g., updatePortConfiguration("fa0/1", "access", 10)
     */
    updatePortConfiguration(portName, mode, vlanId, allowedVlans = []) {
        const tower = this.towers[portName.toLowerCase()];
        if (!tower) return;

        tower.mode = mode;
        tower.vlanId = vlanId;
        tower.allowedVlans = allowedVlans;

        let color = 0x475569;
        if (mode === "access") {
            if (vlanId === 10) color = 0x06b6d4; // Cyan
            else if (vlanId === 20) color = 0x10b981; // Green
            else if (vlanId === 30) color = 0xf59e0b; // Amber
            else color = 0x9333ea;
        } else if (mode === "trunk") {
            color = 0x38bdf8; // Trunk light blue laser
        }

        tower.material.color.setHex(color);
        tower.material.emissive.setHex(color);
        tower.material.emissiveIntensity = 0.8;
    }

    /**
     * Spawn an active 3D Network Packet traversing from client to server
     */
    spawnPacket(sourceType, vlanTag, isRogue = false) {
        let startX = -20;
        let startZ = -12;
        let targetZ = -12;
        let color = 0x06b6d4;

        if (sourceType === "clientA") { startZ = -12; targetZ = -12; color = 0x06b6d4; }
        else if (sourceType === "clientB") { startZ = 0; targetZ = 0; color = 0x10b981; }
        else if (sourceType === "clientC") { startZ = 12; targetZ = 12; color = 0xf59e0b; }
        else if (sourceType === "attacker") { startX = -24; startZ = 6; targetZ = 0; color = 0xf43f5e; }

        const packetGeo = new THREE.SphereGeometry(0.65, 12, 12);
        const packetMat = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(packetGeo, packetMat);
        mesh.position.set(startX, 1.5, startZ);
        this.scene.add(mesh);

        this.packets.push({
            mesh: mesh,
            vlanTag: vlanTag,
            isRogue: isRogue,
            progress: 0,
            startX: startX,
            startZ: startZ,
            targetZ: targetZ,
            stage: "inbound", // inbound -> switch -> outbound
            color: color
        });
    }

    updatePackets(delta) {
        const speed = 16.0;

        for (let i = this.packets.length - 1; i >= 0; i--) {
            const p = this.packets[i];
            p.progress += delta * speed;

            // Inbound: from client to switch input port
            if (p.stage === "inbound") {
                const totalDist = 12;
                const ratio = Math.min(1.0, p.progress / totalDist);
                p.mesh.position.x = p.startX + (ratio * (-8 - p.startX));
                p.mesh.position.z = p.startZ;

                if (ratio >= 1.0) {
                    p.stage = "switch";
                    p.progress = 0;

                    // Trigger evaluation at input port
                    if (window.vlanGame) {
                        const accepted = window.vlanGame.evaluatePacketEntry(p);
                        if (!accepted) {
                            // Drop packet with zap explosion
                            this.scene.remove(p.mesh);
                            this.packets.splice(i, 1);
                            continue;
                        }
                    }
                }
            }
            // Switch processing
            else if (p.stage === "switch") {
                p.mesh.position.x = -8 + (p.progress / 4) * 16;
                p.mesh.position.z = p.targetZ;

                if (p.progress >= 4) {
                    p.stage = "outbound";
                    p.progress = 0;
                }
            }
            // Outbound: from switch port to destination server
            else if (p.stage === "outbound") {
                const totalDist = 12;
                const ratio = Math.min(1.0, p.progress / totalDist);
                p.mesh.position.x = 8 + (ratio * 12);
                p.mesh.position.z = p.targetZ;

                if (ratio >= 1.0) {
                    // Packet arrived at server!
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

        // Gentle camera float
        this.camera.position.x = Math.sin(this.clock.getElapsedTime() * 0.3) * 1.5;

        this.renderer.render(this.scene, this.camera);
    }
}

window.Vlan3DWorld = Vlan3DWorld;
