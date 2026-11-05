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
    r_title = p_title.add_run("GAMIFIKASI PRAKTIKUM LABORATORIUM:\nVLAN TOWER DEFENSE & MEMORY OVERCOMMIT CRISIS")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = slate_dark

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Mata Kuliah: Jaringan Komputer, Sistem Operasi Lanjut & Komputasi Awan\nPlatform Gamifikasi: Three.js 3D WebGL (PWA) & Virtual Lab Simulator")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(10.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = slate_gray

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Info Box Table
    info_table = doc.add_table(rows=3, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_data = [
        ("Sasaran Mahasiswa", "Mahasiswa S1/D4 Program Studi Ilmu Komputer / Teknologi Informasi"),
        ("Skenario 1", "VLAN Tower Defense (Cisco 802.1Q Tagging, 15 Menit Time Limit)"),
        ("Skenario 2", "Memory Overcommit Crisis (Proxmox VE / VMware virtio-ballooning & KSM)")
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
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = slate_dark

        p2 = cell_val.paragraphs[0]
        r2 = p2.add_run(col2)
        r2.font.name = "Arial"
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = slate_dark

    doc.add_paragraph().paragraph_format.space_after = Pt(18)

    # BAB 1
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("BAB 1: Latar Belakang & Filosofi Gamifikasi Praktikum")
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(13)
    r_h1.font.bold = True
    r_h1.font.color.rgb = cyan_dark

    p_bg1 = doc.add_paragraph()
    p_bg1.paragraph_format.line_spacing = 1.15
    p_bg1.add_run("Praktikum jaringan dan sistem virtualisasi seringkali menghadapi kendala hardware pada komputer mahasiswa. Menjalankan emulator jaringan seperti GNS3 atau EVE-NG, serta menyalakan banyak Virtual Machine di VMware Workstation secara bersamaan, kerap menyebabkan laptop mengalami freezing, overheating, dan kegagalan sistem. Kondisi ini menurunkan motivasi belajar mahasiswa karena waktu habis untuk troubleshooting spesifikasi teknis, bukan memahami konsep fundamental.")

    p_bg2 = doc.add_paragraph()
    p_bg2.paragraph_format.line_spacing = 1.15
    p_bg2.add_run("Solusi inovatif yang dihadirkan dalam modul ini adalah pendekatan ")
    r_bold1 = p_bg2.add_run("Gamifikasi Praktikum Ringan")
    r_bold1.font.bold = True
    p_bg2.add_run(". Mahasiswa diberikan tantangan misi real-time (time-attack) dengan skenario interaktif berbasis 3D WebGL di browser tanpa perlu instalasi aplikasi berat, sekaligus dapat diterapkan secara langsung pada Cisco Packet Tracer dan server Proxmox laboratorium.")

    # BAB 2
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("BAB 2: Skenario 1 - VLAN Tower Defense (Cisco 802.1Q)")
    r_h2.font.name = "Arial"
    r_h2.font.size = Pt(13)
    r_h2.font.bold = True
    r_h2.font.color.rgb = cyan_dark

    p_v1 = doc.add_paragraph()
    p_v1.paragraph_format.line_spacing = 1.15
    p_v1.add_run("Tujuan Pembelajaran: Mahasiswa mampu merancang segmentasi Layer 2, mengisolasi broadcast domain, dan mengonfigurasi 802.1Q Trunking pada switch Cisco Catalyst untuk mencegah kebocoran paket rahasia.")

    p_v2 = doc.add_paragraph()
    p_v2.paragraph_format.line_spacing = 1.15
    r_v2_title = p_v2.add_run("Deskripsi Misi (Batas Waktu: 15 Menit):\n")
    r_v2_title.font.bold = True
    p_v2.add_run("Mahasiswa bertindak sebagai Network Security Administrator. Aliran paket data dari Client A (Finance) mulai dikirimkan melalui switch jaringan. Mahasiswa harus mengonfigurasi VLAN 10 (Finance) dan VLAN 20 (Engineering), mengalokasikan access port, dan mengaktifkan trunk link gi0/1 sebelum paket mengalami kebocoran (leak) ke VLAN lain atau dicegat oleh node penyusup (Rogue Intruder).")

    # Cisco Commands Table
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
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
    r_h3.font.size = Pt(13)
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

    p_m3.add_run("3. Mengatur skrip stress test di Guest VM untuk simulasi krisis:\n")
    p_m3_cmd3 = p_m3.add_run("   # stress-ng --vm 2 --vm-bytes 4G --vm-keep --timeout 300s\n")
    p_m3_cmd3.font.name = "Courier New"
    p_m3_cmd3.font.size = Pt(8.5)

    # BAB 4
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("BAB 4: Lembar Kerja Mahasiswa (LKM) & Rubrik Asesmen")
    r_h4.font.name = "Arial"
    r_h4.font.size = Pt(13)
    r_h4.font.bold = True
    r_h4.font.color.rgb = slate_dark

    p_lkm = doc.add_paragraph()
    p_lkm.paragraph_format.line_spacing = 1.15
    p_lkm.add_run("Tabel berikut merupakan panduan asesmen kinerja praktikum bagi dosen dan asisten laboratorium untuk menilai pencapaian Capaian Pembelajaran Lulusan (CPL) dan Sub-CPMK:")

    # Rubric Table
    r_table = doc.add_table(rows=5, cols=3)
    r_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    rubric_rows = [
        ("Aspek Penilaian", "Bobot", "Kriteria Keberhasilan & Deskripsi"),
        ("Konfigurasi VLAN & Trunking (802.1Q)", "30%", "VLAN ID 10 dan 20 terkonfigurasi dengan tepat. Port access dialokasikan sesuai segmentasi departemen, dan port uplink beroperasi sebagai 802.1Q Trunk tanpa error."),
        ("Integritas Aliran Paket Data (Zero Leakage)", "25%", "100% paket data Client A Finance berhasil terkirim ke server tujuan. Tidak ada kebocoran paket ke broadcast domain Engineering atau tersadap node rogue."),
        ("Manajemen Virtio-Ballooning Dinamis", "25%", "Mahasiswa mampu menyesuaikan batas memory ballooning secara adaptif saat lonjakan beban stress-ng terjadi, tanpa memicu Guest OS crash."),
        ("Mitigasi Overcommit & Ketahanan Host", "20%", "KSM aktif dengan deduplikasi halaman memori optimal. Server host Proxmox bertahan selama simulasi 15 menit tanpa memicu Linux OOM-Killer.")
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
        set_cell_margins(c_asp, 80, 80, 100, 100)
        set_cell_margins(c_bbt, 80, 80, 100, 100)
        set_cell_margins(c_krt, 80, 80, 100, 100)

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
        "Apa parameter kernel yang menentukan prioritas proses yang akan dihentikan saat Linux Out of Memory (OOM) Killer terpicu?"
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
