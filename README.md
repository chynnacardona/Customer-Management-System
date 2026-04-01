# Customer Management System (Group Project in Information Management 2)

## Prerequisites
- Node.js v18 or higher
- VS Code with the following extensions:
  - ESLint & Prettier
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native Snippets
  - Thunder Client or Postman
  - GitLens

## Installation
1. Clone the repository:
   git clone <repo-url>

2. Go into the project folder:
   cd Customer-Management-System

3. Checkout the dev branch:
   git checkout dev

4. Install dependencies:
   npm install

## Environment Setup
1. Copy the example env file:
   cp .env.example .env

2. Open your .env file and fill in the values:
   - VITE_SUPABASE_URL — get this from your Supabase project dashboard
   - VITE_SUPABASE_ANON_KEY — also from your Supabase dashboard

## Running the App
   npm run dev

## Running Tests
   npm test

## Branch & PR Rules
- NEVER push directly to main or dev
- Always branch off from dev:
  git checkout -b feat/your-feature-name
- Open a Pull Request targeting dev
- At least 1 teammate must approve before merging
- No console.log statements or .env files in PRs

## Team Members
- Chynna Cardona (M1) — Project Lead / Full-Stack Developer
- Jorus Junio (M2) — Frontend Developer
- Alexis Castro (M3) — Database Engineer
- John Patrick Hawac (M4) — Rights & Auth Specialist
- Lourd Allen Amante (M5) — QA & Documentation 