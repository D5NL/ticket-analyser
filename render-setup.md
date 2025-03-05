# Render Deployment Instructies

## Voorbereidingen voor deployment naar Render

1. **Controleer de MongoDB URI in render.yaml**:
   Zorg ervoor dat de MongoDB URI in render.yaml correct is ingesteld.

2. **Zorg voor juiste Node.js versie**:
   Render gebruikt standaard Node.js 18.x, controleer of al je dependencies hiermee compatibel zijn.

3. **Environment variabelen**:
   De volgende environment variabelen moeten ingesteld zijn in het Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `FRONTEND_URL`: URL van je frontend app (bijv. `https://ticket-analyser.vercel.app`)
   - `MONGODB_URI`: Je MongoDB verbindingsstring

## Deployment stappen

1. Push je code naar GitHub
2. Login op [Render](https://render.com)
3. Maak een nieuwe Web Service
4. Verbind je GitHub repository
5. Stel de volgende configuratie in:
   - **Naam**: ticket-analyser
   - **Environment**: Node
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start`
   - **Plan**: Free
6. Voeg de environment variabelen toe
7. Klik op "Create Web Service"

## Probleemoplossing

Als je deployment problemen ondervindt:

1. Controleer de logbestanden in het Render Dashboard
2. Zorg ervoor dat je MongoDB Atlas IP whitelisting heeft geactiveerd (of gebruik 0.0.0.0/0)
3. Controleer of je frontend URL correct is ingesteld voor CORS

## Specifieke problemen en oplossingen

### xcopy werkt niet op Render
Het build:render script is aangepast om Linux-compatibele commando's te gebruiken (cp -r in plaats van xcopy).

### Node.js versie vereisten
Zorg ervoor dat je dependencies compatibel zijn met Node.js 18.x.

### Import extensies
Als je problemen hebt met import statements, controleer of je .js extensies gebruikt in import statements maar .ts extensies hebt voor de bestanden. 