# VLAN Defense &amp; Memory Overcommit Crisis - 3D Virtual Lab Gamification

Platform gamifikasi praktikum interaktif berbasis Three.js WebGL untuk mata kuliah Jaringan Komputer, Sistem Operasi Lanjut, dan Komputasi Awan (Cloud Computing). Dirancang khusus agar mahasiswa dapat mempraktikkan skenario troubleshooting jaringan dan overcommit virtualisasi secara instan di browser tanpa beban emulator berat seperti GNS3, EVE-NG, atau VMware Workstation.

---

## 🎯 Gambaran 2 Skenario Gamifikasi

### 1. Skenario 1: VLAN Tower Defense (Cisco 802.1Q)
- <b>Lingkungan:</b> Cisco Catalyst 3850 Core Switch Simulator dengan Cisco IOS CLI otentik.
- <b>Tantangan Misi:</b> Menyelamatkan aliran paket data rahasia dari Client A (Finance) menuju Server Tujuan dalam batas waktu 15 menit.
- <b>Objektif Teknis:</b>
  1. Membuat VLAN 10 (Finance) dan VLAN 20 (Engineering).
  2. Mengalokasikan interface FastEthernet 0/1 - 0/4 ke Access VLAN 10.
  3. Mengalokasikan interface FastEthernet 0/10 - 0/12 ke Access VLAN 20.
  4. Mengonfigurasi GigabitEthernet 0/1 sebagai 802.1Q Trunk Link dengan allowed VLAN 10 dan 20.
  5. Mencegah kebocoran paket (packet leak) antar VLAN dan menangkis paket serangan dari Rogue Intruder node.

### 2. Skenario 2: Memory Overcommit Crisis (Proxmox VE / VMware ESXi)
- <b>Lingkungan:</b> Proxmox VE 8.1 Hypervisor Node dengan memori fisik terbatas 16 GB RAM.
- <b>Tantangan Misi:</b> Tiga Virtual Machine (Web Nginx Cluster, DB Postgres, AI Worker) menuntut total 30 GB memori virtual (rasio overcommit 1.875x) di bawah hantaman gelombang stress-ng.
- <b>Objektif Teknis:</b>
  1. Mengatur dynamic memory ballooning (virtio-balloon) secara adaptif per VM.
  2. Mengaktifkan Kernel Samepage Merging (KSM) untuk deduplikasi halaman memori identik antar VM (menghemat hingga 1.8 - 4.5 GB RAM).
  3. Mengatur paging ZRAM / Swap secara optimal saat host mengalami lonjakan beban.
  4. Mencegah pemicuan Linux Out of Memory (OOM) Killer yang dapat mematikan proses guest VM.

---

## 🚀 Fitur Unggulan

- <b>Visualisasi 3D WebGL Realtime:</b> Didukung engine Three.js untuk merender topologi rack data center 42U, indikator LED RAM, tabung coolant memori host, serta aliran pulsa fiber optik paket data.
- <b>Web Audio API Procedural Synthesizer:</b> Efek audio dinamis tanpa file eksternal (suara ketukan keyboard terminal, transmisi pulsa paket, alarm darurat OOM, suara desis katup ballooning, dan jingle kemenangan).
- <b>Cisco IOS CLI Simulator Lengkap:</b> Mendukung transisi mode otentik (User EXEC mode &gt; Privileged EXEC &gt; Global Config &gt; Interface Config) dengan tombol quick command macro untuk pengguna tablet/ponsel.
- <b>Modul Panduan &amp; Rubrik Evaluasi (.DOCX):</b> Dilengkapi file panduan praktikum resmi format Microsoft Word berisi Lembar Kerja Mahasiswa (LKM), sintaks Cisco IOS, perintah Proxmox CLI, dan tabel rubrik asesmen kinerja.
- <b>PWA Offline Support:</b> Dilengkapi Service Worker dan manifest.json sehingga dapat dipasang (install) di homescreen laptop/ponsel mahasiswa dan dijalankan tanpa koneksi internet.
- <b>Leaderboard Realtime:</b> Sinkronisasi skor evaluasi mahasiswa berbasis Supabase Realtime dan penyimpanan lokal (localStorage).

---

## 📂 Struktur Berkas Repositori

- <code>index.html</code>: Portal utama Network Operations Center (NOC) dengan pemilihan skenario dan input identitas mahasiswa.
- <code>vlan-defense.html</code>: Antarmuka simulasi 3D VLAN Tower Defense dan terminal Cisco IOS CLI.
- <code>memory-crisis.html</code>: Antarmuka simulasi 3D Memory Overcommit Crisis dan dashboard kontrol Proxmox hypervisor.
- <code>lab-guide.html</code>: Lembar Kerja Mahasiswa (LKM) interaktif dan panduan konfigurasi step-by-step.
- <code>Modul_Praktikum_VLAN_dan_Memory_Crisis.docx</code>: Dokumen Microsoft Word resmi berisi modul praktikum lengkap dan rubrik penilaian dosen.
- <code>css/style.css</code>: Sistem styling Cyberpunk NOC Glassmorphism dengan font JetBrains Mono dan Plus Jakarta Sans.
- <code>js/vlan-3d.js</code>: Engine visualisasi 3D Three.js untuk topologi switchboard, kabel fiber optik, dan partikel paket.
- <code>js/vlan-game.js</code>: Logika permainan VLAN Defense dan parser perintah Cisco IOS CLI.
- <code>js/memory-3d.js</code>: Engine visualisasi 3D Three.js untuk server rack data center dan reservoir coolant memori fisik.
- <code>js/memory-game.js</code>: Logika simulasi overcommit, stress-ng workload waves, virtio-balloon, dan mitigasi OOM-killer.
- <code>js/audio.js</code>: Web Audio API procedural sound engine 100% offline.
- <code>js/supabase-config.js</code>: Konfigurasi koneksi Supabase Realtime untuk sinkronisasi leaderboard.
- <code>sw.js</code> &amp; <code>manifest.json</code>: Konfigurasi Progressive Web App (PWA).

---

## 🛠️ Panduan Menjalankan Secara Lokal

1. Clone repositori ini:
   <code>git clone https://github.com/NourAnisa/VLAN-Defense-memory-Crisis.git</code>
2. Masuk ke direktori:
   <code>cd VLAN-Defense-memory-Crisis</code>
3. Jalankan web server lokal ringan (opsional):
   <code>python -m http.server 8080</code>
4. Buka di browser:
   <code>http://localhost:8080</code>

---

## 📜 Lisensi &amp; Hak Cipta

Dikembangkan oleh Nor Anisa, M.Kom untuk gamifikasi pembelajaran praktikum Teknik Informatika dan Ilmu Komputer. Bebas dimanfaatkan untuk keperluan akademik dan perkuliahan.
