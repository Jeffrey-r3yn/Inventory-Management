# SmartInventory PWA

Aplikasi inventaris multi-brand untuk manager dan staff, diadaptasi dari
[housemerchant2/Inventory-Management](https://github.com/housemerchant2/Inventory-Management)
(commit acuan `dfd062a0d4dc5defaa1ebf7e0f17828b53be7cf2`).
React, TypeScript, Vite, Tailwind, Supabase Auth/Postgres, dan PWA Workbox.

## Menjalankan

Node.js 22 atau 24, npm, dan browser Chromium untuk pengujian PWA.

```bash
npm ci
npm run dev -- --host 0.0.0.0
npm run build
npm test
```

Tanpa konfigurasi Supabase, aplikasi memakai **mode demo lokal**. Perubahan demo
tersimpan di localStorage; mode ini tidak menyimpan data ke server.
Checkout cloud sudah terisolasi: gunakan checkout yang tersedia, tanpa membuat worktree.

## Supabase (proyek yang sudah ada)

Target: `https://pcwxpfheysgzyvvzndez.supabase.co`.

1. Jalankan `supabase/schema.sql` di SQL Editor proyek yang dipilih. Skema memakai
   nama `inventory_*` agar tidak menimpa tabel aplikasi lain. Migration dapat dijalankan ulang.
   Skema juga membuat profil staff untuk akun Auth yang sudah ada; gunakan proyek
   khusus inventory jika akun proyek tersebut melayani aplikasi lain.
2. Buat akun manager/staff melalui **Authentication → Users**. Aplikasi memakai
   email dan kata sandi. Tidak ada pendaftaran publik dalam UI.
3. Tetapkan manager pertama secara eksplisit di SQL Editor:

   ```sql
   update public.inventory_users
   set role = 'manager'
   where id = '<UUID akun manager dari Authentication>';
   ```

4. Salin `.env.example` ke `.env.local`, isi `VITE_SUPABASE_URL` dan
   `VITE_SUPABASE_ANON_KEY` dari API settings. Keduanya adalah konfigurasi klien publik;
   **jangan gunakan service_role/secret key**. Restart Vite setelah mengubahnya.
5. Login, buat brand, setujui brand, assign staff, lalu tambah item dan transaksi.
   Akun baru otomatis berperan staff. Hanya manager yang dapat mengubah peran.

RLS menolak akses anonim, membatasi staff ke brand yang ditugaskan, dan membatasi
pengelolaan item/profil ke manager. Transaksi melalui RPC
`inventory_record_transaction`: perubahan stok dan audit dilakukan atomik,
menolak stok negatif, serta memakai UUID untuk retry tanpa transaksi ganda.
Antrean offline terpisah per akun dan hanya dihapus setelah server mengonfirmasi.
Kesalahan server ditampilkan; data demo tidak dijadikan pengganti diam-diam untuk data server.

## Vercel (proyek yang sudah ada)

Target: `inventory-management`, tim `orcalien260102-9709s-projects`.

Hubungkan proyek Vercel yang dipilih ke `Jeffrey-r3yn/Inventory-Management` melalui
Git integration. Framework **Vite**, root directory repo, build `npm run build`,
output `dist`, install `npm ci` (lihat `vercel.json`). Tambahkan konfigurasi publik
`VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` untuk Production dan Preview jika
preview juga memakai backend tersebut. Redeploy setelah perubahan konfigurasi.

Jangan menambahkan token Vercel atau service_role Supabase ke `VITE_*`.
Penerapan SQL pada proyek Supabase yang dipilih dan pengujian pada deployment
HTTPS tetap diperlukan; berkas konfigurasi saja tidak membuktikan kedua layanan telah terhubung.

## PWA dan pengujian

Manifest, ikon PNG asli 192/512, dan service worker disertakan. Build meng-cache
shell aplikasi; API Supabase dan kredensial tidak masuk precache. Untuk pemasangan,
buka deployment HTTPS dan gunakan **Install app / Add to Home Screen** dari browser.
Service worker otomatis diperbarui. Cache inventaris dan antrean disimpan pada perangkat;
hapus data situs melalui pengaturan browser bila perangkat akan dipindahtangankan.

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
# di terminal kedua:
npm run test:pwa
```

`npm test` menjalankan Postgres lokal melalui PGlite untuk memeriksa migration
berulang, RLS, role, transaksi atomik, dan retry idempotent. Ini tidak menguji proyek
Supabase jarak jauh. `npm run test:pwa` memakai Chromium di `/usr/bin/chromium`
bila tersedia; alternatifnya jalankan `npx playwright install chromium` atau set
`CHROMIUM_EXECUTABLE_PATH`. Pengujian browser memeriksa tambah item, stok masuk,
penolakan stok berlebih, persistensi, ukuran ikon, tampilan mobile, dan reload offline.
`TEST_BASE_URL` dapat digunakan untuk menguji server preview lain (mode demo).

## Batasan offline

Login awal dan pengelolaan brand/item/staff memerlukan koneksi. Sesudah login,
PWA dapat memuat shell dan cache yang tersimpan, serta mengantrekan transaksi stok.
Saat koneksi pulih atau aplikasi dibuka ulang, antrean dikirim dan stok dimuat ulang.
Perubahan offline masih dapat ditolak server bila stok atau penugasan berubah;
transaksi tetap tertunda dan pesan kesalahan ditampilkan. Mode demo tidak mengirim
transaksi ke Supabase. Ekspor/penyelesaian antrean yang ditolak belum tersedia di UI.
