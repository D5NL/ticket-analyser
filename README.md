# D5 App - Ticket Management Systeem

Een applicatie voor het beheren en analyseren van servicetickets.

## Lokale Ontwikkeling

1. Installeer dependencies: `npm install`
2. Kopieer `.env.example` naar `.env` en vul de juiste variabelen in
3. Start de ontwikkelomgeving: `npm run start:dev`

## Productie Deployment

### Frontend (Vercel)

1. Maak een account op [Vercel](https://vercel.com)
2. Verbind je GitHub repository met Vercel
3. Configureer het project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: Voeg `VITE_API_URL` toe (URL van je backend API, bijv. `https://d5app-backend.onrender.com`)

### Backend (Render)

1. Maak een account op [Render](https://render.com)
2. Maak een nieuwe "Web Service"
3. Verbind je GitHub repository
4. Configureer het project:
   - Name: `d5app-backend`
   - Build Command: `npm install`
   - Start Command: `npm run start:server`
   - Environment Variables:
     - `MONGODB_URI`: Je MongoDB Atlas connectie string
     - `PORT`: `10000` (Render wijst zelf een poort toe, maar 10000 is vaak een standaard)
     - `FRONTEND_URL`: URL van je frontend (bijv. `https://d5app.vercel.app`)
     - `NODE_ENV`: `production`

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB Atlas

## Functionaliteiten

- Dashboard voor visualisatie van ticketstatistieken
- Excel upload functionaliteit voor tickets
- Filtermogelijkheden op status, datum, behandelaar, etc.
- Automatische markering van afgeronde tickets
- Responsive design 

## Deployment Instructies

### Backend Deployment op Render

1. Ga naar [render.com](https://render.com) en meld je aan
2. Klik op "New" en kies "Web Service"
3. Verbind met je GitHub repository
4. Configureer met de volgende instellingen:
   - **Naam**: service-ticket-analyzer
   - **Environment**: Node
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start`
   - **Plan**: Free

5. Voeg de volgende Environment Variables toe:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `FRONTEND_URL`: URL van je Vercel frontend (toe te voegen na frontend deployment)
   - `MONGODB_URI`: Je MongoDB-verbindingsstring

### Frontend Deployment op Vercel

1. Ga naar [vercel.com](https://vercel.com) en meld je aan
2. Importeer je repository
3. Configureer met de volgende instellingen:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run deploy:frontend`
   - **Output Directory**: dist

4. Voeg deze Environment Variables toe:
   - `VITE_API_URL`: URL van je Render backend service
   - `NODE_ENV`: production

5. Na deployment, kopieer de Vercel URL en voeg deze toe aan je Render service als `FRONTEND_URL` environment variable

### Probleemoplossing

Als je problemen ondervindt bij de deployment, controleer de volgende punten:
- Controleer of alle environment variables correct zijn ingesteld
- Bekijk de logboeken in Render en Vercel voor specifieke foutmeldingen
- Zorg dat MongoDB Atlas correct is ingesteld en je IP-adres is toegestaan 