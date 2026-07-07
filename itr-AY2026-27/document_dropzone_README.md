# 📂 Drop your tax documents here

Put whatever of these you have into **this folder**, then tell the assistant you're done.
It will read what it can and only ask you for the rest. You don't need every item — just add what applies to you.

## Almost everyone
- **PAN** and **Aadhaar** (a photo/scan is fine) — and make sure they're linked on the portal.
- **Form 16** from each employer (FY 2025-26) — your salary and the tax (TDS) already deducted.
- **AIS** and **TIS** — download from incometax.gov.in → Services → AIS (this is the tax department's record of your income).
- **Form 26AS** — incometax.gov.in → e-File → Income Tax Returns → View Form 26AS.
- **Bank interest certificate / statement** — for savings and FD/RD interest.

## If they apply to you
- **Capital-gains / broker P&L statement** — Zerodha, Groww, ICICI Direct, etc. (shares, mutual funds). Get the *Tax P&L* report for FY 2025-26.
- **Property sale documents** — sale deed, purchase deed, and Form 16B if a buyer deducted TDS.
- **Home-loan interest certificate** — from your bank (for the interest deduction).
- **Rent receipts / rent agreement** — only needed if you'll use the **old regime** (for HRA).
- **80C / 80D proofs** — LIC, PPF, ELSS, tuition, health-insurance premium — **only for the old regime**.
- **Form 16A** (interest/professional TDS), **Form 16C** (rent TDS).
- **Business / profession records** — turnover, receipts, expenses (if you run a business or freelance).
- **Foreign income / foreign assets / RSU-ESOP statements** — if any (this usually means ITR-2/3 and may need a CA).

## A note on passwords
Form 16 and the AIS PDF are often password-protected. Typical passwords:
- **Form 16:** your PAN in CAPITALS + date of birth as DDMMYYYY (e.g. `ABCDE1234F01011990`).
- **AIS PDF:** PAN in CAPITALS + DOB DDMMYYYY.

If a file is protected, just tell the assistant the password when it asks — or create a small `passwords.json` here like:
```json
{ "Form16.pdf": "ABCDE1234F01011990" }
```

Scanned/photographed documents can't always be read automatically — if so, the assistant will simply ask you to read the numbers off them.
