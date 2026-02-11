# Mini-ATS Presentation (Svenska)

## 1. Introduktion

**Vad är Mini-ATS?**

Mini-ATS är ett modernt, komplett rekryteringssystem (Applicant Tracking System) byggt med Next.js 16, React 19 och Supabase. Systemet är designat för att hjälpa företag att hantera hela rekryteringsprocessen - från jobbpublicering till anställning.

---

## 2. Huvudfunktioner (Huvudfunktioner)

### 🎯 Kärnfunktioner

| Funktion | Beskrivning |
|----------|-------------|
| **Jobbhantering** | Skapa, redigera och publicera jobbannonser |
| **Kandidathantering** | Lägg till, filtrera och hantera kandidater |
| **Intervjuschema** | Planera intervjuer med automatiska möteslänkar |
| **Kanban-bräda** | Visuell pipeline för rekryteringsprocessen |
| **Notifikationer** | Realtidsnotifikationer för nya händelser |
| **Sökning** | Avancerad sökning i kandidater och jobb |
| **RBAC** | Rollbaserad åtkomstkontroll (Admin, Customer) |

---

## 3. Teknisk Arkitektur

### 🏗️ Teknologier

```
Frontend:        Next.js 16 + React 19 + TypeScript
Styling:         Tailwind CSS 4 + CSS Modules
Backend:         Next.js API Routes + Supabase
Database:        PostgreSQL (via Supabase)
Auth:            Supabase Auth (JWT)
Real-time:       Supabase Real-time
File Storage:    Supabase Storage
Testing:         Vitest + Playwright
```

### 📁 Projektstruktur

```
mini-ats/
├── app/                    # Next.js App Router
│   ├── (pages)/           # Applikationssidor
│   ├── api/               # API-routes
│   └── layout.tsx         # Root layout
├── components/            # React-komponenter
│   ├── ui/               # UI-komponenter (Button, Card, etc.)
│   └── (features)/       # Feature-komponenter
├── lib/                   # Bibliotek och utilities
│   ├── auth/             # Autentisering
│   ├── supabase/         # Supabase-klienter
│   └── (services)/       # Tjänster
├── types/                 # TypeScript-typer
└── e2e/                   # End-to-end tester
```

---

## 4. Funktionalitet i Detalj

### 4.1 Dashboard 📊

- **Översikt**: Statistik över jobb, kandidater och anställningar
- **Kommande intervjuer**: Lista med filtrering (namn, jobb, datum)
- **Senaste ansökningar**: Nyligen tillagda kandidater
- **Quick Actions**: Snabblänkar till vanliga funktioner

### 4.2 Jobbhantering 💼

- Skapa nya jobbannonser med detaljerad information
- Redigera befintliga jobb
- Se kandidater kopplade till specifika jobb
- Statushantering (öppen/stängd)

### 4.3 Kandidathantering 👥

- **Kandidatprofil**: Fullständig information (namn, email, telefon, CV)
- **Bedömning**: Stjärnbetyg och kommentarer
- **Pipeline-stadier**: Applied → Screening → Interview → Offer → Hired
- **Dokument**: Uppladdning och hantering av CV/filer

### 4.4 Intervjuschema 📅

- Planera intervjuer med datum och tid
- Automatiska Google Meet-länkar
- Val av intervjutyp (video, telefon, fysisk)
- Påminnelser och notifikationer

### 4.5 Kanban-bräda 🎯

- Visuell översikt över alla kandidater
- Drag-and-drop för att flytta kandidater mellan stadier
- Filtrering och sökning
- Realtidsuppdateringar

---

## 5. Säkerhet och Autentisering

### 🔐 Säkerhetsfunktioner

- **JWT-baserad autentisering** via Supabase Auth
- **Rollbaserad åtkomstkontroll** (RBAC):
  - `admin`: Full åtkomst till alla funktioner
  - `customer`: Åtkomst till egna data
- **RLS (Row Level Security)**: Databasnivå-säkerhet
- **Säker filuppladdning**: Validering av filtyper och storlek
- **CSRF-skydd**: Inbyggt i Next.js

---

## 6. Databasdesign

### 📊 Huvudtabeller

| Tabell | Syfte |
|--------|-------|
| `profiles` | Användarprofiler och roller |
| `jobs` | Jobbannonser |
| `candidates` | Kandidatinformation |
| `interviews` | Intervjuschema och detaljer |
| `notifications` | Användarnotifikationer |
| `applications` | Koppling kandidat-job |

### 🔗 Relationer

```
profiles (1) ───< (N) jobs
profiles (1) ───< (N) candidates
jobs (1) ───< (N) candidates
candidates (1) ───< (N) interviews
profiles (1) ───< (N) notifications
```

---

## 7. Tester

### ✅ Teststrategi

- **Unit-tester**: Vitest för komponenter och hooks
- **E2E-tester**: Playwright för kritiska användarflöden
- **Testtäckning**: Button, Card, Input, useAuth

### 🧪 Testfall

| Test | Beskrivning |
|------|-------------|
| `Button.test.tsx` | Rendering, varianter, klick-händelser |
| `Card.test.tsx` | Sub-komponenter, custom classes |
| `Input.test.tsx` | Värdehantering, events |
| `hooks.test.tsx` | Autentisering, tillståndshantering |
| `rbac.spec.ts` | Rollbaserad åtkomst |
| `landing.spec.ts` | Landningssida och navigation |

---

## 8. Framtida Utveckling

### 🚀 Planerade Funktioner

- [ ] AI-baserad kandidatmatchning
- [ ] Automatisk CV-parsning
- [ ] Integration med LinkedIn
- [ ] Email-mallar och automatiska utskick
- [ ] Avancerad rapportering och analys
- [ ] Mobilapp (React Native)
- [ ] Multi-tenant support för byråer

---

## 9. Sammanfattning

### 🎯 Varför Mini-ATS?

✅ **Modern teknik** - Next.js 16, React 19, TypeScript  
✅ **Säkert** - RBAC, RLS, JWT-autentisering  
✅ **Skalbart** - Supabase-backend, real-time updates  
✅ **Användarvänligt** - Intuitivt gränssnitt, responsiv design  
✅ **Testat** - Omfattande unit- och E2E-tester  
✅ **Öppen källkod** - Enkel att anpassa och utöka  

---

## 10. Demo och Kontakt

### 🖥️ Live-demo
- URL: [http://localhost:3000](http://localhost:3000)
- Inloggning: `admin@ats.com` / `Test123`





