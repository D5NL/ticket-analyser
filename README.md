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