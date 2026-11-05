/**
 * Memory Overcommit Crisis - Game Simulation Logic
 * Proxmox VE / VMware ESXi Memory Ballooning, KSM, and OOM-Killer Defense
 */

class MemoryGameController {
    constructor() {
        this.sound = window.labSound;
        this.world = null;

        // Physical Host Specifications
        this.hostTotalRam = 16384; // 16 GB in MB
        this.swapTotal = 4096;     // 4 GB swap
        this.ksmActive = true;
        this.ksmSaved = 1800;      // MB saved via deduplication

        // 3 Virtual Machines Configuration
        this.vms = {
            vm101: {
                id: "vm101",
                name: "VM 101: Web Nginx",
                maxRam: 6144,      // 6 GB
                minRam: 1536,      // 1.5 GB
                balloonTarget: 4096,// Allocated by hypervisor
                workload: 1800,    // Current active memory demand
                isOOM: false,
                status: "running"
            },
            vm102: {
                id: "vm102",
                name: "VM 102: DB Postgres",
                maxRam: 10240,     // 10 GB
                minRam: 3072,      // 3 GB
                balloonTarget: 6144,
                workload: 3200,
                isOOM: false,
                status: "running"
            },
            vm103: {
                id: "vm103",
                name: "VM 103: AI Inference",
                maxRam: 14336,     // 14 GB
                minRam: 3584,      // 3.5 GB
                balloonTarget: 6144,
                workload: 3500,
                isOOM: false,
                status: "running"
            }
        };

        // Game State
        this.gameActive = false;
        this.wave = 1;
        this.maxWaves = 5;
        this.score = 0;
        this.timer = 15 * 60; // 15 minutes limit
        this.clockInterval = null;
        this.simInterval = null;
        this.hostHealth = 100;
        this.eventLog = [];

        this.init();
    }

    init() {
        this.world = new Memory3DWorld("viewport3d");
        this.bindControls();
        this.updateHUD();
    }

    startMission() {
        this.gameActive = true;
        this.wave = 1;
        this.score = 0;
        this.hostHealth = 100;
        this.timer = 15 * 60;
        this.eventLog = [];

        // Reset VMs
        Object.keys(this.vms).forEach(id => {
            this.vms[id].isOOM = false;
            this.vms[id].status = "running";
        });

        const startBtn = document.getElementById("startCrisisBtn");
        if (startBtn) {
            startBtn.innerText = "Simulasi Berjalan...";
            startBtn.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
            startBtn.classList.add("bg-teal-700", "text-white");
        }

        if (this.sound) {
            this.sound.startServerFan();
        }

        this.logEvent("HYPERVISOR", "Node proxmox-01 booted. 16 GB Physical RAM online.", "info");
        this.logEvent("MISSION", "Skenario 2: Memory Overcommit Crisis dimulai! Pertahankan node dari OOM.", "warning");

        this.applyWaveProfile(1);

        if (this.clockInterval) clearInterval(this.clockInterval);
        this.clockInterval = setInterval(() => this.tickClock(), 1000);

        if (this.simInterval) clearInterval(this.simInterval);
        this.simInterval = setInterval(() => this.simulateStep(), 1500);

        this.updateHUD();
    }

    tickClock() {
        if (!this.gameActive) return;
        this.timer--;
        if (this.timer <= 0) {
            this.completeMission(true);
        }
        this.updateClockDisplay();
    }

    applyWaveProfile(waveNum) {
        this.wave = waveNum;
        if (waveNum === 1) {
            this.logEvent("STRESS-NG", "Wave 1: Spike pengunjung e-commerce! VM 101 beban naik ke 4.5 GB.", "warning");
            this.vms.vm101.workload = 4600;
            this.vms.vm102.workload = 2800;
            this.vms.vm103.workload = 3200;
        } else if (waveNum === 2) {
            this.logEvent("STRESS-NG", "Wave 2: Query agregasi analytics besar! VM 102 beban melonjak ke 7.8 GB.", "warning");
            this.vms.vm101.workload = 3000;
            this.vms.vm102.workload = 7800;
            this.vms.vm103.workload = 3400;
        } else if (waveNum === 3) {
            this.logEvent("STRESS-NG", "Wave 3: Fine-tuning LoRA LLM dimulai! VM 103 beban melonjak ke 11.5 GB.", "warning");
            this.vms.vm101.workload = 2200;
            this.vms.vm102.workload = 4000;
            this.vms.vm103.workload = 11500;
        } else if (waveNum === 4) {
            this.logEvent("STRESS-NG", "Wave 4: Multi-tenant surge! VM 101 dan VM 102 melonjak serentak.", "warning");
            this.vms.vm101.workload = 5200;
            this.vms.vm102.workload = 8200;
            this.vms.vm103.workload = 6000;
        } else if (waveNum === 5) {
            this.logEvent("STRESS-NG", "Wave 5: ULTIMATE OVERCOMMIT! Total beban 28 GB pada Host 16 GB!", "alert");
            this.vms.vm101.workload = 5800;
            this.vms.vm102.workload = 9600;
            this.vms.vm103.workload = 13200;
        }
    }

    simulateStep() {
        if (!this.gameActive) return;

        // Calculate KSM savings
        let actualKsm = this.ksmActive ? this.ksmSaved : 0;

        // Calculate Total Host Physical RAM used
        let totalAllocated = 0;
        Object.keys(this.vms).forEach(id => {
            const vm = this.vms[id];
            if (vm.status === "running") {
                totalAllocated += vm.balloonTarget;
            }
        });

        let hostUsed = Math.max(0, totalAllocated - actualKsm);
        let hostCapacity = this.hostTotalRam + this.swapTotal;
        let hostRamPct = (hostUsed / this.hostTotalRam) * 100;

        // Check VM Under-Allocation (Workload > Balloon Allocation)
        Object.keys(this.vms).forEach(id => {
            const vm = this.vms[id];
            if (vm.status === "running") {
                if (vm.workload > vm.balloonTarget) {
                    // VM lacks memory!
                    const deficit = vm.workload - vm.balloonTarget;
                    if (deficit > 800) {
                        vm.isOOM = true;
                        vm.status = "crashed";
                        this.sound?.playOomAlert();
                        this.logEvent("OOM-KILLER", `${vm.name} CRASH: Out of Memory! Alokasi (${vm.balloonTarget} MB) < Beban (${vm.workload} MB)!`, "alert");
                        this.hostHealth = Math.max(0, this.hostHealth - 35);
                    } else {
                        this.logEvent("WARNING", `${vm.name} memory thrashing! Alokasikan lebih banyak RAM segera!`, "warning");
                    }
                } else {
                    vm.isOOM = false;
                }
            }
        });

        // Check Host Overcommit Exceeded
        if (hostUsed > hostCapacity) {
            this.sound?.playOomAlert();
            this.hostHealth = Math.max(0, this.hostHealth - 25);
            this.logEvent("HOST-PANIC", `KERNEL OOM-KILLER! Host RAM + Swap habis (${Math.round(hostUsed)} MB / ${hostCapacity} MB)!`, "alert");
        } else if (hostUsed > this.hostTotalRam) {
            this.logEvent("SWAP-ALERT", `Paging ke Swap aktif (${Math.round(hostUsed - this.hostTotalRam)} MB). Performa IO menurun.`, "warning");
        }

        // Host Health Check
        if (this.hostHealth <= 0) {
            this.completeMission(false);
            return;
        }

        // Score increment for surviving
        this.score += 25;

        // Check wave progression
        if (this.score % 250 === 0 && this.wave < this.maxWaves) {
            this.applyWaveProfile(this.wave + 1);
            this.sound?.playVictory();
        }

        // Update 3D World
        if (this.world) {
            Object.keys(this.vms).forEach(id => {
                const vm = this.vms[id];
                const pct = Math.min(100, (vm.workload / vm.maxRam) * 100);
                this.world.updateVMDisplay(id, pct, vm.isOOM);
            });
            this.world.updateHostRamLevel(Math.min(100, hostRamPct));
        }

        this.updateHUD();
    }

    setVMBalloon(vmId, targetMb) {
        const vm = this.vms[vmId];
        if (!vm) return;
        vm.balloonTarget = Math.max(vm.minRam, Math.min(vm.maxRam, targetMb));
        this.sound?.playBalloonHiss();
        this.logEvent("BALLOON", `virtio-balloon set ${vm.name} target ke ${vm.balloonTarget} MB.`, "info");
        this.updateHUD();
    }

    toggleKSM() {
        this.ksmActive = !this.ksmActive;
        this.logEvent("KSM", `Kernel Samepage Merging ${this.ksmActive ? "DIAKTIFKAN (Hemat ~1.8 GB)" : "DINONAKTIFKAN"}.`, "info");
        this.updateHUD();
    }

    setSwap(swapMb) {
        this.swapTotal = swapMb;
        this.logEvent("SWAP", `ZRAM / Swap diatur ke ${swapMb} MB.`, "info");
        this.updateHUD();
    }

    restartVM(vmId) {
        const vm = this.vms[vmId];
        if (!vm) return;
        vm.status = "running";
        vm.isOOM = false;
        vm.balloonTarget = Math.max(vm.balloonTarget, vm.workload);
        this.logEvent("HYPERVISOR", `${vm.name} direstart. Guest OS kembali online.`, "info");
        this.updateHUD();
    }

    logEvent(source, msg, type = "info") {
        const timeStr = new Date().toTimeString().split(" ")[0];
        this.eventLog.unshift({ time: timeStr, source, msg, type });
        if (this.eventLog.length > 50) this.eventLog.pop();
        this.renderEventLog();
    }

    renderEventLog() {
        const container = document.getElementById("hypervisorLog");
        if (!container) return;
        container.innerHTML = this.eventLog.slice(0, 15).map(e => {
            let color = "#38bdf8";
            if (e.type === "alert") color = "#f43f5e";
            if (e.type === "warning") color = "#f59e0b";
            return `<div style="margin-bottom: 4px; font-size: 11px; line-height: 1.4;">
                <span style="color: #64748b;">[${e.time}]</span>
                <span style="color: ${color}; font-weight: bold;">[${e.source}]</span>
                <span style="color: #e2e8f0;">${e.msg}</span>
            </div>`;
        }).join("");
    }

    updateHUD() {
        let totalAllocated = 0;
        let totalWorkload = 0;
        Object.keys(this.vms).forEach(id => {
            const vm = this.vms[id];
            if (vm.status === "running") {
                totalAllocated += vm.balloonTarget;
                totalWorkload += vm.workload;
            }
        });

        const actualKsm = this.ksmActive ? this.ksmSaved : 0;
        const hostUsed = Math.max(0, totalAllocated - actualKsm);
        const hostPct = Math.min(100, Math.round((hostUsed / this.hostTotalRam) * 100));

        // Update DOM elements if present
        const elHostUsed = document.getElementById("hostRamUsed");
        if (elHostUsed) elHostUsed.innerText = `${(hostUsed / 1024).toFixed(2)} GB / 16.00 GB (${hostPct}%)`;

        const elHostBar = document.getElementById("hostRamBar");
        if (elHostBar) {
            elHostBar.style.width = `${hostPct}%`;
            elHostBar.style.backgroundColor = hostPct > 90 ? "#f43f5e" : (hostPct > 75 ? "#f59e0b" : "#06b6d4");
        }

        const elScore = document.getElementById("crisisScore");
        if (elScore) elScore.innerText = this.score;

        const elWave = document.getElementById("crisisWave");
        if (elWave) elWave.innerText = `Wave ${this.wave} / ${this.maxWaves}`;

        const elHealth = document.getElementById("hostHealthBar");
        if (elHealth) {
            elHealth.style.width = `${this.hostHealth}%`;
            elHealth.style.backgroundColor = this.hostHealth > 50 ? "#10b981" : "#f43f5e";
        }

        // Update each VM controls
        Object.keys(this.vms).forEach(id => {
            const vm = this.vms[id];
            const slider = document.getElementById(`slider-${id}`);
            const label = document.getElementById(`label-${id}`);
            const demand = document.getElementById(`demand-${id}`);
            const card = document.getElementById(`card-${id}`);

            if (slider && document.activeElement !== slider) slider.value = vm.balloonTarget;
            if (label) label.innerText = `${(vm.balloonTarget / 1024).toFixed(1)} GB`;
            if (demand) demand.innerText = `${(vm.workload / 1024).toFixed(1)} GB`;

            if (card) {
                if (vm.status === "crashed") {
                    card.style.borderColor = "#f43f5e";
                    card.style.boxShadow = "0 0 15px rgba(244, 63, 94, 0.4)";
                } else if (vm.workload > vm.balloonTarget) {
                    card.style.borderColor = "#f59e0b";
                    card.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.3)";
                } else {
                    card.style.borderColor = "#334155";
                    card.style.boxShadow = "none";
                }
            }
        });
    }

    updateClockDisplay() {
        const el = document.getElementById("crisisTimer");
        if (!el) return;
        const mins = Math.floor(this.timer / 60);
        const secs = this.timer % 60;
        el.innerText = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    completeMission(victory) {
        this.gameActive = false;
        clearInterval(this.clockInterval);
        clearInterval(this.simInterval);

        if (victory) {
            this.sound?.playVictory();
            this.logEvent("MISSION", `MISI SELESAI! Anda berhasil menahan krisis memory overcommit! Skor Akhir: ${this.score}`, "info");
            this.saveLeaderboard(this.score);
            alert(`SELAMAT! Anda berhasil mempertahankan node Proxmox dari Memory Overcommit Crisis!\nSkor Akhir: ${this.score}\nSemua VM berhasil survive tanpa Kernel Panic!`);
        } else {
            this.sound?.playOomAlert();
            this.logEvent("MISSION", "GAME OVER! Node Host mengalami Kernel Panic OOM Crash.", "alert");
            alert("GAME OVER! Node Hypervisor mengalami Kernel Panic OOM karena overcommit memori tidak terkontrol.");
        }
    }

    saveLeaderboard(finalScore) {
        const studentName = localStorage.getItem("itlab_student_name") || "Mahasiswa IT";
        const entry = {
            name: studentName,
            score: finalScore,
            scenario: "Memory Overcommit Crisis",
            timestamp: new Date().toISOString()
        };

        let scores = JSON.parse(localStorage.getItem("itlab_scores_memory") || "[]");
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem("itlab_scores_memory", JSON.stringify(scores.slice(0, 10)));
    }

    bindControls() {
        // Slider listeners
        ["vm101", "vm102", "vm103"].forEach(id => {
            const slider = document.getElementById(`slider-${id}`);
            if (slider) {
                slider.addEventListener("input", (e) => {
                    this.setVMBalloon(id, parseInt(e.target.value, 10));
                });
            }

            const restartBtn = document.getElementById(`restart-${id}`);
            if (restartBtn) {
                restartBtn.addEventListener("click", () => {
                    this.restartVM(id);
                });
            }
        });

        // KSM Toggle
        const ksmToggle = document.getElementById("ksmToggle");
        if (ksmToggle) {
            ksmToggle.addEventListener("change", (e) => {
                this.ksmActive = e.target.checked;
                this.toggleKSM();
            });
        }

        // Swap Slider
        const swapSlider = document.getElementById("swapSlider");
        if (swapSlider) {
            swapSlider.addEventListener("input", (e) => {
                this.setSwap(parseInt(e.target.value, 10));
            });
        }

        // Start Button
        const startBtn = document.getElementById("startCrisisBtn");
        if (startBtn) {
            startBtn.addEventListener("click", () => this.startMission());
        }

        // Mute Button
        const muteBtn = document.getElementById("muteBtn");
        if (muteBtn) {
            muteBtn.addEventListener("click", () => {
                const isMuted = this.sound?.toggleMute();
                muteBtn.innerText = isMuted ? "Audio: OFF" : "Audio: ON";
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.labSound = new LabSoundEngine();
    window.memoryGame = new MemoryGameController();
});
