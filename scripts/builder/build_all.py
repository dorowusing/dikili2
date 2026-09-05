# -*- coding: utf-8 -*-
import sys, os, json, csv, re

sys.path.append('/content/naskah_d_builder')
import sair_01, sair_02, sair_03, sair_04, sair_05, sair_06, sair_07, sair_08
import sair_09, sair_10, sair_11, sair_12, sair_13, sair_14, sair_15, sair_16, sair_17

modules = [
    sair_01, sair_02, sair_03, sair_04, sair_05, sair_06, sair_07, sair_08,
    sair_09, sair_10, sair_11, sair_12, sair_13, sair_14, sair_15, sair_16, sair_17
]

def compile_corpus():
    sairs = []
    total_units_count = 0
    total_jabu_count = 0
    total_gorontalo_count = 0

    for i, mod in enumerate(modules):
        s = mod.get_sair()
        s_num = s['sair_number']
        
        # Recount and attach metadata
        jabu_cnt = 0
        gor_cnt = 0
        
        for u_idx, u in enumerate(s['units']):
            u_order = u_idx + 1
            u['unit_order'] = u_order
            u['unit_id'] = f"sair_{s_num:02d}_unit_{u_order:02d}"
            u['sair_number'] = s_num
            u['sair_letter'] = s['sair_letter']
            u['doc_page'] = s['doc_pages'][0]
            u['pdf_page'] = s['pdf_pages'][0]
            
            if u.get('unit_type') == 'jabu_refrein':
                jabu_cnt += 1
            if u.get('unit_type') == 'prosa_hikayat_gorontalo' or u.get('text_gorontalo'):
                gor_cnt += 1
                
        s['total_units'] = len(s['units'])
        s['jabu_recorded'] = jabu_cnt
        s['gorontalo_sections_recorded'] = gor_cnt
        
        total_units_count += len(s['units'])
        total_jabu_count += jabu_cnt
        total_gorontalo_count += gor_cnt
        
        sairs.append(s)

    metadata = {
        'title': 'Katalog Lengkap Suntingan Teks Naskah D (Dikili Gorontalo)',
        'researchers': 'Dr. Ayuba Pantu & Dr. H. Muh. Arif (2015)',
        'manuscript_code': 'Naskah D (Koleksi Mustapa Taha)',
        'location': 'Kecamatan Pulubala / Desa Batulayar, Gorontalo',
        'edition_scope': 'Bab IV.C Halaman 27-92 (Halaman PDF 31-95) — Naskah D Komprehensif Lengkap Tanpa Diringkas (Unabridged)',
        'total_sairs': len(sairs),
        'total_units': total_units_count,
        'total_jabu': total_jabu_count,
        'total_gorontalo_units': total_gorontalo_count,
        'curation_status': 'Verified Philological Edition, 100% Unabridged Naskah D, Zero OCR Noise'
    }

    return {'metadata': metadata, 'sairs': sairs}

def export_all():
    data = compile_corpus()
    total_sairs = len(data['sairs'])
    total_units = data['metadata']['total_units']
    print(f"=== KORPUS NASKAH D LENGKAP ===")
    print(f"Total Sair: {total_sairs}")
    print(f"Total Unit: {total_units}")
    print(f"Total Jābu: {data['metadata']['total_jabu']}")
    print(f"Total Gorontalo Units: {data['metadata']['total_gorontalo_units']}")
    
    for s in data['sairs']:
        print(f"  Sair {s['sair_number']:02d} ({s['sair_letter']}): {s['sair_title']} -> {s['total_units']} unit | Jābu: {s['jabu_recorded']} | Gorontalo: {s['gorontalo_sections_recorded']}")

    # Destination directories
    targets = [
        '/content/dikili2',
        '/content/dikili_app',
        '/content/naskah_d_curation'
    ]

    for t in targets:
        os.makedirs(t, exist_ok=True)
        os.makedirs(os.path.join(t, 'js'), exist_ok=True)
        os.makedirs(os.path.join(t, 'curation'), exist_ok=True)
        
        # Write data.json
        with open(os.path.join(t, 'data.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        # Write js/data.js
        with open(os.path.join(t, 'js', 'data.js'), 'w', encoding='utf-8') as f:
            f.write('window.DIKILI_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
            
        # Write curation/naskah_d_complete.json
        with open(os.path.join(t, 'curation', 'naskah_d_complete.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # Build CSV for dikili2/curation/ and others
    csv_rows = []
    for s in data['sairs']:
        for u in s['units']:
            csv_rows.append({
                'unit_id': u['unit_id'],
                'sair_number': s['sair_number'],
                'sair_letter': s['sair_letter'],
                'sair_title': s['sair_title'],
                'unit_order': u['unit_order'],
                'unit_type': u['unit_type'],
                'text_arabic': u.get('text_arabic', ''),
                'transliteration_latin': u.get('transliteration_latin', ''),
                'translation_indonesian': u.get('translation_indonesian', ''),
                'text_gorontalo': u.get('text_gorontalo', ''),
                'doc_pages': f"{s['doc_pages'][0]}-{s['doc_pages'][1]}",
                'pdf_pages': f"{s['pdf_pages'][0]}-{s['pdf_pages'][1]}"
            })

    for t in targets:
        csv_path = os.path.join(t, 'curation', 'naskah_d_corpus.csv')
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'unit_id', 'sair_number', 'sair_letter', 'sair_title', 'unit_order',
                'unit_type', 'text_arabic', 'transliteration_latin', 'translation_indonesian',
                'text_gorontalo', 'doc_pages', 'pdf_pages'
            ])
            writer.writeheader()
            writer.writerows(csv_rows)

    # Generate Full Readable Transcription (.txt)
    txt_content = []
    txt_content.append("="*80)
    txt_content.append("TRANSKRIPSI LENGKAP SUNTEK NASKAH D (DIKILI GORONTALO)")
    txt_content.append("Sumber: Dr. Ayuba Pantu & Dr. H. Muh. Arif (2015), Bab IV.C hlm 27-92")
    txt_content.append("Naskah D: 17 Sair Lengkap (Unabridged) Beserta Jābu dan Narasi Hikayat")
    txt_content.append("="*80 + "\n")

    for s in data['sairs']:
        txt_content.append(f"\n{'='*60}")
        txt_content.append(f"{s['sair_title'].upper()} ({s['sair_letter'].upper()})")
        txt_content.append(f"Halaman Dokumen: {s['doc_pages'][0]}-{s['doc_pages'][1]} | PDF: {s['pdf_pages'][0]}-{s['pdf_pages'][1]}")
        txt_content.append(f"Ringkasan: {s['theme_summary']}")
        txt_content.append(f"{'='*60}\n")
        
        for u in s['units']:
            txt_content.append(f"[{u['unit_id']}] (Tipe: {u['unit_type']})")
            if u.get('text_arabic'):
                txt_content.append(f"Arab:\n{u['text_arabic']}")
            if u.get('transliteration_latin'):
                txt_content.append(f"Transliterasi:\n{u['transliteration_latin']}")
            if u.get('text_gorontalo'):
                txt_content.append(f"Teks Gorontalo:\n{u['text_gorontalo']}")
            if u.get('translation_indonesian'):
                txt_content.append(f"Terjemahan:\n{u['translation_indonesian']}")
            txt_content.append("-" * 40)

    for t in targets:
        txt_path = os.path.join(t, 'curation', 'naskah_d_transkripsi_lengkap.txt')
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(txt_content))

    print("\n[V] Semua berkas data, JSON, JS, CSV, dan Transkripsi berhasil di-export ke seluruh target!")

if __name__ == '__main__':
    export_all()
