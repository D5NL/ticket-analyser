// @ts-nocheck
/**
 * Excel parser voor ticket data
 * Deze functie converteert Excel bestanden naar ticket objecten
 */

// Importeren van het benodigde package
// Als je exceljs niet hebt geïnstalleerd, voer dan uit: npm install exceljs
import ExcelJS from 'exceljs';

// Ticket type definitie
interface TicketData {
  meldingsnummer?: string;
  ticketnummer?: string;
  melder?: string;
  behandelaar?: string;
  status?: string;
  probleem?: string;
  melddatum?: Date;
  laatsteUpdate?: Date;
  aanmaakDatum?: Date;
  afgerondeOp?: Date;
  doorlooptijd?: number;
  statusHistory?: Array<{status: string, timestamp: Date}>;
  [key: string]: any; // Voor overige velden
}

/**
 * Parseer een Excel bestand naar ticket objecten
 * @param buffer De buffer met Excel inhoud
 * @returns Een array van ticket objecten
 */
export async function parseExcel(buffer) {
  console.log('parseExcel: Start excel verwerking');
  
  // Voeg een timeout check toe om te voorkomen dat de functie vastloopt
  let isTimedOut = false;
  const timeout = setTimeout(() => {
    isTimedOut = true;
    console.error('parseExcel: TIMEOUT na 30 seconden');
  }, 30000); // 30 seconden timeout
  
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Controleer het bestandsformaat voordat we het proberen te laden
    if (!buffer || buffer.length < 100) {
      throw new Error('Ongeldig Excel bestand: bestand is te klein of leeg');
    }
    
    // Log de eerste bytes voor debugging
    console.log('parseExcel: Eerste bytes van het bestand:', 
      buffer.slice(0, 10).toString('hex'));
    
    // Laad het Excel bestand met foutafhandeling
    try {
      await workbook.xlsx.load(buffer);
    } catch (xlsxError) {
      console.error('parseExcel: Fout bij laden .xlsx formaat', xlsxError);
      
      // Probeer als .xls te laden via een workaround
      throw new Error(`Kon het Excel bestand niet laden: ${xlsxError.message}. Controleer of het bestand is opgeslagen in .xlsx formaat.`);
    }
    
    if (isTimedOut) {
      throw new Error('Excel verwerking duurde te lang en is afgebroken');
    }
    
    console.log('parseExcel: Excel bestand geladen');

    // Controleer of het werkblad bestaat
    if (workbook.worksheets.length === 0) {
      throw new Error('Excel bestand bevat geen werkbladen');
    }

    // Neem het eerste werkblad
    const worksheet = workbook.worksheets[0];
    console.log(`parseExcel: Werkblad gevonden: ${worksheet.name}`);
    
    // Controleer of het werkblad genoeg rijen heeft
    if (worksheet.rowCount < 2) {
      throw new Error('Excel bestand bevat geen data rijen');
    }
    
    // Vind de headers en hun posities
    let headers = {};
    let headerRow = 1; // Standaard header rij
    
    // Zoek de header rij
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 5) {  // Zoek alleen in de eerste 5 rijen
        let rowIsHeader = false;
        row.eachCell((cell, colNumber) => {
          const value = cell.value?.toString().toLowerCase();
          if (value && 
             (value.includes('ticket') || 
              value.includes('melding') || 
              value.includes('status') || 
              value.includes('datum'))) {
            rowIsHeader = true;
          }
        });
        
        if (rowIsHeader) {
          headerRow = rowNumber;
          return false; // Stop zoeken
        }
      }
    });
    
    // Nu we de header rij hebben, vul de headers in
    console.log(`parseExcel: Header rij gevonden op rij ${headerRow}`);
    const headerRow1 = worksheet.getRow(headerRow);
    headerRow1.eachCell((cell, colNumber) => {
      let header = cell.value?.toString().toLowerCase();
      if (header) {
        headers[header] = colNumber;
        console.log(`parseExcel: Header gevonden: ${header} in kolom ${colNumber}`);
      }
    });
    
    // Controleer of we essentiële headers hebben gevonden
    if (Object.keys(headers).length === 0) {
      throw new Error('Geen bruikbare headers gevonden in het Excel bestand. Controleer of het bestand de juiste kolomnamen bevat.');
    }
    
    // Log alle gevonden headers voor debugging
    console.log('parseExcel: Gevonden headers:', headers);
    
    const tickets = [];
    let processedRows = 0;
    const maxRows = 5000; // Beperk het aantal te verwerken rijen
    
    // Begin tickets te verzamelen vanaf de rij na de headers
    for (let i = headerRow + 1; i <= Math.min(worksheet.rowCount, headerRow + maxRows); i++) {
      if (isTimedOut) {
        console.warn(`parseExcel: Verwerking afgebroken na ${processedRows} rijen wegens timeout`);
        break;
      }
      
      const row = worksheet.getRow(i);
      
      // Als de rij leeg is, sla deze over
      let isEmpty = true;
      row.eachCell({ includeEmpty: false }, () => {
        isEmpty = false;
      });
      
      if (isEmpty) continue;
      
      processedRows++;
      
      // Zoek de relevante kolommen voor ticketgegevens
      let ticket = {};
      
      // Alle mogelijke kolomnamen mappen naar ticket velden
      const fieldMappings = {
        'meldingsnummer': ['meldingsnr', 'meldingsnummer', 'melding', 'ticketnr', 'ticketnummer', 'ticket', 'id', 'nummer'],
        'ticketnummer': ['ticketnr', 'ticketnummer', 'ticket', 'id', 'nummer'],
        'melder': ['melder', 'aanvrager', 'gemeld door', 'gemeld', 'door', 'klant', 'gebruiker'],
        'behandelaar': ['behandelaar', 'toegewezen aan', 'toegewezen', 'engineer', 'technicus'],
        'status': ['status', 'staat'],
        'probleem': ['probleem', 'omschrijving', 'beschrijving', 'samenvatting', 'issue', 'fout'],
        'melddatum': ['melddatum', 'aanmaakdatum', 'gemeld op', 'datum', 'created', 'created at', 'aangemaakt op']
      };
      
      // Loop door alle field mappings en probeer waarden te vinden
      for (const [fieldName, possibleHeaders] of Object.entries(fieldMappings)) {
        for (const headerName of possibleHeaders) {
          if (headers[headerName] !== undefined) {
            const cell = row.getCell(headers[headerName]);
            if (cell && cell.value) {
              // Converteer datum velden
              if (fieldName.includes('datum') && cell.value instanceof Date) {
                ticket[fieldName] = cell.value;
              } else {
                ticket[fieldName] = cell.value.toString().trim();
              }
              // Stoppen na eerste match
              break;
            }
          }
        }
      }
      
      // Extra verwerking voor specifieke velden
      
      // Als we geen status hebben, zet default
      if (!ticket.status) {
        ticket.status = 'Nieuw';
      }
      
      // Zorg dat we ALTIJD een meldingsnummer hebben
      if (!ticket.meldingsnummer && ticket.ticketnummer) {
        ticket.meldingsnummer = ticket.ticketnummer;
      } else if (!ticket.meldingsnummer) {
        // Zoek in alle cellen voor iets dat op een ticketnummer lijkt
        let foundTicketNr = false;
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (!foundTicketNr && cell.value) {
            const value = cell.value.toString().trim();
            // Als het op een nummer of ID lijkt
            if (/^(T|M|#)?[0-9]{4,8}$/i.test(value) || 
                /^[A-Z]{2,3}-[0-9]{3,6}$/i.test(value)) {
              ticket.meldingsnummer = value;
              foundTicketNr = true;
            }
          }
        });
        
        // Als we nog steeds geen nummer hebben, maak er een aan
        if (!ticket.meldingsnummer) {
          ticket.meldingsnummer = `ticket-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
      }
      
      // Voeg standaardwaarden toe die het Mongoose schema nodig heeft
      ticket.laatsteUpdate = new Date();
      ticket.aanmaakDatum = ticket.aanmaakDatum || new Date();
      ticket.melder = ticket.melder || 'Onbekend';
      ticket.behandelaar = ticket.behandelaar || 'Onbekend';
      
      // Voeg statusgeschiedenis toe
      ticket.statusHistory = [{
        status: ticket.status || 'Nieuw',
        timestamp: new Date()
      }];
      
      tickets.push(ticket);
      
      // Log voortgang bij grote bestanden
      if (processedRows % 100 === 0) {
        console.log(`parseExcel: ${processedRows} rijen verwerkt`);
      }
      
      // Voorkom dat de verwerking te lang duurt
      if (processedRows >= maxRows) {
        console.warn(`parseExcel: Maximum aantal rijen (${maxRows}) bereikt, verdere rijen worden overgeslagen`);
        break;
      }
    }
    
    clearTimeout(timeout);
    
    console.log(`parseExcel: ${tickets.length} tickets gevonden uit ${processedRows} verwerkte rijen`);
    console.log('parseExcel: Voorbeeld eerste ticket:', tickets.length > 0 ? JSON.stringify(tickets[0], null, 2) : 'Geen tickets');
    
    return tickets;
  } catch (error) {
    clearTimeout(timeout);
    console.error('parseExcel ERROR:', error);
    throw new Error(`Excel parsing mislukt: ${error.message}`);
  }
} 