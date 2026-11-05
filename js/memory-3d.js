/**
 * Memory Overcommit Crisis - 3D Server Rack & Hypervisor Node Engine
 * Three.js WebGL Visualization of Proxmox/VMware Memory Ballooning & OOM Protection
 */

class Memory3DWorld {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.vms = {};

        this.init();
    }

    init() {
        if (!window.THREE) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x040711);
        this.scene.fog = new THREE.FogExp2(0x040711, 0.015);

        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
        this.camera.position.set(0, 22, 32);
        this.camera.lookAt(0, 4, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 0.6);
        this.scene.add(hemiLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 1.8, 40);
        pointLight.position.set(0, 15, 10);
        this.scene.add(pointLight);

        // Build Data Center Rack
        this.buildServerRack();

        // Build 3 VM Server Blades
        this.buildVMBlades();

        // Build Host Physical Memory Reservoir Tube
        this.buildHostRamReservoir();

        this.setupResize();
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    buildServerRack() {
        const rackGroup = new THREE.Group();

        // Outer Rack Frame (42U Server Rack)
        const frameGeo = new THREE.BoxGeometry(22, 18, 12);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.5,
            metalness: 0.8,
            wireframe: false
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 9;
        rackGroup.add(frame);

        // Glass Front Door
        const glassGeo = new THREE.BoxGeometry(20.5, 16.5, 0.2);
        const glassMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.15
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, 9, 6.1);
        rackGroup.add(glass);

        // Floor Grid
        const grid = new THREE.GridHelper(50, 25, 0x06b6d4, 0x1e293b);
        grid.position.y = 0.05;
        this.scene.add(grid);

        this.scene.add(rackGroup);
    }

    buildVMBlades() {
        const vmConfigs = [
            { id: "vm101", name: "VM 101: Web Nginx", y: 13.5, color: 0x06b6d4 },
            { id: "vm102", name: "VM 102: DB Postgres", y: 9.0, color: 0x10b981 },
            { id: "vm103", name: "VM 103: AI Inference", y: 4.5, color: 0xf59e0b }
        ];

        vmConfigs.forEach(cfg => {
            const bladeGroup = new THREE.Group();

            // Blade Chassis
            const bladeGeo = new THREE.BoxGeometry(19, 3.2, 11);
            const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            bladeGroup.add(blade);

            // Front LED Panel
            const ledPanelGeo = new THREE.BoxGeometry(18.5, 2.6, 0.2);
            const ledPanelMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
            const ledPanel = new THREE.Mesh(ledPanelGeo, ledPanelMat);
            ledPanel.position.z = 5.6;
            bladeGroup.add(ledPanel);

            // RAM Level LED Bar (Dynamic scaling along X)
            const ramBarGeo = new THREE.BoxGeometry(12, 0.8, 0.3);
            const ramBarMat = new THREE.MeshBasicMaterial({ color: cfg.color });
            const ramBar = new THREE.Mesh(ramBarGeo, ramBarMat);
            ramBar.position.set(-2, 0, 5.75);
            bladeGroup.add(ramBar);

            // Status Indicator LED
            const statusLedGeo = new THREE.SphereGeometry(0.35, 8, 8);
            const statusLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
            const statusLed = new THREE.Mesh(statusLedGeo, statusLedMat);
            statusLed.position.set(7.5, 0, 5.75);
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
        const cylinderGeo = new THREE.CylinderGeometry(2.5, 2.5, 16, 24);
        const cylinderMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.8
        });
        const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
        cylinder.position.set(16, 9, 0);
        resGroup.add(cylinder);

        // Core RAM Liquid Level (Inside cylinder)
        const liquidGeo = new THREE.CylinderGeometry(2.3, 2.3, 15, 20);
        const liquidMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x0284c7,
            emissiveIntensity: 0.8
        });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.position.set(16, 9, 0);
        resGroup.add(liquid);
        this.ramLiquid = liquid;

        this.scene.add(resGroup);
    }

    /**
     * Update VM Blade visual representation:
     * @param {string} vmId - 'vm101', 'vm102', 'vm103'
     * @param {number} usedPct - 0 to 100
     * @param {boolean} isOOM - Out of Memory state
     */
    updateVMDisplay(vmId, usedPct, isOOM) {
        const vm = this.vms[vmId];
        if (!vm) return;

        // Scale RAM LED bar
        const scale = Math.max(0.05, Math.min(1.0, usedPct / 100));
        vm.ramBar.scale.x = scale;
        vm.ramBar.position.x = -8 + (6 * scale);

        // Update colors
        if (isOOM) {
            vm.ramBar.material.color.setHex(0xf43f5e); // Red
            vm.statusLed.material.color.setHex(0xf43f5e);
        } else if (usedPct > 85) {
            vm.ramBar.material.color.setHex(0xf59e0b); // Amber Warning
            vm.statusLed.material.color.setHex(0xf59e0b);
        } else {
            vm.ramBar.material.color.setHex(vm.color); // Normal
            vm.statusLed.material.color.setHex(0x10b981);
        }
    }

    updateHostRamLevel(usedPct) {
        if (!this.ramLiquid) return;
        const scaleY = Math.max(0.05, Math.min(1.0, usedPct / 100));
        this.ramLiquid.scale.y = scaleY;

        if (usedPct > 90) {
            this.ramLiquid.material.color.setHex(0xf43f5e);
            this.ramLiquid.material.emissive.setHex(0xf43f5e);
        } else {
            this.ramLiquid.material.color.setHex(0x06b6d4);
            this.ramLiquid.material.emissive.setHex(0x0284c7);
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

        // Subtle camera rotation
        const time = this.clock.getElapsedTime();
        this.camera.position.x = Math.sin(time * 0.25) * 3;

        this.renderer.render(this.scene, this.camera);
    }
}

window.Memory3DWorld = Memory3DWorld;
