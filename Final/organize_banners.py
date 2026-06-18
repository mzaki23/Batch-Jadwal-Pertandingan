import os
import shutil
import sys

def organize_banners(source_dir=None):
    # Menggunakan parameter input, atau mengambil dari command line argumen, atau default folder saat ini
    if source_dir is None:
        source_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    source_dir = os.path.abspath(source_dir)
    moved_count = 0

    print("=========================================")
    print("Memulai proses merapikan folder...")
    print(f"Direktori Target: {source_dir}")
    print("=========================================\n")

    if not os.path.exists(source_dir):
        print(f"Error: Folder '{source_dir}' tidak ditemukan!")
        return

    for filename in os.listdir(source_dir):
        # Hanya proses file gambar
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            # Pastikan file adalah bagian dari aset banner
            if "Pop Up Banner" in filename or "Banner DigiPOS" in filename:
                if "_" in filename:
                    # Mengambil bagian sebelum underscore -> "260612 - FIFA World Cup - 13 Juni 2026"
                    base_name = filename.split('_')[0].strip()
                    
                    # Mengambil HANYA tanggalnya saja (teks setelah tanda '-' terakhir) -> "13 Juni 2026"
                    folder_name = base_name.split('-')[-1].strip()
                    
                    folder_path = os.path.join(source_dir, folder_name)
                    
                    # Buat folder jika belum ada
                    if not os.path.exists(folder_path):
                        os.makedirs(folder_path)
                    
                    old_file_path = os.path.join(source_dir, filename)
                    new_file_path = os.path.join(folder_path, filename)
                    
                    # Penanganan duplikat: agar tidak menimpa file yang sudah ada secara tidak sengaja
                    if os.path.exists(new_file_path):
                        name, ext = os.path.splitext(filename)
                        counter = 1
                        while os.path.exists(os.path.join(folder_path, f"{name}_{counter}{ext}")):
                            counter += 1
                        new_file_path = os.path.join(folder_path, f"{name}_{counter}{ext}")
                        filename_display = f"{name}_{counter}{ext}"
                        print(f"[DUPLIKAT] Mengganti nama duplikat ke: {filename_display}")
                    else:
                        filename_display = filename
                    
                    # Pindahkan file
                    shutil.move(old_file_path, new_file_path)
                    print(f"Memindahkan: '{filename}' ---> Folder: '[ {folder_name} ]'")
                    
                    moved_count += 1

    print("\n=========================================")
    print(f"Proses selesai!")
    print(f"Berhasil mengelompokkan {moved_count} file ke dalam folder per tanggal.")
    print("=========================================")

if __name__ == "__main__":
    organize_banners()