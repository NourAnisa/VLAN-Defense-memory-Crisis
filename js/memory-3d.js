/**
 * Memory Overcommit Crisis - 3D Server Rack & Hypervisor Node Engine
 * Three.js WebGL Visualization of Proxmox VE 8.1 Memory Ballooning & OOM Protection
 */

class Memory3DWorld {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.vms = {};
        this.cameraTargetPos = new THREE.Vector3(0, 22, 32);
        this.cameraLookPos = new THREE.Vector3(0, 8, 0);

        this.init();
    }

    init() {
        if (!window.THREE || !this.container) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xF8FAFC);
        this.scene.fog = new THREE.FogExp2(0xF8FAFC, 0.008);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
        this.camera.position.set(0, 22, 32);
        this.camera.lookAt(0, 8, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting (Clean White Studio Datacenter Ambience)
        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xE2E8F0, 0.95);
        this.scene.add(hemiLight);

        const rackLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
        rackLight.position.set(15, 30, 25);
        rackLight.castShadow = true;
        this.scene.add(rackLight);

        const coolantGlow = new THREE.PointLight(0x0284C7, 1.4, 35);
        coolantGlow.position.set(16, 12, 6);
        this.scene.add(coolantGlow);

        // Build 42U Server Rack Enclosure
        this.buildServerRack();

        // Build 3 VM Server Blade Sleds
        this.buildVMBlades();

        // Build Host Physical RAM Reservoir Cylinder
        this.buildHostRamReservoir();

        this.setupResize();
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setCameraView(viewName) {
        if (viewName === "rack") {
            // Focus on 3 Server Blades
            this.cameraTargetPos.set(0, 9, 20);
            this.cameraLookPos.set(0, 9, 0);
        } else if (viewName === "coolant") {
            // Focus on Host RAM Coolant Reservoir
            this.cameraTargetPos.set(16, 11, 16);
            this.cameraLookPos.set(16, 9, 0);
        } else {
            // Overview Isometric
            this.cameraTargetPos.set(0, 22, 32);
            this.cameraLookPos.set(0, 8, 0);
        }
    }

    buildServerRack() {
        const rackGroup = new THREE.Group();

        // Heavy Steel 42U Server Rack Frame
        const frameGeo = new THREE.BoxGeometry(22, 18, 12);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0F172A,
            roughness: 0.7,
            metalness: 0.6
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 9;
        frame.castShadow = true;
        frame.receiveShadow = true;
        rackGroup.add(frame);

        // Rack Mounting Rails (Corner Posts)
        const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        [-9.8, 9.8].forEach(x => {
            [-5.5, 5.5].forEach(z => {
                const railGeo = new THREE.BoxGeometry(1.2, 17.8, 1.2);
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(x, 9, z);
                rackGroup.add(rail);
            });
        });

        // Datacenter Floor Tiles (Clean Pearl Gray)
        const floorGeo = new THREE.BoxGeometry(54, 1, 38);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.9, metalness: 0.05 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Floor Grid with High Contrast
        const grid = new THREE.GridHelper(50, 25, 0x94A3B8, 0xCBD5E1);
        grid.position.y = 0.02;
        this.scene.add(grid);

        this.scene.add(rackGroup);
    }

    buildVMBlades() {
        const vmConfigs = [
            { id: "vm101", name: "VM 101: Web Nginx", y: 13.5, color: 0x06B6D4 },
            { id: "vm102", name: "VM 102: DB Postgres", y: 9.0, color: 0x10B981 },
            { id: "vm103", name: "VM 103: AI Inference", y: 4.5, color: 0xF59E0B }
        ];

        vmConfigs.forEach(cfg => {
            const bladeGroup = new THREE.Group();

            // Blade Chassis Enclosure (2U Server Sled)
            const bladeGeo = new THREE.BoxGeometry(19, 3.2, 11);
            const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8, roughness: 0.3 });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.castShadow = true;
            bladeGroup.add(blade);

            // Front Perforated Faceplate
            const ledPanelGeo = new THREE.BoxGeometry(18.5, 2.7, 0.2);
            const ledPanelMat = new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.8 });
            const ledPanel = new THREE.Mesh(ledPanelGeo, ledPanelMat);
            ledPanel.position.z = 5.6;
            bladeGroup.add(ledPanel);

            // Drive Bay caddies (Hot-swap drives on left)
            const driveMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
            for (let d = 0; d < 4; d++) {
                const driveGeo = new THREE.BoxGeometry(1.6, 2.2, 0.3);
                const drive = new THREE.Mesh(driveGeo, driveMat);
                drive.position.set(-7.5 + (d * 1.8), 0, 5.7);
                bladeGroup.add(drive);
            }

            // RAM Level LED Meter (Dynamic scaling along X)
            const ramBarGeo = new THREE.BoxGeometry(7.5, 0.6, 0.2);
            const ramBarMat = new THREE.MeshBasicMaterial({ color: cfg.color });
            const ramBar = new THREE.Mesh(ramBarGeo, ramBarMat);
            ramBar.position.set(2.5, 0.3, 5.75);
            bladeGroup.add(ramBar);

            // Status Indicator LED
            const statusLedGeo = new THREE.SphereGeometry(0.28, 12, 12);
            const statusLedMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
            const statusLed = new THREE.Mesh(statusLedGeo, statusLedMat);
            statusLed.position.set(7.5, 0.3, 5.75);
            bladeGroup.add(statusLed);

            bladeGroup.position.set(0, cfg.y, 0);
            this.scene.add(bladeGroup);

            this.vms[cfg.id] = {
                group: bladeGroup,
                ramBar: ramBar,
                statusLed: statusLed,
                color: cfg.color
            };
        });
    }

    buildHostRamReservoir() {
        const resGroup = new THREE.Group();

        // Physical Host RAM Reservoir (Liquid Coolant Column)
        const cylinderGeo = new THREE.CylinderGeometry(2.4, 2.4, 16, 24);
        const cylinderMat = new THREE.MeshPhysicalMaterial({
            color: 0x38BDF8,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            transmission: 0.85,
            thickness: 0.8
        });
        const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
        cylinder.position.set(16, 9, 0);
        resGroup.add(cylinder);

        // Core RAM Liquid Level (Inside cylinder)
        const liquidGeo = new THREE.CylinderGeometry(2.2, 2.2, 15, 20);
        const liquidMat = new THREE.MeshStandardMaterial({
            color: 0x0284C7,
            emissive: 0x0284C7,
            emissiveIntensity: 0.8
        });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.position.set(16, 9, 0);
        resGroup.add(liquid);
        this.ramLiquid = liquid;

        // Metallic Base and Top Cap
        const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
        [-8, 8].forEach(offsetY => {
            const capGeo = new THREE.CylinderGeometry(2.7, 2.7, 0.8, 24);
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(16, 9 + offsetY, 0);
            resGroup.add(cap);
        });

        this.scene.add(resGroup);
    }

    updateVMDisplay(vmId, usedPct, isOOM) {
        const vm = this.vms[vmId];
        if (!vm) return;

        const scale = Math.max(0.05, Math.min(1.0, usedPct / 100));
        vm.ramBar.scale.x = scale;
        vm.ramBar.position.x = -1.25 + (3.75 * scale);

        if (isOOM) {
            vm.ramBar.material.color.setHex(0xEF4444);
            vm.statusLed.material.color.setHex(0xEF4444);
        } else if (usedPct > 85) {
            vm.ramBar.material.color.setHex(0xF59E0B);
            vm.statusLed.material.color.setHex(0xF59E0B);
        } else {
            vm.ramBar.material.color.setHex(vm.color);
            vm.statusLed.material.color.setHex(0x10B981);
        }
    }

    updateHostRamLevel(usedPct) {
        if (!this.ramLiquid) return;
        const scaleY = Math.max(0.05, Math.min(1.0, usedPct / 100));
        this.ramLiquid.scale.y = scaleY;

        if (usedPct > 90) {
            this.ramLiquid.material.color.setHex(0xEF4444);
            this.ramLiquid.material.emissive.setHex(0xEF4444);
        } else if (usedPct > 75) {
            this.ramLiquid.material.color.setHex(0xF59E0B);
            this.ramLiquid.material.emissive.setHex(0xF59E0B);
        } else {
            this.ramLiquid.material.color.setHex(0x0284C7);
            this.ramLiquid.material.emissive.setHex(0x0284C7);
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

        // Smooth Camera Transition towards target position
        this.camera.position.lerp(this.cameraTargetPos, 0.05);
        this.camera.lookAt(this.cameraLookPos);

        this.renderer.render(this.scene, this.camera);
    }
}

window.Memory3DWorld = Memory3DWorld;
