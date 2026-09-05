<div align="center">

  # Food Waste Management Platform
  ### Menghubungkan merchant, konsumen, mitra energi, dan kurir dalam satu ekosistem pengelolaan sisa makanan yang lebih efisien, terukur, dan berdampak sosial.

  [![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Coming_Soon-success?style=for-the-badge)](#)
  [![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/your-username/food-waste-management-platform)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  **Submission for ITECHNO CUP 2026 - Web Development**

  **By CTRL + S Team**

</div>


## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Role dan Fitur](#-role-dan-fitur)
- [Fitur Unggulan](#-fitur-unggulan)
- [Screenshot Aplikasi](#-screenshot-aplikasi)
- [Teknologi](#️-teknologi)
- [Arsitektur Sistem](#️-arsitektur-sistem)
- [Instalasi dan Setup](#️-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [Testing](#-testing)

## 🎯 Tentang Proyek

### Latar Belakang

Sisa makanan masih menjadi masalah yang cukup serius dalam rantai kuliner dan distribusi makanan harian. Di satu sisi, banyak merchant atau bisnis kuliner memiliki stok makanan yang belum sempat terjual dan berpotensi menjadi limbah. Di sisi lain, terdapat masyarakat yang membutuhkan makanan dengan harga terjangkau, panti asuhan yang memerlukan dukungan pangan, serta komunitas pengolah energi yang membutuhkan limbah organik sebagai bahan baku. Kondisi ini menimbulkan kehilangan nilai ekonomi, sosial, dan lingkungan yang seharusnya dapat dioptimalkan.

Food Waste Management Platform dirancang sebagai solusi digital yang menghubungkan berbagai pihak dalam satu ekosistem terintegrasi. Platform ini memungkinkan sisa makanan dikelola secara lebih terstruktur melalui sistem penilaian tier, pelacakan status secara real-time, pemanfaatan teknologi QR Code, serta dashboard analitik berbasis ESG. Dengan pendekatan ini, makanan yang semula berpotensi menjadi limbah dapat dipindahkan ke jalur yang lebih bermanfaat, baik untuk dijual dengan diskon, didonasikan, maupun diolah menjadi energi.

### Solusi yang Ditawarkan

Platform ini menghadirkan model pengelolaan sisa makanan berbasis role dan alur kerja yang jelas. Merchant dapat mengunggah sisa makanan, menetapkan waktu masak, serta mengklasifikasikannya ke dalam Tier 1, Tier 2, atau Tier 3 sesuai tujuan pemanfaatannya. Konsumen dan panti asuhan dapat menemukan penawaran makanan terdekat melalui peta interaktif, sedangkan mitra energi dapat mengakses lokasi limbah organik yang siap diklaim. Kurir lokal juga terlibat untuk membantu pemindahan barang secara cepat dan aman. Semua proses didukung oleh sistem QR Code, verifikasi handover, serta otomatisasi status yang memudahkan pemantauan dari awal hingga akhir.

### Tujuan Proyek

## 👥 Role dan Fitur

Platform ini dibuat untuk beberapa pihak yang saling terhubung. Setiap role memiliki tugas dan tampilan yang berbeda, sehingga makanan surplus bisa bergerak dari merchant ke penerima yang tepat atau ke mitra pengolah energi.

### 1. Admin

Admin bertugas menjaga data pengguna dan memastikan ekosistem berjalan dengan baik.

- Melihat seluruh pengguna yang terdaftar.
- Mencari dan memfilter pengguna berdasarkan nama, email, atau role.
- Mengubah role pengguna, misalnya menjadi merchant, organisasi/panti, konsumen, kurir, atau pengolah energi.
- Melihat ringkasan jumlah pengguna, merchant, dan organisasi/panti.
- Memantau data transaksi melalui halaman transaksi admin.

### 2. Merchant atau Mitra Kuliner

Merchant adalah restoran, kafe, bakery, hotel, atau usaha kuliner lain yang memiliki makanan surplus. Merchant dapat menentukan jalur terbaik untuk setiap makanan.

- Menambahkan makanan surplus lengkap dengan stok, waktu masak, lokasi, dan batas kedaluwarsa.
- Mengelompokkan makanan ke dalam tiga tier:
  - **Tier 1:** dijual dengan harga diskon, sekitar 50-70% lebih murah.
  - **Tier 2:** disalurkan sebagai donasi untuk panti atau warga yang membutuhkan.
  - **Tier 3:** dikirim ke mitra pengolah untuk dijadikan biogas, kompos, atau pakan maggot BSF.
- Melihat status stok dan pesanan yang sedang berjalan.
- Menampilkan QR Code handover untuk dipindai kurir saat mengambil makanan.
- Melacak alur serah terima dari QR aktif, dipindai, diambil, sampai terkirim.
- Menerima notifikasi ketika makanan dipesan, diambil, atau sudah diterima.

### 3. Konsumen Umum

Konsumen umum dapat membeli makanan surplus yang masih layak makan dengan harga lebih terjangkau.

- Melihat makanan Tier 1 di peta berdasarkan lokasi dan jarak.
- Melihat informasi merchant, stok, harga diskon, dan jarak dari lokasi konsumen.
- Memilih jumlah porsi dan membuat pesanan.
- Melihat rincian harga makanan, upah kurir, dan total pembayaran.
- Melacak pesanan melalui menu Pesanan Saya.
- Membatalkan pesanan yang masih menunggu pembayaran; stok akan dikembalikan ke sistem.
- Melihat status pengantaran hingga makanan diterima.

### 4. Penerima Manfaat atau Panti

Role ini ditujukan untuk panti asuhan, komunitas sosial, atau penerima manfaat yang membutuhkan bantuan pangan.

- Melihat donasi Tier 2 yang tersedia di sekitar lokasi panti.
- Melihat jarak, stok, dan informasi merchant penyumbang.
- Mengklaim makanan gratis dengan menentukan jumlah penerima.
- Memakai kuota klaim mingguan agar pembagian donasi tetap teratur.
- Membeli makanan dengan harga sosial jika tersedia.
- Menambahkan catatan untuk membantu proses pengantaran.
- Melihat riwayat klaim dan status pengiriman sampai donasi diterima.

### 5. Kurir Relawan atau Penjemput

Kurir menghubungkan merchant, konsumen, panti, dan fasilitas pengolah energi di lapangan.

- Melihat daftar misi pengantaran yang masih terbuka.
- Memfilter misi berdasarkan jenis pengantaran.
- Mengambil misi yang ingin dikerjakan.
- Melihat titik penjemputan, tujuan, jarak, dan rute perjalanan.
- Memperbarui status perjalanan dari siap, menjemput, sampai mengantar.
- Memindai QR Code handover untuk memastikan barang diambil dari pihak yang benar.
- Melihat misi yang sudah selesai dan menghitung pendapatan kurir.

### 6. Mitra Pengolah Limbah dan Energi

Mitra pengolah energi menerima makanan yang sudah masuk Tier 3 dan mengubahnya menjadi sesuatu yang bermanfaat bagi lingkungan.

- Melihat daftar limbah organik Tier 3 pada peta.
- Melihat jarak fasilitas ke lokasi merchant dan jumlah stok yang tersedia.
- Memilih jumlah limbah yang ingin diklaim.
- Melihat perkiraan berat limbah, potensi biogas, potensi maggot, dan CO2e yang dapat dicegah.
- Menjadwalkan pickup melalui kurir mitra secara gratis.
- Melihat riwayat pemesanan dan status pengiriman limbah.
- Menggunakan QR handover saat limbah tiba dan QR verifikasi saat limbah diterima fasilitas.

## Alur Aplikasi

### 1. Pengguna membuat akun

Pengguna melakukan registrasi dengan email dan kata sandi. Setelah berhasil, pengguna masuk ke proses onboarding untuk memilih role dan melengkapi nama, nomor telepon, alamat, serta informasi tambahan yang sesuai dengan role-nya.

Onboarding juga dapat mengambil lokasi perangkat. Koordinat tersebut diterjemahkan menjadi alamat menggunakan reverse geocoding OpenStreetMap agar lokasi lebih mudah dipahami.

### 2. Sistem menentukan akses

Setiap role memiliki dashboard dan halaman yang berbeda. Middleware memeriksa sesi Supabase, membaca role dari profil, lalu mengarahkan pengguna ke halaman yang sesuai. Pengguna yang belum melengkapi profil diarahkan kembali ke onboarding.

Dengan begitu, merchant tidak masuk ke halaman kurir, dan pengguna umum tidak dapat membuka halaman admin secara langsung.

### 3. Merchant memasukkan makanan surplus

Merchant mengisi nama makanan, jumlah stok, kondisi makanan, harga jika akan dijual, dan lokasi. Nama usaha dapat diambil dari profil sehingga tidak perlu ditulis berulang kali.

Merchant dapat memakai halaman **Klasifikasi Tier** untuk mendapatkan rekomendasi jalur makanan. Hasil klasifikasi dapat disimpan ke Supabase dan kemudian muncul di dashboard serta peta.

### 4. Makanan masuk ke salah satu jalur

| Tier | Jalur | Penjelasan |
| --- | --- | --- |
| **Tier 1** | Marketplace surplus | Makanan yang masih sangat baik ditawarkan dengan harga diskon untuk konsumen umum. |
| **Tier 2** | Donasi | Makanan yang masih layak konsumsi disalurkan kepada panti atau penerima manfaat. |
| **Tier 3** | Bio-energi | Sisa organik yang tidak lagi cocok untuk dijual atau didonasikan diarahkan ke mitra pengolah. |

Klasifikasi di aplikasi menggunakan kondisi makanan sebagai dasar rekomendasi: sangat baik diarahkan ke Tier 1, layak konsumsi ke Tier 2, dan kondisi yang tidak cocok untuk konsumsi ke Tier 3.

### 5. Konsumen atau penerima manfaat membuat pesanan

Konsumen umum dapat membeli makanan Tier 1. Panti atau penerima manfaat dapat mencari dan mengklaim makanan Tier 2. Sistem mengunci stok saat pesanan dibuat agar stok yang sama tidak dipesan oleh dua pihak sekaligus.

Pesanan yang belum diselesaikan dapat dibatalkan sesuai statusnya. Saat pesanan kedaluwarsa atau dibatalkan, stok dapat dikembalikan sehingga tetap tersedia untuk alur berikutnya.

### 6. Sistem membuat misi pengantaran

Setelah pesanan atau klaim dibuat, informasi pengantaran disimpan sebagai misi kurir. Misi memuat titik jemput, tujuan, jenis pengantaran, dan data pesanan yang terkait.

Kurir dapat melihat misi yang masih terbuka, mengambil misi, memperbarui status perjalanan, lalu menyelesaikan pengantaran.

### 7. Serah terima dicatat dengan QR Code

QR Code digunakan sebagai identitas proses handover antara merchant, kurir, dan penerima. Tahapan pengambilan dan pengiriman menjadi lebih mudah dilacak karena setiap pihak memiliki titik konfirmasi yang jelas.

### 8. Data dan dampak dapat dipantau

Data makanan, pesanan, misi kurir, pengguna, serta statusnya tersimpan di Supabase. Peta dan dashboard membaca data tersebut sehingga perubahan baru dapat ditampilkan tanpa harus mengandalkan pencatatan manual.


## ✨ Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan |
|----------|--------------|---------------|
| **Manajemen Merchant & Tiering** | Merchant dapat mengunggah sisa makanan, mengatur prep_time, dan mengkategorikannya ke Tier 1 (diskon), Tier 2 (donasi), atau Tier 3 (limbah energi). | Membantu bisnis mengelola sisa makanan secara lebih strategis dan sesuai dengan tujuan pemanfaatan. |
| **Dashboard Analytics ESG** | Menyediakan visualisasi pendapatan tambahan, total kg sampah yang dicegah, serta estimasi konversi biogas. | Memberikan gambaran dampak lingkungan dan sosial yang nyata kepada pengguna platform. |
| **Peta Interaktif Berbasis Lokasi** | Konsumen, panti asuhan, dan mitra energi dapat melihat penawaran makanan atau limbah organik terdekat dengan filter radius 1 km hingga 5 km. | Mempercepat proses pencarian, klaim, dan distribusi barang secara efisien. |
| **QR Code & OTP Handover** | Setiap proses penjemputan dan penyerahan barang dapat diverifikasi melalui QR Code serta OTP untuk memastikan keamanan transaksi. | Meningkatkan akurasi pencatatan dan mengurangi potensi kesalahan penyerahan. |
| **Automasi Status & Cron Job** | Sistem secara otomatis mengubah item yang melewati batas waktu kedaluwarsa menjadi Tier 3 tanpa intervensi manual. | Mengurangi beban administrasi dan memastikan alur kerja tetap konsisten. |

## Fitur Pendukung

### Peta spasial dan pencarian lokasi

Halaman **Peta Spasial** menampilkan makanan surplus yang memiliki koordinat valid pada peta Leaflet berbasis OpenStreetMap. Pengguna dapat:

- mencari berdasarkan nama makanan atau alamat;
- memfilter tampilan berdasarkan Tier 1, Tier 2, dan Tier 3;
- memilih marker untuk melihat detail makanan;
- memusatkan peta ke lokasi makanan terpilih;
- menggunakan lokasi perangkat sebagai pusat peta;
- melihat total titik, volume stok, dan jumlah item per tier;
- menerima item baru tanpa refresh ketika ada data baru di database.

### Klasifikasi makanan berbasis kondisi

Halaman **Klasifikasi Tier** menyediakan form yang membantu merchant menentukan jalur makanan. Hasilnya menampilkan rekomendasi tier, deskripsi alasan, aksi berikutnya, serta estimasi dampak seperti porsi terselamatkan, penerima manfaat, biogas, dan CO2e yang dihindari.

Klasifikasi ini merupakan rekomendasi berbasis aturan aplikasi, bukan model machine learning. Setelah ditinjau merchant, hasilnya dapat disimpan sebagai data makanan surplus.

### Autentikasi dan perlindungan halaman

- Registrasi dan login menggunakan Supabase Auth.
- Dukungan callback autentikasi untuk proses OAuth.
- Sesi pengguna dipertahankan melalui cookie Supabase SSR.
- Middleware melindungi halaman yang membutuhkan login.
- Akses halaman diarahkan berdasarkan role.
- Pengguna tanpa profil lengkap diarahkan ke onboarding.
- Akun dengan status pending memiliki alur akses tersendiri.
- Logout menggunakan modal konfirmasi dan notifikasi hasil proses.

### Profil dan onboarding

Pengguna dapat mengisi atau memperbarui data profil, melihat role yang dimiliki, serta menyimpan informasi kontak dan alamat. Progress bar pada onboarding membantu pengguna mengetahui kelengkapan data sebelum mengirim formulir.

### Notifikasi dan pengalaman antarmuka

Aplikasi menyediakan toast untuk memberi tahu pengguna ketika proses berhasil, gagal, atau membutuhkan perhatian. Beberapa halaman juga memiliki loading state, animasi perpindahan, modal konfirmasi, serta layout responsif untuk desktop dan perangkat mobile.

### Tema tampilan

Tema terang dan gelap tersedia melalui `next-themes`. Pengguna dapat mengganti tema dari shell aplikasi tanpa mengubah alur kerja utama.



## 📸 Screenshot Aplikasi

### Dashboard Admin

![Dashboard Admin](public/screenshots/admin.png)

*Contoh tampilan pengelolaan pengguna dan role oleh admin.*

### Dashboard Merchant

![Dashboard Merchant](public/screenshots/merchant.png)

*Contoh tampilan pengelolaan makanan surplus, tier, stok, dan QR handover.*

### Dashboard Konsumen Umum

![Dashboard Konsumen Umum](public/screenshots/konsumen-umum.png)

*Contoh tampilan pencarian makanan diskon, checkout, dan pelacakan pesanan.*

### Dashboard Panti atau Penerima Manfaat

![Dashboard Panti](public/screenshots/panti.png)

*Contoh tampilan pencarian donasi, klaim makanan, kuota, dan riwayat pengiriman.*

### Dashboard Kurir

![Dashboard Kurir](public/screenshots/kurir.png)

*Contoh tampilan daftar misi, peta rute, status perjalanan, dan pendapatan.*

### Dashboard Pengolah Energi

![Dashboard Pengolah Energi](public/screenshots/energi.png)

*Contoh tampilan klaim limbah Tier 3, estimasi dampak, jadwal pickup, dan QR verifikasi.*

## 🛠️ Teknologi

### Tech Stack

#### Frontend
```
Framework    : Next.js App Router
Language     : TypeScript
UI Library   : Tailwind CSS
State Mgmt   : React Context / future API integration
Validation   : TypeScript + form validation layer (planned)
```

#### Backend
```
Runtime      : Supabase dan Next.js
Database     : PostgreSQL melalui Supabase
Authentication: Supabase Auth
Storage      : Supabase client dari aplikasi Next.js
```

#### DevOps & Tools
```
Deployment   : Vercel atau server Node.js
CI/CD        : GitHub Actions (planned)
Testing      : ESLint dan TypeScript check
Monitoring   : Sentry / logging service (planned)
```

### Alasan Pemilihan Teknologi

| Teknologi | Alasan Pemilihan |
|-----------|------------------|
| **Next.js** | Memungkinkan pengembangan aplikasi web modern dengan performa tinggi, routing yang terstruktur, dan dukungan deployment yang cepat. |
| **TypeScript** | Meningkatkan kualitas kode, memudahkan pemeliharaan, dan mengurangi risiko kesalahan logika pada sistem yang kompleks. |
| **Tailwind CSS** | Mempercepat pengembangan UI yang konsisten dan responsif tanpa menambah kompleksitas pada desain. |

### Dependencies Utama

```json
{
  "dependencies": {
    "next": "^16",
    "react": "^19",
    "react-dom": "^19"
  }
}
```


## 🏗️ Arsitektur Sistem

### System Architecture

```mermaid
flowchart LR
    A[Merchant] --> B[Food Waste Management Platform]
    C[Konsumen / Panti Asuhan] --> B
    D[Mitra Pengolah Energi] --> B
    E[Rescue Courier] --> B
    F[Admin / Cron Job] --> B
    B --> G[(Database)]
    B --> H[QR Code / OTP / Geo Spatial Map / ESG Analytics]
```

### Database Schema

Sistem ini mencakup beberapa entitas utama, antara lain:


### Folder Structure

```
project-root/
├── app/                  # Halaman, layout, routing, dan callback autentikasi
├── components/           # Komponen UI yang digunakan bersama
├── lib/                  # Client Supabase dan helper aplikasi
├── public/               # Asset statis
├── middleware.ts         # Pemeriksaan session dan pembatasan akses halaman
├── next.config.ts        # Konfigurasi Next.js
├── package.json          # Dependensi dan script project
└── tsconfig.json         # Konfigurasi TypeScript
```


## ⚙️ Instalasi & Setup

### Prerequisites

Sebelum menjalankan project, siapkan:

- **Node.js 20.9 atau lebih baru**. Versi LTS paling baru juga bisa digunakan.
- **npm**, yang biasanya sudah ikut terpasang bersama Node.js.
- **Akun Supabase** dan satu project Supabase untuk menyimpan data aplikasi.
- **API key Google Maps**, jika ingin menggunakan fitur peta yang membutuhkan Google Maps.

Cek versi Node.js dan npm dengan perintah berikut:

```bash
node --version
npm --version
```

Project ini menggunakan Next.js, React, TypeScript, Tailwind CSS, Supabase, Leaflet, dan Google Maps. Dependensi tersebut akan terpasang otomatis saat menjalankan `npm install`.

### Langkah Instalasi

#### 1. Clone repository

```bash
git clone https://github.com/MieGantenk/Itechno_cup_CTRL_S_SMKIT_ASSYIFA.git
cd pangan-cerdas
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Buat file environment

Buat file bernama `.env.local` di folder utama project. Jangan upload file ini ke GitHub karena berisi konfigurasi akses aplikasi.

```env
# URL project Supabase
NEXT_PUBLIC_SUPABASE_URL="https://rxcfslvuqdkfydyvgvjp.supabase.co"

# Anon/public key dari Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2ZzbHZ1cWRrZnlkeXZndmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDIwNjIsImV4cCI6MjEwMDgxODA2Mn0.mFvHvjTM6O09Zi5K3W1StNUy7jZEZcxB5keuC3_RHJM"
```

Nilai Supabase dapat ditemukan di **Supabase Dashboard > Project Settings > API**. Gunakan **Project URL** dan **anon public key**. Jangan gunakan `service_role key` di browser.

Untuk Google Maps, buat API key di Google Cloud Console dan aktifkan API yang diperlukan oleh fitur peta. Jika hanya ingin mencoba halaman yang menggunakan Leaflet, variabel Google Maps dapat dikosongkan.

#### 4. Siapkan Supabase

Project ini membaca dan menulis data langsung ke Supabase. Karena folder `supabase/` di repository belum berisi migration, siapkan tabel dan policy yang dibutuhkan menggunakan schema/database setup yang dipakai oleh tim project.

Di Supabase, pastikan Authentication aktif. Untuk login Google, tambahkan URL berikut pada **Authentication > URL Configuration**:

```text
http://localhost:3000/auth/callback
```

Saat aplikasi sudah dideploy, tambahkan juga URL callback versi production:

```text
https://domain-anda.com/auth/callback
```

#### 5. Jalankan mode development

```bash
npm run dev
```

Setelah server siap, buka [http://localhost:3000](http://localhost:3000) di browser. Saat file kode diubah, halaman akan diperbarui otomatis.

Jika port `3000` sedang dipakai, jalankan project di port lain:

```bash
npm run dev -- --port 3001
```

Kemudian buka [http://localhost:3001](http://localhost:3001).

### Menjalankan versi production

Untuk memastikan project bisa dibuild sebelum dibagikan atau dideploy, jalankan:

```bash
npm run build
npm run start
```

Perintah pertama membuat build production, sedangkan perintah kedua menjalankan hasil build tersebut. Secara default, aplikasi tersedia di [http://localhost:3000](http://localhost:3000).

Pada server atau layanan hosting, masukkan tiga environment variable yang sama ke pengaturan project hosting. Jangan hanya mengandalkan file `.env.local` karena file tersebut biasanya tidak ikut ter-upload.

### Pemeriksaan sebelum dibagikan

```bash
# Memeriksa kualitas kode
npm run lint

# Memastikan project dapat dikompilasi
npm run build
```

Jika kedua perintah selesai tanpa error, project siap dicoba oleh orang lain melalui server lokal, hosting, atau deployment seperti Vercel.


## 🚀 Penggunaan

### Menjalankan Aplikasi

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

### User Guide

#### Untuk Merchant

1. **Daftar dan login** ke akun merchant.
2. **Unggah sisa makanan** beserta informasi prep_time, lokasi, dan estimasi kedaluwarsa.
3. **Pilih tier** sesuai tujuan pemanfaatan: Tier 1 untuk penjualan diskon, Tier 2 untuk donasi, atau Tier 3 untuk limbah energi.
4. **Buat QR Code** saat barang siap dijemput.

#### Untuk Konsumen & Panti Asuhan

1. **Buka peta interaktif** untuk melihat penawaran makanan terdekat.
2. **Pilih item** dengan kategori Tier 1 atau Tier 2 sesuai kebutuhan.
3. **Lakukan klaim atau pembelian** melalui sistem yang tersedia.
4. **Verifikasi penerimaan** barang saat kurir datang menggunakan QR Code atau OTP.

#### Untuk Admin

1. **Kelola akun** merchant, kurir, dan mitra yang mendaftar.
2. **Pantau status sistem** dan pastikan alur workflow berjalan sesuai aturan.
3. **Lakukan pemantauan otomatis** terhadap batas waktu kedaluwarsa melalui cron job.


## 🔐 Data dan Autentikasi

Aplikasi menggunakan **Supabase Auth** untuk proses register, login, dan login Google. Data profil, makanan, pesanan, misi kurir, serta data pendukung lainnya dibaca dan disimpan ke tabel Supabase dari halaman aplikasi.

Saat menambahkan fitur baru yang memakai data Supabase, pastikan tabel, kolom, dan policy Row Level Security sudah tersedia di project Supabase yang digunakan. Repository ini belum menyediakan migration otomatis, sehingga konfigurasi database perlu disiapkan terpisah oleh pemilik project.


## 🧪 Testing

### Running Tests

```bash
npm run lint
```

### Rencana Pengujian


Saat ini, proyek masih fokus pada fondasi arsitektur dan pengembangan fitur inti. Pengujian otomatis akan diperluas seiring perkembangan platform.


## 👥 Tim Developer

| Nama | Peran | Medsos |
|------|-------|--------|

| Muhammad Farel Alghifary | Full-Stack | - |
| Razan Arafi Maulana | Full-Stack | [LinkedIn](https://www.linkedin.com/in/razan-arafi-maulana-194936416/) |
| Hizby Fauzan 'Aisyi | Full-Stack | - |


## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.


<div align="center">

  Made by CTRL + S Team for ITECHNO CUP 2026


</div>
