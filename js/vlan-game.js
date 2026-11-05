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
            "gi0/1": { mode: "access", vlan: 1, allowedVlans: [], shutdown: false }
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

        if (this.clockTimer) clearInterval(this.clockTimer);
        this.clockTimer = setInterval(() => {
            this.timer--;
            this.updateHUD();
            if (this.timer <= 0) {
                this.endGame(true);
            }
        }, 1000);

        if (this.spawnTimer) clearInterval(this.spawnTimer);
        this.spawnTimer = setInterval(() => this.spawnTrafficPacket(), 2200);

        const banner = document.getElementById("mission-banner");
        if (banner) banner.classList.remove("hidden");
        if (this.sound) this.sound.playVlanMatch();
        this.printToCLI("⚡ MISI DIMULAI: Konfigurasi VLAN 10 (Finance), 20 (Engineering), dan 30 (Guest) agar paket tidak bocor!");
    }

    spawnTrafficPacket() {
        if (!this.gameActive || !this.world) return;

        const rand = Math.random();
        if (rand < 0.35) {
            // Client A generates VLAN 10 traffic
            this.world.spawnPacket("clientA", 10);
            if (this.sound) this.sound.playPacketZap();
        } else if (rand < 0.65) {
            // Client B generates VLAN 20 traffic
            this.world.spawnPacket("clientB", 20);
            if (this.sound) this.sound.playPacketZap();
        } else if (rand < 0.85) {
            // Client C generates VLAN 30 traffic
            this.world.spawnPacket("clientC", 30);
            if (this.sound) this.sound.playPacketZap();
        } else {
            // Rogue intruder sends untagged / spoofed packet through Fa0/4!
            this.world.spawnPacket("attacker", 1, true);
        }
    }

    /**
     * Evaluate whether packet is allowed through input port
     */
    evaluatePacketEntry(packet) {
        let inputPort = "fa0/1";
        if (packet.startZ === 0) inputPort = "fa0/2";
        else if (packet.startZ === 12) inputPort = "fa0/3";
        else if (packet.startZ === 6) inputPort = "fa0/4";

        const portConf = this.ports[inputPort];

        // Check if port is shutdown
        if (portConf.shutdown) {
            this.spawnFloatingZap("PORT DOWN - DROPPED", "#94a3b8");
            return false;
        }

        // Check Rogue packet
        if (packet.isRogue) {
            if (portConf.vlan === 1 && !portConf.shutdown) {
                // Rogue packet leaked into default VLAN 1!
                this.handlePacketLeak("⚠️ Rogue Packet Meretas Switch via Fa0/4 (Default VLAN 1)!");
                return true;
            } else {
                // Student secured port!
                this.score += 50;
                this.spawnFloatingZap("+50 ROGUE BLOCKED", "#10b981");
                return false;
            }
        }

        // Check Access VLAN Match
        if (portConf.mode === "access") {
            if (portConf.vlan === packet.vlanTag) {
                // Match! Tag accepted
                return true;
            } else {
                // VLAN mismatch (e.g. packet 10 entering port assigned to vlan 1)
                this.handlePacketLeak(`VLAN Mismatch di ${inputPort.toUpperCase()}! Paket VLAN ${packet.vlanTag} tidak diizinkan.`);
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

        if (destConf.vlan === packet.vlanTag) {
            // Data successfully delivered to designated VLAN server!
            this.packetsDelivered++;
            this.score += 100;
            if (this.sound) this.sound.playVlanMatch();
            this.spawnFloatingZap("+100 DATA DELIVERED", "#06b6d4");
        } else {
            // Leak: delivered to wrong department server!
            this.handlePacketLeak(`DATA LEAK: Paket VLAN ${packet.vlanTag} terkirim ke Server yang salah (${outPort})!`);
        }

        this.updateHUD();
    }

    handlePacketLeak(reason) {
        this.packetsLeaked++;
        this.switchHP = Math.max(0, this.switchHP - 15);
        if (this.sound) this.sound.playPacketLeakAlert();
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
        el.style.left = "50%";
        el.style.top = "30%";
        el.style.color = color;
        el.textContent = text;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    updateHUD() {
        const hpEl = document.getElementById("hud-switch-hp");
        const hpBar = document.getElementById("hud-switch-bar");
        if (hpEl) hpEl.textContent = `${this.switchHP}%`;
        if (hpBar) {
            hpBar.style.width = `${this.switchHP}%`;
            hpBar.className = `h-full transition-all duration-300 ${this.switchHP > 50 ? 'bg-cyan-400' : 'bg-rose-500'}`;
        }

        const scoreEl = document.getElementById("hud-score");
        if (scoreEl) scoreEl.textContent = this.score;

        const deliveredEl = document.getElementById("hud-delivered");
        if (deliveredEl) deliveredEl.textContent = this.packetsDelivered;

        const leakedEl = document.getElementById("hud-leaked");
        if (leakedEl) leakedEl.textContent = this.packetsLeaked;

        const timerEl = document.getElementById("hud-timer");
        if (timerEl) {
            const m = Math.floor(this.timer / 60).toString().padStart(2, "0");
            const s = (this.timer % 60).toString().padStart(2, "0");
            timerEl.textContent = `${m}:${s}`;
        }
    }

    endGame(isWin) {
        this.gameActive = false;
        clearInterval(this.spawnTimer);
        clearInterval(this.clockTimer);

        if (isWin) {
            if (this.sound) this.sound.playSuccessChime();
            alert(`🎉 SELAMAT! Praktikum VLAN Selesai dengan Sukses!\nSkor Akhir: ${this.score}\nPaket Terkirim: ${this.packetsDelivered}`);
        } else {
            alert(`💥 SWITCH BUFFER OVERFLOW / DATA BREACH!\nSwitch Core mengalami kebocoran data jaringan melebihi batas.\nSilakan periksa konfigurasi VLAN dan coba lagi.`);
        }
    }

    // =========================================================================
    // CISCO IOS COMMAND LINE INTERPRETER (CLI)
    // =========================================================================
    bindCLI() {
        const cliInput = document.getElementById("cli-input-field");
        const cliPrompt = document.getElementById("cli-prompt-label");
        const cliOutput = document.getElementById("cli-output");

        if (!cliInput) return;

        this.updatePrompt();

        cliInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const cmd = cliInput.value.trim();
                cliInput.value = "";
                if (cmd) {
                    this.commandHistory.push(cmd);
                    this.historyIndex = this.commandHistory.length;
                    this.executeCommand(cmd);
                }
            } else if (e.key === "ArrowUp") {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    cliInput.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === "ArrowDown") {
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
        const promptEl = document.getElementById("cli-prompt-label");
        if (!promptEl) return;

        if (this.cliMode === "user") promptEl.textContent = "Switch>";
        else if (this.cliMode === "priv") promptEl.textContent = "Switch#";
        else if (this.cliMode === "config") promptEl.textContent = "Switch(config)#";
        else if (this.cliMode === "iface") promptEl.textContent = `Switch(config-if)#`;
    }

    printToCLI(text) {
        const cliOutput = document.getElementById("cli-output");
        if (!cliOutput) return;

        const line = document.createElement("div");
        line.className = "py-0.5 whitespace-pre-wrap leading-relaxed";
        line.textContent = text;
        cliOutput.appendChild(line);
        cliOutput.scrollTop = cliOutput.scrollHeight;
    }

    executeCommand(cmd) {
        if (this.sound) this.sound.playKeyClick();
        const fullPrompt = document.getElementById("cli-prompt-label").textContent;
        this.printToCLI(`${fullPrompt} ${cmd}`);

        const parts = cmd.toLowerCase().split(/\s+/);
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
            this.printToCLI("Perintah Tersedia:\n- enable\n- configure terminal\n- vlan <id>\n- name <nama>\n- interface <fa0/1.. | gi0/1>\n- switchport mode <access | trunk>\n- switchport access vlan <id>\n- shutdown / no shutdown\n- show vlan brief\n- show interfaces status");
            return;
        }

        // User Mode
        if (this.cliMode === "user") {
            if (root === "enable" || root === "en") {
                this.cliMode = "priv";
                this.updatePrompt();
                return;
            }
        }

        // Privileged Mode
        if (this.cliMode === "priv") {
            if (cmd.startsWith("conf") || cmd === "configure terminal") {
                this.cliMode = "config";
                this.updatePrompt();
                this.printToCLI("Enter configuration commands, one per line. End with CNTL/Z.");
                return;
            }

            if (cmd === "show vlan brief" || cmd === "sh vlan") {
                this.showVlanBrief();
                return;
            }

            if (cmd === "show interfaces status" || cmd === "sh int status") {
                this.showInterfacesStatus();
                return;
            }
        }

        // Global Configuration Mode
        if (this.cliMode === "config") {
            if (root === "vlan") {
                const vlanId = parseInt(parts[1]);
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
                const ifaceName = parts[1];
                if (this.ports[ifaceName]) {
                    this.currentInterface = ifaceName;
                    this.cliMode = "iface";
                    this.updatePrompt();
                    return;
                } else {
                    this.printToCLI(`% Invalid interface ${ifaceName}. Pilihan: fa0/1, fa0/2, fa0/3, fa0/4, fa0/10, fa0/11, fa0/12, gi0/1`);
                    return;
                }
            }
        }

        // Interface Configuration Mode
        if (this.cliMode === "iface" && this.currentInterface) {
            const iface = this.currentInterface;

            if (cmd === "shutdown") {
                this.ports[iface].shutdown = true;
                this.printToCLI(`%LINK-5-CHANGED: Interface ${iface.toUpperCase()}, changed state to administratively down`);
                if (this.world) this.world.updatePortConfiguration(iface, "access", 1);
                return;
            }

            if (cmd === "no shutdown") {
                this.ports[iface].shutdown = false;
                this.printToCLI(`%LINK-3-UPDOWN: Interface ${iface.toUpperCase()}, changed state to up`);
                return;
            }

            if (cmd.startsWith("switchport mode access") || cmd === "sw mo ac") {
                this.ports[iface].mode = "access";
                this.printToCLI(`Port ${iface.toUpperCase()} set to ACCESS mode.`);
                if (this.world) this.world.updatePortConfiguration(iface, "access", this.ports[iface].vlan);
                return;
            }

            if (cmd.startsWith("switchport mode trunk") || cmd === "sw mo tr") {
                this.ports[iface].mode = "trunk";
                this.printToCLI(`Port ${iface.toUpperCase()} set to TRUNK mode with 802.1Q encapsulation.`);
                if (this.world) this.world.updatePortConfiguration(iface, "trunk", 1);
                return;
            }

            if (cmd.startsWith("switchport access vlan") || cmd.startsWith("sw ac vl")) {
                const vlanId = parseInt(parts[parts.length - 1]);
                if (!isNaN(vlanId)) {
                    this.ports[iface].vlan = vlanId;
                    this.printToCLI(`Port ${iface.toUpperCase()} assigned to VLAN ${vlanId}.`);
                    if (this.world) this.world.updatePortConfiguration(iface, "access", vlanId);
                    return;
                }
            }
        }

        this.printToCLI(`% Unknown or incomplete command: "${cmd}". Ketik "help" untuk bantuan.`);
    }

    showVlanBrief() {
        this.printToCLI("VLAN Name                             Status    Ports");
        this.printToCLI("---- -------------------------------- --------- -------------------------------");
        this.printToCLI("1    default                          active    Fa0/5, Fa0/6, Fa0/7, Fa0/8");
        for (let [vId, v] of Object.entries(this.vlans)) {
            if (vId === "1") continue;
            const assignedPorts = Object.entries(this.ports)
                .filter(([pName, pConf]) => pConf.mode === "access" && pConf.vlan === parseInt(vId))
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
        const btnStart = document.getElementById("btn-start-vlan");
        if (btnStart) btnStart.addEventListener("click", () => this.startMission());

        const btnQuickConfig = document.getElementById("btn-quick-config");
        if (btnQuickConfig) {
            btnQuickConfig.addEventListener("click", () => {
                // Auto-configure sample to assist students who need a hint
                this.executeCommand("enable");
                this.executeCommand("configure terminal");
                this.executeCommand("vlan 10");
                this.executeCommand("name FINANCE");
                this.executeCommand("interface fa0/1");
                this.executeCommand("switchport mode access");
                this.executeCommand("switchport access vlan 10");
                this.executeCommand("interface fa0/10");
                this.executeCommand("switchport mode access");
                this.executeCommand("switchport access vlan 10");
                this.executeCommand("exit");
                this.executeCommand("exit");
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.vlanGame = new VlanGameController();
});
