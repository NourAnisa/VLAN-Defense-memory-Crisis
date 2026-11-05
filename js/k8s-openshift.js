/**
 * Kubernetes vs Red Hat OpenShift Interactive Lab Simulator
 * Dual CLI Engine (kubectl & oc), Architecture Comparator, and Manifest Explorer
 */

class K8sOpenShiftController {
    constructor() {
        this.currentMode = "k8s"; // 'k8s' or 'openshift'
        this.sound = window.labSound;

        // Simulated Cluster State for K8s
        this.k8sState = {
            nodes: [
                { name: "k8s-control-plane", status: "Ready", roles: "control-plane", age: "42d", version: "v1.28.2" },
                { name: "k8s-worker-01", status: "Ready", roles: "worker", age: "42d", version: "v1.28.2" },
                { name: "k8s-worker-02", status: "Ready", roles: "worker", age: "42d", version: "v1.28.2" }
            ],
            deployments: {
                "nginx-frontend": { ready: "2/2", upToDate: 2, available: 2, age: "5d" }
            },
            pods: [
                { namespace: "default", name: "nginx-frontend-7f98b688c-9x2qk", ready: "1/1", status: "Running", restarts: 0, age: "5d" },
                { namespace: "default", name: "nginx-frontend-7f98b688c-pt41b", ready: "1/1", status: "Running", restarts: 0, age: "5d" },
                { namespace: "kube-system", name: "coredns-5dd5756b68-b8sjk", ready: "1/1", status: "Running", restarts: 1, age: "42d" },
                { namespace: "kube-system", name: "etcd-k8s-control-plane", ready: "1/1", status: "Running", restarts: 0, age: "42d" },
                { namespace: "kube-system", name: "kube-apiserver-k8s-control-plane", ready: "1/1", status: "Running", restarts: 0, age: "42d" }
            ],
            ingresses: [
                { namespace: "default", name: "web-ingress", class: "nginx", hosts: "app.lab.internal", address: "192.168.10.100", ports: "80, 443" }
            ]
        };

        // Simulated Cluster State for OpenShift (OCP 4.14)
        this.ocpState = {
            project: "prod-fintech",
            user: "developer (Nor Anisa)",
            nodes: [
                { name: "master-0.ocp.lab.internal", status: "Ready", roles: "master", age: "18d", version: "v1.27.6+f67aeb3 (RHCOS 4.14)" },
                { name: "master-1.ocp.lab.internal", status: "Ready", roles: "master", age: "18d", version: "v1.27.6+f67aeb3 (RHCOS 4.14)" },
                { name: "master-2.ocp.lab.internal", status: "Ready", roles: "master", age: "18d", version: "v1.27.6+f67aeb3 (RHCOS 4.14)" },
                { name: "worker-0.ocp.lab.internal", status: "Ready", roles: "worker", age: "18d", version: "v1.27.6+f67aeb3 (RHCOS 4.14)" },
                { name: "worker-1.ocp.lab.internal", status: "Ready", roles: "worker", age: "18d", version: "v1.27.6+f67aeb3 (RHCOS 4.14)" }
            ],
            routes: [
                { name: "fintech-api", host: "fintech-api-prod-fintech.apps.ocp.lab.internal", to: "Service/fintech-api", port: "8080", termination: "edge" }
            ],
            buildConfigs: [
                { name: "fintech-api", type: "Source (S2I nodejs:18)", status: "Complete (Build #4)", lastBuild: "2h ago" }
            ],
            sccPolicies: [
                { name: "restricted-v2", priority: "null", allowPrivileged: "false", runAsUser: "MustRunAsRange" },
                { name: "anyuid", priority: "10", allowPrivileged: "false", runAsUser: "RunAsAny" }
            ]
        };

        this.commandHistory = [];
        this.historyIndex = -1;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updatePrompt();
    }

    setMode(mode) {
        this.currentMode = mode;
        this.updatePrompt();

        const tabK8s = document.getElementById("tab-mode-k8s");
        const tabOcp = document.getElementById("tab-mode-ocp");
        const badgeMode = document.getElementById("activeModeBadge");

        if (mode === "k8s") {
            if (tabK8s) tabK8s.className = "px-4 py-2 text-xs font-mono font-bold rounded-md bg-[#326CE5] text-white transition-all shadow-md";
            if (tabOcp) tabOcp.className = "px-4 py-2 text-xs font-mono font-bold rounded-md text-slate-400 hover:text-slate-200 transition-all";
            if (badgeMode) {
                badgeMode.innerText = "Kubernetes (Vanilla K8s v1.28)";
                badgeMode.className = "px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#326CE5]/20 text-[#326CE5] border border-[#326CE5]/40";
            }
            this.printToCLI("=========================================================");
            this.printToCLI("⚡ Mode Beralih ke: Vanilla Kubernetes Cluster (v1.28.2)");
            this.printToCLI("Gunakan perintah 'kubectl' (contoh: kubectl get nodes, kubectl get pods -A)");
            this.printToCLI("=========================================================");
        } else {
            if (tabK8s) tabK8s.className = "px-4 py-2 text-xs font-mono font-bold rounded-md text-slate-400 hover:text-slate-200 transition-all";
            if (tabOcp) tabOcp.className = "px-4 py-2 text-xs font-mono font-bold rounded-md bg-[#EE0000] text-white transition-all shadow-md";
            if (badgeMode) {
                badgeMode.innerText = "Red Hat OpenShift (OCP v4.14)";
                badgeMode.className = "px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[#EE0000]/20 text-rose-400 border border-[#EE0000]/40";
            }
            this.printToCLI("=========================================================");
            this.printToCLI("🚀 Mode Beralih ke: Red Hat OpenShift Container Platform (OCP 4.14)");
            this.printToCLI("Gunakan perintah 'oc' (contoh: oc whoami, oc status, oc get routes, oc new-app)");
            this.printToCLI("=========================================================");
        }

        if (this.sound) this.sound.playKeyClick();
    }

    updatePrompt() {
        const promptEl = document.getElementById("terminalPrompt");
        if (!promptEl) return;
        if (this.currentMode === "k8s") {
            promptEl.innerHTML = `<span class="text-[#326CE5] font-bold">admin@k8s-master:~$</span>`;
        } else {
            promptEl.innerHTML = `<span class="text-rose-400 font-bold">[developer@ocp4 ~]$</span>`;
        }
    }

    printToCLI(text) {
        const output = document.getElementById("terminalOutput");
        if (!output) return;
        const line = document.createElement("div");
        line.className = "py-0.5 whitespace-pre-wrap leading-relaxed select-text";
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    executeCommand(rawCmd) {
        if (!rawCmd) return;
        const cmd = rawCmd.trim();
        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;

        if (this.sound) this.sound.playKeyClick();

        const promptText = this.currentMode === "k8s" ? "admin@k8s-master:~$" : "[developer@ocp4 ~]$";
        this.printToCLI(`${promptText} ${cmd}`);

        const lower = cmd.toLowerCase();
        const parts = lower.split(/\s+/);
        const binary = parts[0];

        // Clear terminal
        if (lower === "clear") {
            const output = document.getElementById("terminalOutput");
            if (output) output.innerHTML = "";
            return;
        }

        // Help command
        if (lower === "help" || lower === "?") {
            this.showHelp();
            return;
        }

        // =====================================================================
        // KUBERNETES COMMANDS (kubectl)
        // =====================================================================
        if (binary === "kubectl") {
            const verb = parts[1];
            const resource = parts[2];

            if (verb === "get" && (resource === "nodes" || resource === "node")) {
                this.printToCLI("NAME               STATUS   ROLES           AGE   VERSION");
                this.k8sState.nodes.forEach(n => {
                    this.printToCLI(`${n.name.padEnd(18)} ${n.status.padEnd(8)} ${n.roles.padEnd(15)} ${n.age.padEnd(5)} ${n.version}`);
                });
                return;
            }

            if (verb === "get" && (resource === "pods" || resource === "pod" || resource === "po")) {
                const isAllNamespaces = parts.includes("-a") || parts.includes("-A") || parts.includes("--all-namespaces");
                this.printToCLI("NAMESPACE     NAME                                    READY   STATUS    RESTARTS   AGE");
                this.k8sState.pods.forEach(p => {
                    if (isAllNamespaces || p.namespace === "default") {
                        this.printToCLI(`${p.namespace.padEnd(13)} ${p.name.padEnd(39)} ${p.ready.padEnd(7)} ${p.status.padEnd(9)} ${String(p.restarts).padEnd(10)} ${p.age}`);
                    }
                });
                return;
            }

            if (verb === "get" && (resource === "deployments" || resource === "deployment" || resource === "deploy")) {
                this.printToCLI("NAME             READY   UP-TO-DATE   AVAILABLE   AGE");
                for (let [dName, dConf] of Object.entries(this.k8sState.deployments)) {
                    this.printToCLI(`${dName.padEnd(16)} ${dConf.ready.padEnd(7)} ${String(dConf.upToDate).padEnd(12)} ${String(dConf.available).padEnd(11)} ${dConf.age}`);
                }
                return;
            }

            if (verb === "get" && (resource === "ingress" || resource === "ing")) {
                this.printToCLI("NAME          CLASS   HOSTS             ADDRESS          PORTS     AGE");
                this.k8sState.ingresses.forEach(ing => {
                    this.printToCLI(`${ing.name.padEnd(13)} ${ing.class.padEnd(7)} ${ing.hosts.padEnd(17)} ${ing.address.padEnd(16)} ${ing.ports.padEnd(9)} 5d`);
                });
                return;
            }

            if (verb === "create" && resource === "deployment") {
                const depName = parts[3] || "microservice-api";
                this.k8sState.deployments[depName] = { ready: "1/1", upToDate: 1, available: 1, age: "10s" };
                this.k8sState.pods.push({
                    namespace: "default",
                    name: `${depName}-54b8d7c49-v9km8`,
                    ready: "1/1",
                    status: "Running",
                    restarts: 0,
                    age: "10s"
                });
                this.printToCLI(`deployment.apps/${depName} created`);
                return;
            }

            if (verb === "scale" && (resource === "deployment" || resource?.startsWith("deploy"))) {
                const depName = parts[parts.length - 1].replace("deployment/", "").replace("deploy/", "");
                const replicasMatch = cmd.match(/--replicas=(\d+)/);
                const replicas = replicasMatch ? replicasMatch[1] : 3;
                if (this.k8sState.deployments[depName]) {
                    this.k8sState.deployments[depName].ready = `${replicas}/${replicas}`;
                    this.k8sState.deployments[depName].available = parseInt(replicas, 10);
                }
                this.printToCLI(`deployment.apps/${depName} scaled to ${replicas}`);
                return;
            }

            if (verb === "apply") {
                this.printToCLI("customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io configured");
                this.printToCLI("ingress.networking.k8s.io/web-ingress configured (Nginx Ingress Controller reload: OK)");
                return;
            }

            this.printToCLI(`% Unknown kubectl flag or argument: "${cmd}". Coba: "kubectl get nodes", "kubectl get pods -A", "kubectl get ingress"`);
            return;
        }

        // =====================================================================
        // OPENSHIFT COMMANDS (oc)
        // =====================================================================
        if (binary === "oc") {
            const verb = parts[1];
            const resource = parts[2];

            if (verb === "whoami") {
                this.printToCLI(this.ocpState.user);
                return;
            }

            if (verb === "project") {
                if (parts[2]) {
                    this.ocpState.project = parts[2];
                    this.printToCLI(`Now using project "${this.ocpState.project}" on server "https://api.ocp.lab.internal:6443".`);
                } else {
                    this.printToCLI(`Using project "${this.ocpState.project}" on server "https://api.ocp.lab.internal:6443".`);
                }
                return;
            }

            if (verb === "projects") {
                this.printToCLI("You have access to the following projects:");
                this.printToCLI("  * prod-fintech");
                this.printToCLI("    openshift-ingress");
                this.printToCLI("    openshift-monitoring");
                this.printToCLI("    openshift-operators");
                this.printToCLI("Using project \"prod-fintech\" on server \"https://api.ocp.lab.internal:6443\".");
                return;
            }

            if (verb === "status") {
                this.printToCLI(`In project ${this.ocpState.project} on server https://api.ocp.lab.internal:6443\n`);
                this.printToCLI("http://fintech-api-prod-fintech.apps.ocp.lab.internal to pod port 8080 (svc/fintech-api)");
                this.printToCLI("  deployment/fintech-api deploys image-registry.openshift-image-registry.svc:5000/prod-fintech/fintech-api:latest");
                this.printToCLI("    deployment #4 running for 2 hours - 3 pods");
                this.printToCLI("    builds from git source https://github.com/app/fintech into buildConfig/fintech-api (Source-to-Image nodejs:18)");
                return;
            }

            if (verb === "get" && (resource === "nodes" || resource === "node")) {
                this.printToCLI("NAME                          STATUS   ROLES           AGE   VERSION");
                this.ocpState.nodes.forEach(n => {
                    this.printToCLI(`${n.name.padEnd(29)} ${n.status.padEnd(8)} ${n.roles.padEnd(15)} ${n.age.padEnd(5)} ${n.version}`);
                });
                return;
            }

            if (verb === "get" && (resource === "routes" || resource === "route")) {
                this.printToCLI("NAME          HOST/PORT                                                 PATH   SERVICES      PORT   TERMINATION   WILDCARD");
                this.ocpState.routes.forEach(r => {
                    this.printToCLI(`${r.name.padEnd(13)} ${r.host.padEnd(56)} /      fintech-api   ${r.port}   ${r.termination.padEnd(13)} None`);
                });
                return;
            }

            if (verb === "get" && (resource === "buildconfigs" || resource === "bc")) {
                this.printToCLI("NAME          TYPE              FROM          LATEST");
                this.ocpState.buildConfigs.forEach(b => {
                    this.printToCLI(`${b.name.padEnd(13)} ${b.type.padEnd(17)} Git           4`);
                });
                return;
            }

            if (verb === "new-app") {
                this.printToCLI("--> Found image 'nodejs:18' in image registry for Docker image 'nodejs:18'");
                this.printToCLI("--> Creating resources ...");
                this.printToCLI("    imagestream.image.openshift.io \"fintech-api\" created");
                this.printToCLI("    buildconfig.build.openshift.io \"fintech-api\" created");
                this.printToCLI("    deployment.apps \"fintech-api\" created");
                this.printToCLI("    service \"fintech-api\" created");
                this.printToCLI("--> Success");
                this.printToCLI("    Build scheduled, use 'oc logs -f buildconfig/fintech-api' to track build progress.");
                this.printToCLI("    Run 'oc expose service/fintech-api' to create an external edge Route.");
                return;
            }

            if (verb === "adm" && parts[2] === "policy") {
                this.printToCLI("clusterrole.rbac.authorization.k8s.io/system:openshift:scc:anyuid added to: [\"system:serviceaccount:prod-fintech:default\"]");
                this.printToCLI("⚠️ PERINGATAN: SCC 'anyuid' mengizinkan container berjalan sebagai root. Pastikan hanya digunakan jika mutlak diperlukan!");
                return;
            }

            this.printToCLI(`% Unknown oc flag or argument: "${cmd}". Coba: "oc whoami", "oc status", "oc get routes", "oc get nodes"`);
            return;
        }

        // If user typed kubectl in ocp mode or vice versa, assist gracefully
        if (this.currentMode === "k8s" && binary === "oc") {
            this.printToCLI("Catatan: Anda sedang berada di mode Vanilla Kubernetes. Gunakan 'kubectl' atau klik tab 'Red Hat OpenShift' di atas.");
            return;
        }

        if (this.currentMode === "openshift" && binary === "kubectl") {
            this.printToCLI("Info: OpenShift 100% kompatibel dengan 'kubectl'! Meneruskan perintah ke kube-apiserver OCP...");
            this.executeCommand(cmd.replace("kubectl", "oc"));
            return;
        }

        this.printToCLI(`% Command not found: "${cmd}". Ketik "help" untuk melihat daftar perintah.`);
    }

    showHelp() {
        this.printToCLI("=========================================================");
        this.printToCLI("PANDUAN PERINTAH SIMULATOR KUBERNETES & OPENSHIFT");
        this.printToCLI("=========================================================");
        this.printToCLI("Mode Vanilla Kubernetes (kubectl):");
        this.printToCLI("  kubectl get nodes               - Melihat node cluster");
        this.printToCLI("  kubectl get pods -A             - Melihat pod seluruh namespace");
        this.printToCLI("  kubectl get ingress             - Melihat Ingress Layer 7");
        this.printToCLI("  kubectl create deployment web   - Membuat deployment baru");
        this.printToCLI("  kubectl scale deploy/web --replicas=3 - Menskalakan pod");
        this.printToCLI("");
        this.printToCLI("Mode Red Hat OpenShift (oc):");
        this.printToCLI("  oc whoami                       - Melihat identitas user login");
        this.printToCLI("  oc status                       - Melihat arsitektur project");
        this.printToCLI("  oc get routes                   - Melihat domain Route HAProxy bawaan");
        this.printToCLI("  oc get bc                       - Melihat BuildConfigs Source-to-Image (S2I)");
        this.printToCLI("  oc new-app nodejs:18~https://... - Build otomatis dari source code");
        this.printToCLI("  oc adm policy add-scc-to-user anyuid -z default - Konfigurasi SCC");
        this.printToCLI("=========================================================");
    }

    bindEvents() {
        const input = document.getElementById("terminalInput");
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const val = input.value;
                    input.value = "";
                    this.executeCommand(val);
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        input.value = this.commandHistory[this.historyIndex];
                    }
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (this.historyIndex < this.commandHistory.length - 1) {
                        this.historyIndex++;
                        input.value = this.commandHistory[this.historyIndex];
                    } else {
                        this.historyIndex = this.commandHistory.length;
                        input.value = "";
                    }
                }
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.k8sOcp = new K8sOpenShiftController();
});
