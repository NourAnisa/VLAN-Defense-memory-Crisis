import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_module():
    doc = Document()

    # Page Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styles
    cyan_dark = RGBColor(14, 116, 144)
    emerald_dark = RGBColor(16, 149, 106)
    rose_dark = RGBColor(190, 18, 60)
    slate_dark = RGBColor(30, 41, 59)
    slate_gray = RGBColor(71, 85, 105)

    # Document Header / Title
    p_badge = doc.add_paragraph()
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_badge = p_badge.add_run("MODUL PRAKTIKUM & LEMBAR KERJA MAHASISWA (LKM)")
    r_badge.font.name = "Arial"
    r_badge.font.size = Pt(10)
    r_badge.font.bold = True
    r_badge.font.color.rgb = cyan_dark

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("GAMIFIKASI PRAKTIKUM LABORATORIUM:\nVLAN TOWER DEFENSE, MEMORY CRISIS & KUBERNETES VS OPENSHIFT")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(15)
    r_title.font.bold = True
    r_title.font.color.rgb = slate_dark

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Mata Kuliah: Jaringan Komputer, Sistem Operasi Lanjut & Komputasi Awan (Cloud Computing)\nPlatform: 3D WebGL Engine, Dual CLI Simulator & Lembar Kerja Mahasiswa")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(10)
    r_sub.font.italic = True
    r_sub.font.color.rgb = slate_gray

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Info Box Table
    info_table = doc.add_table(rows=4, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_data = [
        ("Sasaran Mahasiswa", "Mahasiswa S1/D4 Program Studi Ilmu Komputer / Teknologi Informasi"),
        ("Skenario 1 (Jaringan)", "VLAN Tower Defense (Cisco 802.1Q Tagging, Access & Trunk, 15 Menit Limit)"),
        ("Skenario 2 (Virtualisasi)", "Memory Overcommit Crisis (Proxmox VE / VMware virtio-ballooning & KSM)"),
        ("Skenario 3 (Container Cloud)", "Komparasi Arsitektur: Vanilla Kubernetes (K8s) vs Red Hat OpenShift (OCP)")
    ]
    for row_idx, (col1, col2) in enumerate(info_data):
        row = info_table.rows[row_idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.3)
        set_cell_background(cell_lbl, "F1F5F9")
        set_cell_background(cell_val, "FFFFFF")
        set_cell_margins(cell_lbl, 80, 80, 120, 120)
        set_cell_margins(cell_val, 80, 80, 120, 120)

        p1 = cell_lbl.paragraphs[0]
        r1 = p1.add_run(col1)
        r1.font.name = "Arial"
        r1.font.size = Pt(9)
        r1.font.bold = True
        r1.font.color.rgb = slate_dark

        p2 = cell_val.paragraphs[0]
        r2 = p2.add_run(col2)
        r2.font.name = "Arial"
        r2.font.size = Pt(9)
        r2.font.color.rgb = slate_dark

    doc.add_paragraph().paragraph_format.space_after = Pt(16)

    # BAB 1
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("BAB 1: Latar Belakang & Filosofi Gamifikasi Praktikum")
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(12.5)
    r_h1.font.bold = True
    r_h1.font.color.rgb = cyan_dark

    p_bg1 = doc.add_paragraph()
    p_bg1.paragraph_format.line_spacing = 1.15
    p_bg1.add_run("Praktikum jaringan dan komputasi awan kerap kali terkendala oleh spesifikasi hardware laptop mahasiswa yang terbatas. Menjalankan emulator jaringan seperti GNS3 atau EVE-NG, serta menyalakan banyak Virtual Machine di VMware Workstation secara bersamaan, kerap menyebabkan komputer mengalami freezing, overheating, dan kegagalan booting. Akibatnya, alokasi waktu praktikum habis untuk troubleshooting teknis laptop, bukan mendalami substansi konsep.")

    p_bg2 = doc.add_paragraph()
    p_bg2.paragraph_format.line_spacing = 1.15
    p_bg2.add_run("Modul ini menghadirkan solusi berupa ")
    r_bold1 = p_bg2.add_run("Gamifikasi Praktikum Ringan Berbasis Browser")
    r_bold1.font.bold = True
    p_bg2.add_run(". Melalui antarmuka 3D WebGL tanpa beban instalasi aplikasi berat, mahasiswa dapat menguji konsep rekayasa secara interaktif: menyelamatkan aliran paket jaringan Cisco 802.1Q, mengendalikan overcommit memori hypervisor Proxmox, dan membandingkan arsitektur kontainer enterprise antara Vanilla Kubernetes dan Red Hat OpenShift.")

    # BAB 2
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("BAB 2: Skenario 1 - VLAN Tower Defense (Cisco 802.1Q)")
    r_h2.font.name = "Arial"
    r_h2.font.size = Pt(12.5)
    r_h2.font.bold = True
    r_h2.font.color.rgb = cyan_dark

    p_v1 = doc.add_paragraph()
    p_v1.paragraph_format.line_spacing = 1.15
    p_v1.add_run("Tujuan Pembelajaran: Mahasiswa mampu merancang segmentasi Layer 2 (Data Link), mengisolasi broadcast domain, dan mengonfigurasi 802.1Q Trunking pada switch Cisco Catalyst untuk mencegah kebocoran paket data.")

    p_v2 = doc.add_paragraph()
    p_v2.paragraph_format.line_spacing = 1.15
    r_v2_title = p_v2.add_run("Deskripsi Misi (Batas Waktu: 15 Menit):\n")
    r_v2_title.font.bold = True
    p_v2.add_run("Mahasiswa bertindak sebagai Network Security Administrator. Aliran paket data dari Client A (Finance) mulai dikirimkan melalui switch jaringan. Mahasiswa harus mengonfigurasi VLAN 10 (Finance) dan VLAN 20 (Engineering), mengalokasikan access port, dan mengaktifkan trunk link gi0/1 sebelum paket mengalami kebocoran (leak) ke VLAN lain atau dicegat oleh node penyusup (Rogue Intruder).")

    # Cisco Commands Table
    c_table = doc.add_table(rows=5, cols=2)
    c_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_rows = [
        ("Langkah", "Perintah Cisco IOS (CLI)"),
        ("1. Masuk Mode Privileged & Global Config", "Switch> enable\nSwitch# configure terminal"),
        ("2. Pembuatan VLAN Database", "Switch(config)# vlan 10\nSwitch(config-vlan)# name Finance\nSwitch(config-vlan)# exit\nSwitch(config)# vlan 20\nSwitch(config-vlan)# name Engineering\nSwitch(config-vlan)# exit"),
        ("3. Alokasi Port Access Anggota", "Switch(config)# interface range fastEthernet 0/1 - 4\nSwitch(config-if-range)# switchport mode access\nSwitch(config-if-range)# switchport access vlan 10\nSwitch(config-if-range)# exit\nSwitch(config)# interface range fastEthernet 0/10 - 12\nSwitch(config-if-range)# switchport mode access\nSwitch(config-if-range)# switchport access vlan 20\nSwitch(config-if-range)# exit"),
        ("4. Konfigurasi Uplink Trunk 802.1Q", "Switch(config)# interface gigabitEthernet 0/1\nSwitch(config-if)# switchport trunk encapsulation dot1q\nSwitch(config-if)# switchport mode trunk\nSwitch(config-if)# switchport trunk allowed vlan 10,20\nSwitch(config-if)# exit\nSwitch(config)# show vlan brief")
    ]
    for r_i, (c1, c2) in enumerate(c_rows):
        row = c_table.rows[r_i]
        c_lbl = row.cells[0]
        c_val = row.cells[1]
        c_lbl.width = Inches(2.2)
        c_val.width = Inches(4.3)
        if r_i == 0:
            set_cell_background(c_lbl, "0E7490")
            set_cell_background(c_val, "0E7490")
            p_c1 = c_lbl.paragraphs[0]
            r_c1 = p_c1.add_run(c1)
            r_c1.font.bold = True
            r_c1.font.color.rgb = RGBColor(255, 255, 255)
            p_c2 = c_val.paragraphs[0]
            r_c2 = p_c2.add_run(c2)
            r_c2.font.bold = True
            r_c2.font.color.rgb = RGBColor(255, 255, 255)
        else:
            set_cell_background(c_lbl, "F8FAFC")
            set_cell_background(c_val, "FFFFFF")
            p_c1 = c_lbl.paragraphs[0]
            r_c1 = p_c1.add_run(c1)
            r_c1.font.bold = True
            r_c1.font.color.rgb = slate_dark
            p_c2 = c_val.paragraphs[0]
            r_c2 = p_c2.add_run(c2)
            r_c2.font.name = "Courier New"
            r_c2.font.size = Pt(8.5)
            r_c2.font.color.rgb = RGBColor(15, 23, 42)
        set_cell_margins(c_lbl, 80, 80, 100, 100)
        set_cell_margins(c_val, 80, 80, 100, 100)

    # BAB 3
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("BAB 3: Skenario 2 - Memory Overcommit Crisis (Proxmox / VMware)")
    r_h3.font.name = "Arial"
    r_h3.font.size = Pt(12.5)
    r_h3.font.bold = True
    r_h3.font.color.rgb = emerald_dark

    p_m1 = doc.add_paragraph()
    p_m1.paragraph_format.line_spacing = 1.15
    p_m1.add_run("Tujuan Pembelajaran: Mahasiswa memahami mekanisme alokasi memori hypervisor, teknik virtio-ballooning, deduplikasi memori Kernel Samepage Merging (KSM), dan cara mencegah terjadinya Linux Out of Memory (OOM) Killer pada multi-tenant cloud environment.")

    p_m2 = doc.add_paragraph()
    p_m2.paragraph_format.line_spacing = 1.15
    r_m2_title = p_m2.add_run("Deskripsi Tantangan Skenario:\n")
    r_m2_title.font.bold = True
    p_m2.add_run("Disediakan sebuah server host Proxmox VE dengan memori fisik terbatas ")
    r_host_ram = p_m2.add_run("16 GB RAM")
    r_host_ram.font.bold = True
    p_m2.add_run(". Terdapat 3 Virtual Machine yang berjalan secara bersamaan dengan batas maksimal kebutuhan 30 GB (rasio overcommit 1.875x):\n")
    p_m2.add_run("1. VM 101 (Web Nginx Cluster): Alokasi maksimal 6 GB (Minimal balloon 1.5 GB)\n")
    p_m2.add_run("2. VM 102 (Database PostgreSQL): Alokasi maksimal 10 GB (Minimal balloon 3 GB)\n")
    p_m2.add_run("3. VM 103 (AI Inference Worker): Alokasi maksimal 14 GB (Minimal balloon 3.5 GB)")

    p_m3 = doc.add_paragraph()
    p_m3.paragraph_format.line_spacing = 1.15
    r_m3_title = p_m3.add_run("Perintah Konfigurasi Proxmox VE & Kernel Linux:\n")
    r_m3_title.font.bold = True
    p_m3.add_run("1. Mengatur dynamic memory ballooning via Proxmox CLI:\n")
    p_m3_cmd1 = p_m3.add_run("   # qm set 101 --memory 6144 --balloon 1536\n   # qm set 102 --memory 10240 --balloon 3072\n   # qm set 103 --memory 14336 --balloon 3584\n")
    p_m3_cmd1.font.name = "Courier New"
    p_m3_cmd1.font.size = Pt(8.5)

    p_m3.add_run("2. Mengaktifkan Kernel Samepage Merging (KSM) untuk deduplikasi RAM antar VM:\n")
    p_m3_cmd2 = p_m3.add_run("   # systemctl enable --now ksmtuned\n   # echo 1 > /sys/kernel/mm/ksm/run\n   # cat /sys/kernel/mm/ksm/pages_sharing\n")
    p_m3_cmd2.font.name = "Courier New"
    p_m3_cmd2.font.size = Pt(8.5)

    # BAB 4: KUBERNETES VS OPENSHIFT
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("BAB 4: Komparasi Arsitektur Kubernetes vs Red Hat OpenShift (OCP)")
    r_h4.font.name = "Arial"
    r_h4.font.size = Pt(12.5)
    r_h4.font.bold = True
    r_h4.font.color.rgb = rose_dark

    p_k1 = doc.add_paragraph()
    p_k1.paragraph_format.line_spacing = 1.15
    p_k1.add_run("Tujuan Pembelajaran: Mahasiswa memahami perbedaan fundamental antara orkestrasi kontainer open-source murni (Vanilla Kubernetes) dan platform kontainer enterprise siap produksi (Red Hat OpenShift Container Platform / OCP).")

    p_k2 = doc.add_paragraph()
    p_k2.paragraph_format.line_spacing = 1.15
    p_k2.add_run("Kubernetes adalah proyek upstream di bawah CNCF yang menyediakan pondasi inti (kernel) orkestrasi kontainer. Sedangkan OpenShift adalah platform komersial lengkap yang menyertakan sistem operasi immutable (RHCOS), router ingress bawaan (Route), kontrol keamanan ketat (SecurityContextConstraints), dan pipeline Source-to-Image (S2I).")

    # Table of K8s vs OpenShift comparison
    k_table = doc.add_table(rows=8, cols=3)
    k_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    k_data = [
        ("Dimensi Komparasi", "Vanilla Kubernetes (K8s)", "Red Hat OpenShift (OCP)"),
        ("Lisensi & Ekosistem", "Open Source murni (Apache 2.0 / CNCF)", "Enterprise Komersial berbayar (Red Hat)"),
        ("Sistem Operasi Host", "Bebas (Ubuntu, Debian, RHEL, CentOS)", "Wajib RHCOS (RHEL CoreOS) immutable"),
        ("Postur Keamanan", "Permisif secara default (root pod diizinkan)", "Ketat (Root container diblokir oleh SCC)"),
        ("Routing & Ingress", "Perlu Ingress Controller tambahan (Nginx)", "Objek Route bawaan berbasis HAProxy"),
        ("Build & CI/CD", "Eksternal (memerlukan Dockerfile & CI)", "Source-to-Image (S2I) & internal registry"),
        ("Manajemen Tooling", "kubectl murni", "oc CLI (super-set dari kubectl)"),
        ("Antarmuka Grafis", "Kubernetes Dashboard sederhana", "Web Console Enterprise kaya fitur (Admin/Dev)")
    ]
    for r_i, (c1, c2, c3) in enumerate(k_data):
        row = k_table.rows[r_i]
        c_asp = row.cells[0]
        c_k8s = row.cells[1]
        c_ocp = row.cells[2]
        c_asp.width = Inches(1.8)
        c_k8s.width = Inches(2.3)
        c_ocp.width = Inches(2.4)

        if r_i == 0:
            set_cell_background(c_asp, "881337")
            set_cell_background(c_k8s, "881337")
            set_cell_background(c_ocp, "881337")
            for c_x, val_x in [(c_asp, c1), (c_k8s, c2), (c_ocp, c3)]:
                p_x = c_x.paragraphs[0]
                r_x = p_x.add_run(val_x)
                r_x.font.bold = True
                r_x.font.color.rgb = RGBColor(255, 255, 255)
        else:
            set_cell_background(c_asp, "F8FAFC")
            set_cell_background(c_k8s, "F1F5F9")
            set_cell_background(c_ocp, "FFFFFF")
            p_1 = c_asp.paragraphs[0]
            r_1 = p_1.add_run(c1)
            r_1.font.bold = True
            r_1.font.color.rgb = slate_dark
            p_2 = c_k8s.paragraphs[0]
            r_2 = p_2.add_run(c2)
            r_2.font.color.rgb = RGBColor(50, 108, 229)
            p_3 = c_ocp.paragraphs[0]
            r_3 = p_3.add_run(c3)
            r_3.font.color.rgb = RGBColor(225, 29, 72)
        set_cell_margins(c_asp, 60, 60, 80, 80)
        set_cell_margins(c_k8s, 60, 60, 80, 80)
        set_cell_margins(c_ocp, 60, 60, 80, 80)

    # BAB 5: LKM & RUBRIK ASESMEN
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    h5 = doc.add_heading(level=1)
    r_h5 = h5.add_run("BAB 5: Lembar Kerja Mahasiswa (LKM) & Rubrik Asesmen Kinerja")
    r_h5.font.name = "Arial"
    r_h5.font.size = Pt(12.5)
    r_h5.font.bold = True
    r_h5.font.color.rgb = slate_dark

    p_lkm = doc.add_paragraph()
    p_lkm.paragraph_format.line_spacing = 1.15
    p_lkm.add_run("Tabel rubrik penilaian komprehensif bagi dosen pengampu untuk mengukur ketercapaian kompetensi praktikum mahasiswa:")

    # Rubric Table
    r_table = doc.add_table(rows=6, cols=3)
    r_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rubric_rows = [
        ("Aspek Penilaian", "Bobot", "Kriteria Keberhasilan & Deskripsi"),
        ("Konfigurasi VLAN & Trunking (802.1Q)", "25%", "VLAN ID 10 dan 20 terkonfigurasi tepat; port access dan 802.1Q trunk beroperasi tanpa error."),
        ("Integritas Aliran Paket Data (Zero Leakage)", "20%", "100% paket data Client A Finance sampai tujuan; zero packet leakage ke VLAN 20 atau disadap node rogue."),
        ("Manajemen Virtio-Ballooning Dinamis", "20%", "Penyesuaian target ballooning adaptif terhadap lonjakan beban stress-ng tanpa memicu Guest OS crash."),
        ("Mitigasi Overcommit & Ketahanan Host", "15%", "KSM aktif dengan deduplikasi efisien; host node Proxmox bertahan di bawah ambang batas OOM-Killer."),
        ("Komparasi Arsitektur Container Cloud", "20%", "Mahasiswa mampu membedakan konsep Ingress vs Route, SCC vs PSS, serta mengeksekusi perintah kubectl dan oc.")
    ]
    for r_i, (c1, c2, c3) in enumerate(rubric_rows):
        row = r_table.rows[r_i]
        c_asp = row.cells[0]
        c_bbt = row.cells[1]
        c_krt = row.cells[2]
        c_asp.width = Inches(1.8)
        c_bbt.width = Inches(0.8)
        c_krt.width = Inches(3.9)

        if r_i == 0:
            set_cell_background(c_asp, "1E293B")
            set_cell_background(c_bbt, "1E293B")
            set_cell_background(c_krt, "1E293B")
            for c_x, val_x in [(c_asp, c1), (c_bbt, c2), (c_krt, c3)]:
                p_x = c_x.paragraphs[0]
                r_x = p_x.add_run(val_x)
                r_x.font.bold = True
                r_x.font.color.rgb = RGBColor(255, 255, 255)
        else:
            set_cell_background(c_asp, "F8FAFC")
            set_cell_background(c_bbt, "F1F5F9")
            set_cell_background(c_krt, "FFFFFF")
            p_1 = c_asp.paragraphs[0]
            r_1 = p_1.add_run(c1)
            r_1.font.bold = True
            r_1.font.color.rgb = slate_dark
            p_2 = c_bbt.paragraphs[0]
            r_2 = p_2.add_run(c2)
            r_2.font.bold = True
            r_2.font.color.rgb = cyan_dark
            p_3 = c_krt.paragraphs[0]
            r_3 = p_3.add_run(c3)
            r_3.font.color.rgb = slate_dark
        set_cell_margins(c_asp, 60, 60, 80, 80)
        set_cell_margins(c_bbt, 60, 60, 80, 80)
        set_cell_margins(c_krt, 60, 60, 80, 80)

    # Reflection Questions
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    p_q_title = doc.add_paragraph()
    r_q_title = p_q_title.add_run("Pertanyaan Evaluasi & Analisis Mahasiswa:")
    r_q_title.font.name = "Arial"
    r_q_title.font.size = Pt(11)
    r_q_title.font.bold = True
    r_q_title.font.color.rgb = slate_dark

    questions = [
        "Jelaskan mengapa paket data dari Client A dapat bocor ke VLAN B apabila port switch belum dikonfigurasi sebagai access port spesifik!",
        "Bagaimana mekanisme penambahan 4-byte 802.1Q Tag pada Ethernet frame ketika melintasi link trunk gigabitEthernet 0/1?",
        "Jelaskan bagaimana virtio-balloon driver bekerja sama dengan Guest OS kernel untuk melepaskan (reclaim) halaman RAM yang tidak terpakai!",
        "Mengapa mengaktifkan Kernel Samepage Merging (KSM) dapat menghemat penggunaan RAM pada node Proxmox yang menjalankan beberapa VM sejenis?",
        "Apa parameter kernel yang menentukan prioritas proses yang akan dihentikan saat Linux Out of Memory (OOM) Killer terpicu?",
        "Mengapa Red Hat OpenShift secara default memblokir container yang berjalan dengan root (UID 0) melalui Security Context Constraints (SCC), dan apa dampaknya bagi keamanan kluster enterprise?"
    ]
    for q_idx, q_text in enumerate(questions, 1):
        p_q = doc.add_paragraph()
        p_q.paragraph_format.line_spacing = 1.15
        p_q.add_run(f"{q_idx}. {q_text}\n   Jawaban: __________________________________________________________________\n")

    output_path = r"c:\Users\Nor Anisa\Downloads\VLAN-Defense-memory-Crisis\Modul_Praktikum_VLAN_dan_Memory_Crisis.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_module()
