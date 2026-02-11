🚀 Mini-ATS

Mini-ATS is a modern, full-stack Applicant Tracking System (ATS) built with Next.js 16, React 19, and Supabase.

It helps companies manage the entire recruitment process — from job posting to hiring — in one intuitive and real-time platform.

👉 Live Demo:
https://mini-ats-fpny.vercel.app/

Login: admin@ats.com / Test123

✨ Features
🎯 Core Features
Feature	Description
Job Management	Create, edit, and publish job listings
Candidate Management	Add, filter, and manage candidates
Interview Scheduling	Schedule interviews with automatic meeting links
Kanban Board	Visual recruitment pipeline
Notifications	Real-time activity updates
Search	Advanced search across jobs and candidates
RBAC	Role-based access control (Admin/Customer)
🏗️ Tech Stack
Frontend   → Next.js 16 + React 19 + TypeScript
Styling    → Tailwind CSS 4 + CSS Modules
Backend    → Next.js API Routes + Supabase
Database   → PostgreSQL (Supabase)
Auth       → Supabase Auth (JWT)
Realtime   → Supabase Realtime
Storage    → Supabase Storage
Testing    → Vitest + Playwright
Deployment → Vercel

📁 Project Structure
mini-ats/
├── app/                    # Next.js App Router
│   ├── (pages)            # Application pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # UI kit (Button, Card, Input)
│   └── (features)        # Feature components
├── lib/                   # Utilities & services
│   ├── auth/             # Authentication logic
│   ├── supabase/         # Supabase clients
│   └── services/
├── types/                 # TypeScript types
├── e2e/                   # End-to-end tests
└── README.md

📊 Detailed Functionality
📊 Dashboard

Overview statistics (jobs, candidates, hires)

Upcoming interviews

Latest applications

Quick action shortcuts

💼 Job Management

Create and edit job postings

Link candidates to jobs

Open/Closed status management

👥 Candidate Management

Full candidate profiles

Ratings & notes

Pipeline stages:

Applied → Screening → Interview → Offer → Hired


CV & file uploads

📅 Interview Scheduling

Date & time scheduling

Automatic Google Meet links

Interview type (video/phone/on-site)

Reminders & notifications

🎯 Kanban Board

Drag & drop pipeline

Real-time updates

Filtering & searching

🔐 Security

Mini-ATS is designed with security first.

JWT authentication (Supabase Auth)

Role-Based Access Control (RBAC)

Row Level Security (RLS)

Secure file uploads

Built-in CSRF protection (Next.js)

Roles
Role	Access
admin	Full system access
customer	Own data only
🗄️ Database Design
Main Tables
Table	Purpose
profiles	Users & roles
jobs	Job listings
candidates	Candidate data
interviews	Interview schedules
notifications	User notifications
applications	Candidate ↔ job relation
Relationships
profiles (1) ───< jobs
profiles (1) ───< candidates
jobs (1) ───< candidates
candidates (1) ───< interviews
profiles (1) ───< notifications

🧪 Testing
Strategy

Unit tests → Vitest

End-to-End tests → Playwright

Tested Areas

UI components (Button, Card, Input)

Hooks (useAuth)

RBAC

Navigation & landing page

Run tests
npm run test
npm run test:e2e

⚙️ Local Development
1. Clone the repository
git clone https://github.com/Rali80/mini-ats.git
cd mini-ats

2. Install dependencies
npm install

3. Add environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://tbargiaqsxmifprkmmzq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_VHgpMEkf7hEwx8i_RSthSA_oWoglYSs

4. Start development server
npm run dev


App runs at:

http://localhost:3000

🚀 Deployment

Mini-ATS is deployed automatically via Vercel + GitHub.

Every push to master triggers a new production build:

git add .
git commit -m "update"
git push origin master
https://mini-ats-fpny.vercel.app/
🔮 Roadmap

Planned features:

AI-based candidate matching

Automatic CV parsing

LinkedIn integration

Email automation & templates

Advanced analytics & reporting

Mobile app (React Native)

Multi-tenant support for agencies

🎯 Why Mini-ATS?

✅ Modern stack
✅ Secure architecture
✅ Real-time updates
✅ Responsive UI
✅ Fully tested
✅ Open source & extensible

📜 License

MIT License

👨‍💻 Author

Built by Rali80
