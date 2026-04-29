# CERDIK App (Expo)

CERDIK (Catat, Evaluasi, Rencanakan, dan Inisiasi Keuangan) adalah aplikasi literasi keuangan untuk siswa SMA/MAN, dibangun dengan React Native + Expo Router.

## Tech Stack

- Expo SDK 54
- Expo Router (file-based routing)
- Zustand
- NativeWind
- `@expo/vector-icons` (Ionicons)
- `react-native-gifted-charts`
- AsyncStorage
- Axios

## Install

```bash
npm install
```

> Catatan: untuk SDK 54, versi Node yang direkomendasikan minimal `20.19.4`.

## Run

```bash
npm run start
```

Lalu tekan:
- `a` untuk Android
- `w` untuk Web

Atau langsung:

```bash
npm run android
npm run web
```

## Supabase Auth Setup

Project ini sekarang sudah terhubung ke flow auth Supabase dari sisi aplikasi. Konfigurasi lokal yang dipakai:

- URL project lewat `.env`
- publishable key lewat `.env`
- migration database ada di `supabase/migrations/20260428174000_create_profiles.sql`
- redirect deep link verifikasi email: `cerdik://auth/callback`

### Yang perlu dijalankan sekali

1. Login Supabase CLI:

```bash
npx supabase login
```

2. Link project lokal ke project Supabase:

```bash
npm run supabase:link
```

3. Push migration `profiles` ke database Supabase:

```bash
npm run supabase:push
```

### Yang perlu diatur di Supabase Dashboard

- `Auth -> URL Configuration`
- Tambahkan redirect URL:

```text
cerdik://auth/callback
```

- Pastikan `Confirm email` aktif jika ingin user wajib verifikasi email sebelum login.
