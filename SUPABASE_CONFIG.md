# Konfigurasi Supabase untuk Reset Password

Masalah yang Anda alami (redirect ke halaman utama alih-alih halaman update password) terjadi karena URL redirect spesifik belum terdaftar di "Allow list" atau "Redirect URLs" di Supabase Dashboard.

Supabase memblokir redirect ke URL yang tidak dikenal untuk alasan keamanan, dan secara default akan mengarahkan user kembali ke **Site URL** jika URL tujuan tidak diizinkan.

## Langkah Perbaikan

1. Buka **Supabase Dashboard** untuk project Anda.
2. Masuk ke menu **Authentication** > **URL Configuration**.
3. Periksa bagian **Redirect URLs**.
4. Tambahkan URL berikut ke dalam daftar:

   - **Production:** `https://digitalsquad.id/update-password`
   - **Localhost (untuk testing):** `http://localhost:5173/update-password`

   *(Catatan: pastikan port localhost sesuai dengan yang Anda gunakan, misal 5173)*

5. Klik **Save**.

## Penjelasan Tambahan

- Saat Anda melakukan request reset password dari `localhost`, sistem akan mengirimkan parameter `redirectTo` sebagai `http://localhost:5173/update-password`. Jika URL ini tidak ada di whitelist, Supabase akan mengabaikannya dan me-redirect user ke **Site URL** (https://digitalsquad.id).
- Begitu juga di production, `https://digitalsquad.id/update-password` harus terdaftar secara eksplisit (atau menggunakan wildcard seperti `https://digitalsquad.id/*`) agar Supabase mengizinkan redirect ke sub-page tersebut.

Setelah melakukan perubahan ini, coba lakukan request "Forgot Password" lagi. Link di email seharusnya sekarang akan mengarah ke halaman reset password dengan benar.
