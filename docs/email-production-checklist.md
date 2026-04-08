# Email Production Checklist

BUKHT deer email code auth-ийг production-д гаргахдаа доорх алхмуудыг шалгана.

## 1. Resend account

- Resend account үүсгэнэ.
- Production project үүсгэнэ.
- `API Key` гаргаж авна.

## 2. Domain verify

- Resend дээр domain-оо нэмнэ. Жишээ: `bukht.mn`
- DNS provider дээрээ Resend-ийн өгсөн record-уудыг нэмнэ.
- Domain status `Verified` болсон эсэхийг шалгана.

Ихэвчлэн дараах төрлийн record шаардлагатай:

- `SPF`
- `DKIM`
- Зарим тохиолдолд `Return-Path` эсвэл бусад provider-specific record

## 3. Sender email

- `MAIL_FROM` нь verify хийсэн domain дээр байх ёстой.
- Жишээ:
  - `no-reply@bukht.mn`
  - `auth@bukht.mn`

## 4. Environment variables

Deploy хийсэн орчин дээр дараах env-үүдийг заавал тохируулна:

```bash
MAIL_FROM=no-reply@bukht.mn
RESEND_API_KEY=re_xxx
SESSION_SECRET=long-random-secret
ADMIN_EMAILS=admin@bukht.mn
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Хэрэв SMTP ашиглахгүй бол эдгээрийг хоосон үлдээнэ:

```bash
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

## 5. App deploy

- Vercel эсвэл ашиглаж буй hosting platform дээр env-үүдийг нэмнэ.
- Production build/deploy хийнэ.
- Deploy хийсний дараа auth route-ууд ажиллаж байгааг шалгана.

## 6. Functional test

- Шинэ email оруулаад код авч бүртгэл үүсэж байгаа эсэх
- Өмнө бүртгэлтэй email код авч нэвтэрч байгаа эсэх
- Admin email developer role авч байгаа эсэх
- Logout ажиллаж байгаа эсэх
- Spam folder руу орж байгаа эсэх

## 7. Before launch

- `MAIL_FROM` дээр typo байхгүй эсэх
- `RESEND_API_KEY` production key мөн эсэх
- `SESSION_SECRET` урт, санамсаргүй утгатай эсэх
- `ADMIN_EMAILS` зөв email-үүдтэй эсэх
- DNS propagation бүрэн дууссан эсэх

## Notes

- Одоогийн код Resend тохируулагдсан үед login code-ийг email-ээр явуулна.
- Mail provider тохируулаагүй үед dev fallback ашигладаг.
- Partial SMTP config байсан ч app шууд унахгүй болгосон.
