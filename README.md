# Sistem Publikasi Dosen FTI — Kelompok B14

Aplikasi manajemen publikasi dosen Fakultas Teknologi Informasi, Universitas
Andalas. Sistem ini digunakan untuk mengelola data publikasi dosen — mulai
dari pendataan, pengelolaan penulis, hingga proses approval oleh dosen
anggota — dengan dukungan export laporan dalam berbagai format.

Dibangun sebagai Tugas Besar mata kuliah Pemrograman Web.

## Deskripsi Aplikasi

Sistem Publikasi Dosen FTI memungkinkan dosen untuk:

- Mencatat dan mengelola data publikasi ilmiah (jurnal, prosiding, dll)
- Mengelola data penulis yang terlibat dalam tiap publikasi
- Mengajukan dan memproses approval publikasi antar dosen anggota
- Mengekspor data publikasi maupun penulis ke berbagai format dokumen
  (PDF, DOCX, Excel)
- Mengakses data publikasi melalui REST API (response JSON)

### Tech Stack

| Komponen | Teknologi |
|---|---|
| Backend | Express.js (Node.js) |
| Database | MySQL / MariaDB (native `mysql2`, tanpa ORM) |
| Frontend UI | Basecoat UI + EJS templating |
| Autentikasi | express-session + bcryptjs |
| Export dokumen | PDFKit (PDF), docx (Word), ExcelJS (Excel) |
| Testing | Playwright |
| Version Control | Git & GitHub |

## Cara Instalasi dan Menjalankan Aplikasi

### Prasyarat

- Node.js (v18 ke atas direkomendasikan)
- MySQL atau MariaDB yang sudah berjalan secara lokal
- Database sesuai skema yang disediakan dosen pengampu (lihat ERD pada
  dokumen tugas besar)

### Langkah instalasi

1. **Clone repository**

   ```bash
   git clone https://github.com/nailaamuthia/facultyware.git
   cd facultyware
   ```

2. **Install dependency**

   ```bash
   npm install
   ```

3. **Konfigurasi environment**

   Buat file `.env` di root project dengan isi berikut (sesuaikan dengan
   konfigurasi MySQL/MariaDB lokal kamu):

   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=facultyware
   SESSION_SECRET=facultyware_b14
   ```

4. **Import database**

   Import skema dan data awal sesuai SQL yang disediakan dosen pengampu
   ke database `facultyware` (atau sesuai nama yang diisi pada `DB_NAME`).

5. **Jalankan aplikasi**

   ```bash
   # mode development (auto-restart saat ada perubahan)
   npm run dev

   # atau mode production
   npm start
   ```

   Aplikasi dapat diakses di `http://localhost:3000`.

6. **Login**

   Gunakan akun dosen yang sudah terdaftar di database. Akun baru dapat
   ditambahkan langsung melalui database sesuai struktur tabel `users`.

### Menjalankan Testing

Test otomatis menggunakan Playwright tersedia untuk modul Publikasi.
Lihat panduan lengkap di [`tests/README.md`](./tests/README.md).

```bash
npx playwright install chromium
npm test
```

## Struktur Project

```
facultyware/
├── bin/                 # entry point server
├── controllers/         # logic tiap modul (publikasi, export, import, dll)
├── lib/                 # koneksi database
├── middlewares/         # autentikasi & ACL
├── public/              # asset statis (CSS, JS, gambar)
├── routes/               # definisi endpoint
├── tests/               # test suite Playwright
├── views/                # template EJS
│   ├── partials/         # komponen bersama (sidebar, topbar)
│   └── publikasi/        # halaman modul Publikasi
└── app.js
```

## Pembagian Tugas Anggota — Kelompok B14

| Nama | NIM | Modul / Fitur |
|---|---|---|
| **Naila Muthia Danisha** | 2411523029 | **Manajemen Publikasi** — daftar, tambah, detail, edit, export PDF/DOCX, dan REST API publikasi (GET/POST/PUT/DELETE) |
| **Muhammad Ikhsan** | 2411522038 | **Manajemen Penulis Publikasi** — tambah, daftar, detail, hapus, export Excel/CSV, dan REST API penulis (GET/POST/PUT/DELETE) |
| **Salmiah Afifah** | 2411523005 | **Approval Publikasi** — daftar undangan, detail, approval (setuju/tolak), riwayat approval, export PDF, dan REST API approval (GET/POST/PUT) |

Kontribusi masing-masing anggota dapat dilihat melalui riwayat commit pada
repository ini.

## Dokumen Pendukung

- Daftar fitur lengkap beserta penanggung jawab: lihat `List_Fitur_B14.xlsx`
- Laporan hasil testing: lihat folder `playwright-report/` (hasil testing
  Playwright)
- Laporan deployment: dokumen terpisah (format PDF)

---

Tugas Besar Pemrograman Web — Fakultas Teknologi Informasi, Universitas Andalas
