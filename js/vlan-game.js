/**
 * VLAN Defense - Game Controller & Cisco IOS Command Line Interpreter (CLI)
 * Educational Cisco Switching & 802.1Q VLAN Tagging Simulator
 */

class VlanGameController {
    constructor() {
        this.sound = window.labSound;
        this.world = null;

        // Switch State Database
        this.vlans = {
            1: { name: "default", status: "active", ports: ["fa0/5", "fa0/6", "fa0/7", "fa0/8"] }
        };

        this.ports = {
            "fa0/1": { mode: "access", vlan: 1, shutdown: false },
            "fa0/2": { mode: "access", vlan: 1, shutdown: false },
            "fa0/3": { mode: "access", vlan: 1, shutdown: false },
            "fa0/4": { mode: "access", vlan: 1, shutdown: false },
            "fa0/10": { mode: "access", vlan: 1, shutdown: false },
            "fa0/11": { mode: "access", vlan: 1, shutdown: false },
            "fa0/12": { mode: "access", vlan: 1, shutdown: false },
            "gi0/1": { mode: "access", vlan: 1, allowedVlans: [1], shutdown: false }
        };

        // Game Stats
        this.switchHP = 100;
        this.score = 0;
        this.wave = 1;
        this.maxWaves = 5;
        this.packetsDelivered = 0;
        this.packetsLeaked = 0;
        this.timer = 15 * 60; // 15 minutes limit
        this.gameActive = false;
        this.spawnTimer = null;
        this.clockTimer = null;

        // CLI State
        this.cliMode = "user"; // user ('Switch>'), priv ('Switch#'), config ('Switch(config)#'), iface ('Switch(config-if)#')
        this.currentInterface = null;
        this.lastConfigVlan = null;
        this.commandHistory = [];
        this.historyIndex = -1;

        this.init();
    }

    init() {
        this.world = new Vlan3DWorld("viewport3d");
        this.bindCLI();
        this.bindControls();
        this.updateHUD();
    }

    startMission() {
        this.gameActive = true;
        this.switchHP = 100;
        this.score = 0;
        this.packetsDelivered = 0;
        this.packetsLeaked = 0;
        this.timer = 15 * 60;

        const startBtn = document.getElementById("startMissionBtn");
        if (startBtn) {
            startBtn.innerText = "Misi Berjalan...";
            startBtn.classList.remove("bg-cyan-600", "hover:bg-cyan-500");
            startBtn.classList.add("bg-emerald-600", "text-white");
        }

        if (this.clockTimer) clearInterval(this.clockTimer);
        this.clockTimer = setInterval(() => {
            if (!this.gameActive) return;
            this.timer--;
            this.updateHUD();
            if (this.timer <= 0) {
                this.endGame(true);
            }
        }, 1000);

        if (this.spawnTimer) clearInterval(this.spawnTimer);
        this.spawnTimer = setInterval(() => this.spawnTrafficPacket(), 2400);

        if (this.sound) this.sound.playVlanMatch();
        this.printToCLI("⚡ MISI DIAKTIFKAN: Aliran paket dimulai! Konfigurasikan VLAN port segera!");
    }

    spawnTrafficPacket() {
        if (!this.gameActive || !this.world) return;

        const rand = Math.random();
        if (rand < 0.4) {
            // Client A generates VLAN 10 traffic
            this.world.spawnPacket("clientA", 10);
            if (this.sound) this.sound.playPacketZap();
        } else if (rand < 0.75) {
            // Client B generates VLAN 20 traffic
            this.world.spawnPacket("clientB", 20);
            if (this.sound) this.sound.playPacketZap();
        } else {
            // Rogue intruder sends untagged / spoofed packet through Fa0/4!
            this.world.spawnPacket("attacker", 1, true);
        }
    }

    evaluatePacketEntry(packet) {
        let inputPort = "fa0/1";
        if (packet.startZ === 0) inputPort = "fa0/2";
        else if (packet.startZ === 12) inputPort = "fa0/3";
        else if (packet.startZ === 6) inputPort = "fa0/4";

        const portConf = this.ports[inputPort];
        if (!portConf) return true;

        if (portConf.shutdown) {
            this.spawnFloatingZap("PORT DOWN - DROPPED", "#94a3b8");
            return false;
        }

        if (packet.isRogue) {
            if (portConf.vlan === 1 && !portConf.shutdown) {
                this.handlePacketLeak("⚠️ Rogue Packet Meretas Switch via Fa0/4 (Default VLAN 1)!");
                return true;
            } else {
                this.score += 50;
                this.spawnFloatingZap("+50 ROGUE BLOCKED", "#10b981");
                return false;
            }
        }

        if (portConf.mode === "access") {
            if (portConf.vlan === packet.vlanTag) {
                return true;
            } else {
                this.handlePacketLeak(`VLAN Mismatch di ${inputPort.toUpperCase()}! Paket VLAN ${packet.vlanTag} ditolak.`);
                return false;
            }
        }

        return true;
    }

    handlePacketDelivered(packet) {
        let outPort = "fa0/10";
        if (packet.targetZ === 0) outPort = "fa0/11";
        else if (packet.targetZ === 12) outPort = "fa0/12";

        const destConf = this.ports[outPort];
        if (!destConf) return;

        if (destConf.vlan === packet.vlanTag) {
            this.packetsDelivered++;
            this.score += 100;
            if (this.sound) this.sound.playVlanMatch();
            this.spawnFloatingZap("+100 DELIVERED", "#06b6d4");
        } else {
            this.handlePacketLeak(`DATA LEAK: Paket VLAN ${packet.vlanTag} bocor ke server port ${outPort.toUpperCase()}!`);
        }

        this.updateHUD();
    }

    handlePacketLeak(reason) {
        this.packetsLeaked++;
        this.switchHP = Math.max(0, this.switchHP - 15);
        if (this.sound) this.sound.playOomAlert();
        this.spawnFloatingZap("-15% BUFFER LEAK", "#f43f5e");
        this.printToCLI(`[ALERT] ${reason}`);
        this.updateHUD();

        if (this.switchHP <= 0) {
            this.endGame(false);
        }
    }

    spawnFloatingZap(text, color) {
        const el = document.createElement("div");
        el.className = "floating-zap";
        el.style.position = "fixed";
        el.style.left = "50%";
        el.style.top = "25%";
        el.style.transform = "translate(-50%, -50%)";
        el.style.color = color;
        el.style.fontSize = "18px";
        el.style.fontFamily = "'JetBrains Mono', monospace";
        el.style.fontWeight = "bold";
        el.style.textShadow = `0 0 10px ${color}`;
        el.style.zIndex = "9999";
        el.style.pointerEvents = "none";
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    updateHUD() {
        const hpBar = document.getElementById("switchHealthBar");
        const hpText = document.getElementById("switchHPText");
        if (hpBar) {
            hpBar.style.width = `${this.switchHP}%`;
            hpBar.style.backgroundColor = this.switchHP > 50 ? "#10b981" : (this.switchHP > 25 ? "#f59e0b" : "#f43f5e");
        }
        if (hpText) {
            hpText.innerText = `${this.switchHP}%`;
            hpText.style.color = this.switchHP > 50 ? "#10b981" : (this.switchHP > 25 ? "#f59e0b" : "#f43f5e");
        }

        const scoreEl = document.getElementById("vlanScore");
        if (scoreEl) scoreEl.innerText = this.score;

        const waveEl = document.getElementById("vlanWave");
        if (waveEl) waveEl.innerText = `Wave ${this.wave} / ${this.maxWaves}`;

        const delivEl = document.getElementById("statDelivered");
        if (delivEl) delivEl.innerText = this.packetsDelivered;

        const leakEl = document.getElementById("statLeaked");
        if (leakEl) leakEl.innerText = this.packetsLeaked;

        const timerEl = document.getElementById("vlanTimer");
        if (timerEl) {
            const m = Math.floor(this.timer / 60).toString().padStart(2, "0");
            const s = (this.timer % 60).toString().padStart(2, "0");
            timerEl.innerText = `${m}:${s}`;
        }
    }

    endGame(isWin) {
        this.gameActive = false;
        clearInterval(this.spawnTimer);
        clearInterval(this.clockTimer);

        const startBtn = document.getElementById("startMissionBtn");
        if (startBtn) {
            startBtn.innerText = "Mulai Ulang";
            startBtn.className = "pointer-events-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-lg transition-all";
        }

        if (isWin) {
            if (this.sound) this.sound.playVictory();
            this.saveLeaderboard(this.score);
            alert(`🎉 SELAMAT! Praktikum VLAN Selesai dengan Sukses!\nSkor Akhir: ${this.score}\nPaket Terkirim: ${this.packetsDelivered}\nPaket Bocor: ${this.packetsLeaked}`);
        } else {
            alert(`💥 SWITCH BUFFER OVERFLOW!\nCore Switch mengalami kebocoran data berlebih.\nPeriksa konfigurasi Access Port & 802.1Q Trunk lalu coba lagi!`);
        }
    }

    saveLeaderboard(finalScore) {
        const studentName = localStorage.getItem("itlab_student_name") || "Mahasiswa IT";
        const entry = {
            name: studentName,
            score: finalScore,
            scenario: "VLAN Tower Defense",
            timestamp: new Date().toISOString()
        };

        let scores = JSON.parse(localStorage.getItem("itlab_scores_vlan") || "[]");
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem("itlab_scores_vlan", JSON.stringify(scores.slice(0, 10)));
    }

    // =========================================================================
    // CISCO IOS COMMAND LINE INTERPRETER (CLI)
    // =========================================================================
    bindCLI() {
        const cliInput = document.getElementById("cliInput") || document.getElementById("cli-input-field");
        if (!cliInput) return;

        this.updatePrompt();

        cliInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const cmd = cliInput.value.trim();
                cliInput.value = "";
                if (cmd) {
                    this.executeCLICommand(cmd);
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    cliInput.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    cliInput.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    cliInput.value = "";
                }
            }
        });
    }

    updatePrompt() {
        const promptEl = document.getElementById("cliPrompt") || document.getElementById("cli-prompt-label");
        if (!promptEl) return;

        if (this.cliMode === "user") promptEl.textContent = "Switch>";
        else if (this.cliMode === "priv") promptEl.textContent = "Switch#";
        else if (this.cliMode === "config") promptEl.textContent = "Switch(config)#";
        else if (this.cliMode === "iface") promptEl.textContent = "Switch(config-if)#";
    }

    printToCLI(text) {
        const cliOutput = document.getElementById("cliOutput") || document.getElementById("cli-output");
        if (!cliOutput) return;

        const line = document.createElement("div");
        line.className = "py-0.5 whitespace-pre-wrap leading-relaxed";
        line.textContent = text;
        cliOutput.appendChild(line);
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }

    executeCLICommand(cmd) {
        if (!cmd) return;
        cmd = cmd.trim();
        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;

        if (this.sound) this.sound.playKeyClick();
        const promptEl = document.getElementById("cliPrompt") || document.getElementById("cli-prompt-label");
        const fullPrompt = promptEl ? promptEl.textContent : "Switch>";
        this.printToCLI(`${fullPrompt} ${cmd}`);

        const lower = cmd.toLowerCase().trim();
        const parts = lower.split(/\s+/);
        const root = parts[0];

        // Global Navigation Commands
        if (root === "exit") {
            if (this.cliMode === "iface") this.cliMode = "config";
            else if (this.cliMode === "config") this.cliMode = "priv";
            else if (this.cliMode === "priv") this.cliMode = "user";
            this.updatePrompt();
            return;
        }

        if (root === "end") {
            this.cliMode = "priv";
            this.updatePrompt();
            return;
        }

        if (root === "help" || root === "?") {
            this.printToCLI("Perintah Cisco IOS Tersedia:\n- enable (masuk privileged mode)\n- configure terminal (masuk global config)\n- vlan <id> (contoh: vlan 10, vlan 20)\n- name <nama> (contoh: name Finance)\n- interface <fa0/1..fa0/12 | gi0/1>\n- switchport mode access / switchport mode trunk\n- switchport access vlan <id>\n- shutdown / no shutdown\n- show vlan brief (atau: do show vlan brief)\n- show interfaces status");
            return;
        }

        // Show commands available across any mode using "do show ..." or normal "show ..."
        if (lower.includes("show vlan") || lower.includes("sh vlan")) {
            this.showVlanBrief();
            return;
        }

        if (lower.includes("show int") || lower.includes("sh int")) {
            this.showInterfacesStatus();
            return;
        }

        // Auto transition convenience: if student clicks "conf t" while in user mode, auto elevate!
        if ((lower === "conf t" || lower.startsWith("configure")) && this.cliMode === "user") {
            this.cliMode = "config";
            this.updatePrompt();
            this.printToCLI("Enter configuration commands, one per line. End with CNTL/Z.");
            return;
        }

        // User Mode
        if (this.cliMode === "user") {
            if (root === "enable" || root === "en") {
                this.cliMode = "priv";
                this.updatePrompt();
                return;
            }
            this.printToCLI(`% Perintah tidak valid dalam User Mode. Ketik "enable" terlebih dahulu.`);
            return;
        }

        // Privileged Mode
        if (this.cliMode === "priv") {
            if (cmd.startsWith("conf") || lower === "configure terminal" || lower === "conf t") {
                this.cliMode = "config";
                this.updatePrompt();
                this.printToCLI("Enter configuration commands, one per line. End with CNTL/Z.");
                return;
            }
        }

        // Global Configuration Mode
        if (this.cliMode === "config") {
            if (root === "vlan") {
                const vlanId = parseInt(parts[1], 10);
                if (!isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094) {
                    if (!this.vlans[vlanId]) {
                        this.vlans[vlanId] = { name: `VLAN00${vlanId}`, status: "active", ports: [] };
                    }
                    this.lastConfigVlan = vlanId;
                    this.printToCLI(`VLAN ${vlanId} created/configured.`);
                    return;
                }
            }

            if (root === "name" && this.lastConfigVlan) {
                const name = parts.slice(1).join(" ").toUpperCase();
                this.vlans[this.lastConfigVlan].name = name;
                this.printToCLI(`VLAN ${this.lastConfigVlan} renamed to ${name}`);
                return;
            }

            if (root === "interface" || root === "int") {
                let ifaceName = parts[1];
                if (!ifaceName && parts.length > 2) ifaceName = parts[2];
                if (ifaceName && this.ports[ifaceName.toLowerCase()]) {
                    this.currentInterface = ifaceName.toLowerCase();
                    this.cliMode = "iface";
                    this.updatePrompt();
                    return;
                } else {
                    this.printToCLI(`% Invalid interface "${ifaceName}". Port tersedia: fa0/1 - fa0/4, fa0/10 - fa0/12, gi0/1`);
                    return;
                }
            }
        }

        // Interface Configuration Mode
        if (this.cliMode === "iface" && this.currentInterface) {
            const iface = this.currentInterface;

            if (lower === "shutdown") {
                this.ports[iface].shutdown = true;
                this.printToCLI(`%LINK-5-CHANGED: Interface ${iface.toUpperCase()}, changed state to administratively down`);
                if (this.world) this.world.updatePortConfiguration(iface, "access", 1);
                return;
            }

            if (lower === "no shutdown") {
                this.ports[iface].shutdown = false;
                this.printToCLI(`%LINK-3-UPDOWN: Interface ${iface.toUpperCase()}, changed state to up`);
                return;
            }

            // switchport mode access (or sw mode access, sw mo ac)
            if (lower.includes("mode access") || lower.includes("mo ac") || lower.includes("mode acc")) {
                this.ports[iface].mode = "access";
                this.printToCLI(`Port ${iface.toUpperCase()} set to ACCESS mode.`);
                if (this.world) this.world.updatePortConfiguration(iface, "access", this.ports[iface].vlan);
                return;
            }

            // switchport mode trunk (or sw mode trunk, sw mo tr)
            if (lower.includes("mode trunk") || lower.includes("mo tr")) {
                this.ports[iface].mode = "trunk";
                this.printToCLI(`Port ${iface.toUpperCase()} set to TRUNK mode with 802.1Q encapsulation.`);
                if (this.world) this.world.updatePortConfiguration(iface, "trunk", 1);
                return;
            }

            // switchport access vlan <id> (or sw acc vlan, sw acc vl, etc.)
            if (lower.includes("access vlan") || lower.includes("acc vlan") || lower.includes("acc vl")) {
                const lastToken = parts[parts.length - 1];
                const vlanId = parseInt(lastToken, 10);
                if (!isNaN(vlanId)) {
                    this.ports[iface].vlan = vlanId;
                    this.printToCLI(`Port ${iface.toUpperCase()} assigned to VLAN ${vlanId}.`);
                    if (this.world) this.world.updatePortConfiguration(iface, "access", vlanId);
                    return;
                }
            }

            // switch interface while inside iface mode
            if (root === "interface" || root === "int") {
                let ifaceName = parts[1];
                if (ifaceName && this.ports[ifaceName.toLowerCase()]) {
                    this.currentInterface = ifaceName.toLowerCase();
                    this.cliMode = "iface";
                    this.updatePrompt();
                    return;
                }
            }
        }

        this.printToCLI(`% Unknown or incomplete command: "${cmd}". Ketik "help" untuk panduan.`);
    }

    showVlanBrief() {
        this.printToCLI("VLAN Name                             Status    Ports");
        this.printToCLI("---- -------------------------------- --------- -------------------------------");
        this.printToCLI("1    default                          active    Fa0/5, Fa0/6, Fa0/7, Fa0/8");
        for (let [vId, v] of Object.entries(this.vlans)) {
            if (vId === "1") continue;
            const assignedPorts = Object.entries(this.ports)
                .filter(([pName, pConf]) => pConf.mode === "access" && pConf.vlan === parseInt(vId, 10))
                .map(([pName]) => pName.toUpperCase())
                .join(", ") || "none";
            this.printToCLI(`${vId.padEnd(5)} ${(v.name || "").padEnd(32)} active    ${assignedPorts}`);
        }
    }

    showInterfacesStatus() {
        this.printToCLI("Port      Name               Status       Vlan       Duplex  Speed Type");
        for (let [pName, pConf] of Object.entries(this.ports)) {
            const status = pConf.shutdown ? "disabled" : "connected";
            const vlanStr = pConf.mode === "trunk" ? "trunk" : pConf.vlan.toString();
            this.printToCLI(`${pName.toUpperCase().padEnd(9)} --                 ${status.padEnd(12)} ${vlanStr.padEnd(10)} full    100M  10/100BaseTX`);
        }
    }

    bindControls() {
        const btnStart = document.getElementById("startMissionBtn") || document.getElementById("btn-start-vlan");
        if (btnStart) {
            btnStart.addEventListener("click", () => this.startMission());
        }

        const muteBtn = document.getElementById("muteBtn");
        if (muteBtn) {
            muteBtn.addEventListener("click", () => {
                const isMuted = this.sound ? this.sound.toggleMute() : false;
                muteBtn.innerText = isMuted ? "Audio: OFF" : "Audio: ON";
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.labSound = new LabSoundEngine();
    window.vlanGame = new VlanGameController();
});
