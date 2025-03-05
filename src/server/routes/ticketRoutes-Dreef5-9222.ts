// @ts-nocheck
import express from 'express';
import multer from 'multer';
import { Ticket } from '../models/Ticket.js';
import { parseExcel } from '../utils/excelParser.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    console.log('GET /tickets - Aantal gevonden tickets:', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('GET /tickets error:', error);
    res.status(500).json({ error: 'Fout bij ophalen tickets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tickets } = req.body;
    
    if (!Array.isArray(tickets)) {
      console.error('POST /tickets - Tickets is geen array:', typeof tickets);
      return res.status(400).json({ error: 'Tickets moeten als array worden aangeleverd' });
    }

    console.log('POST /tickets - Ontvangen tickets:', tickets.length);
    
    if (tickets.length === 0) {
      console.error('POST /tickets - Geen tickets ontvangen');
      return res.status(400).json({ error: 'Geen tickets ontvangen' });
    }

    // Log eerste ticket voor debugging
    console.log('POST /tickets - Eerste ticket voorbeeld:', JSON.stringify(tickets[0], null, 2));
    
    // Valideer eerst alle tickets
    const validatedTickets = tickets.map(ticket => {
      // Zorg dat alle verplichte velden aanwezig zijn
      return {
        ...ticket,
        meldingsnummer: ticket.meldingsnummer || ticket.ticketnummer || `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketnummer: ticket.ticketnummer || ticket.meldingsnummer || `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        melder: ticket.melder || 'Onbekend',
        behandelaar: ticket.behandelaar || 'Onbekend',
        status: ticket.status || 'Nieuw',
        laatsteUpdate: new Date(),
        aanmaakDatum: ticket.aanmaakDatum || new Date(),
        statusHistory: ticket.statusHistory || [{
          status: ticket.status || 'Nieuw',
          timestamp: new Date()
        }]
      };
    });

    const results = [];
    const successes = [];
    const failures = [];

    // Process tickets one by one to better track failures
    for (const ticket of validatedTickets) {
      try {
        console.log(`Verwerken ticket: ${ticket.meldingsnummer}`);
        
        // Check eerst of het ticket bestaat
        const existingTicket = await Ticket.findOne({ 
          $or: [
            { meldingsnummer: ticket.meldingsnummer },
            { ticketnummer: ticket.ticketnummer }
          ]
        });
        
        let result;
        
        if (existingTicket) {
          console.log(`Updaten ticket: ${ticket.meldingsnummer}`);
          result = await Ticket.findByIdAndUpdate(
            existingTicket._id,
            {
              ...ticket,
              laatsteUpdate: new Date()
            },
            { new: true }
          );
        } else {
          console.log(`Nieuw ticket aanmaken: ${ticket.meldingsnummer}`);
          result = await Ticket.create(ticket);
        }
        
        results.push(result);
        successes.push(result);
      } catch (error) {
        console.error(`Fout bij verwerken ticket ${ticket.meldingsnummer}:`, error);
        failures.push({ error: error.message, ticket });
      }
    }

    // Filter resultaten en stuur terug
    console.log(`Tickets verwerkt - Succes: ${successes.length}, Mislukt: ${failures.length}`);
    
    res.json({
      success: true,
      successes: successes.length,
      failures: failures.length,
      failureDetails: failures.map(f => ({ 
        meldingsnummer: f.ticket?.meldingsnummer, 
        error: f.error 
      })),
      tickets: successes
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: 'Fout bij maken tickets: ' + error.message });
  }
});

// Verwijderde route handlers en importeerde ze direct
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedTicket = await Ticket.findByIdAndUpdate(id, updates, { new: true });
    
    if (!updatedTicket) {
      return res.status(404).json({ error: 'Ticket niet gevonden' });
    }
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Fout bij updaten ticket' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    
    if (!deletedTicket) {
      return res.status(404).json({ error: 'Ticket niet gevonden' });
    }
    
    res.json({ message: 'Ticket verwijderd', ticket: deletedTicket });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen ticket' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $ne: 'Afgerond' } });
    const closedTickets = await Ticket.countDocuments({ status: 'Afgerond' });
    
    // Bereken gemiddelde doorlooptijd
    const tickets = await Ticket.find({ status: 'Afgerond', doorlooptijd: { $exists: true } });
    let totalDoorlooptijd = 0;
    let ticketsWithDoorlooptijd = 0;
    
    tickets.forEach(ticket => {
      if (ticket.doorlooptijd && ticket.doorlooptijd > 0) {
        totalDoorlooptijd += ticket.doorlooptijd;
        ticketsWithDoorlooptijd++;
      }
    });
    
    const averageDoorlooptijd = ticketsWithDoorlooptijd > 0 ? 
      Math.round(totalDoorlooptijd / ticketsWithDoorlooptijd) : 0;
    
    res.json({
      totalTickets,
      openTickets,
      closedTickets,
      averageDoorlooptijd
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Fout bij ophalen statistics' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    await Ticket.deleteMany({});
    res.json({ message: 'Alle tickets zijn verwijderd' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Fout bij resetten tickets' });
  }
});

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('Upload error: Geen bestand ontvangen');
      return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    console.log('Upload: bestand ontvangen:', req.file.originalname, 'grootte:', req.file.size);

    try {
      // Parse Excel bestand
      console.log('Upload: start parseExcel');
      const tickets = await parseExcel(req.file.buffer);
      console.log('Upload: parseExcel succesvol, tickets:', tickets.length);

      // Zorg dat alle tickets een meldingsnummer hebben
      const validatedTickets = tickets.map(ticket => ({
        ...ticket,
        meldingsnummer: ticket.meldingsnummer || ticket.ticketnummer || `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }));

      console.log('Upload: tickets gevalideerd, eerste ticket:', JSON.stringify(validatedTickets[0], null, 2));

      let stats = {
        new: 0,
        updated: 0,
        skipped: 0,
        statusChanged: 0
      };

      // Verwerk elk ticket
      console.log('Upload: start verwerken tickets');
      for (const newTicketData of validatedTickets) {
        try {
          // Zoek eerst op meldingsnummer, dan op ticketnummer
          console.log('Upload: zoeken naar bestaand ticket:', newTicketData.meldingsnummer);
          let existingTicket = await Ticket.findOne({ meldingsnummer: newTicketData.meldingsnummer });
          
          if (!existingTicket && newTicketData.ticketnummer) {
            existingTicket = await Ticket.findOne({ ticketnummer: newTicketData.ticketnummer });
          }
          
          if (existingTicket) {
            console.log('Upload: bestaand ticket gevonden met status:', existingTicket.status);
            // Check of de status is veranderd
            if (existingTicket.status !== newTicketData.status) {
              console.log('Upload: status gewijzigd van', existingTicket.status, 'naar', newTicketData.status);
              // Voeg nieuwe status toe aan historie
              const statusUpdate = {
                status: newTicketData.status,
                timestamp: new Date()
              };

              await Ticket.findOneAndUpdate(
                { _id: existingTicket._id },
                { 
                  $set: {
                    status: newTicketData.status,
                    laatsteUpdate: new Date(),
                    meldingsnummer: newTicketData.meldingsnummer
                  },
                  $push: { statusHistory: statusUpdate }
                },
                { new: true }
              );
              
              stats.statusChanged++;
              stats.updated++;
            } else {
              console.log('Upload: status ongewijzigd, ticket overgeslagen');
              stats.skipped++;
            }
          } else {
            console.log('Upload: nieuw ticket aanmaken:', newTicketData.meldingsnummer);
            // Nieuw ticket met verplichte velden
            const initialStatus = {
              status: newTicketData.status || 'Nieuw',
              timestamp: new Date()
            };

            const newTicketWithDefaults = {
              ...newTicketData,
              melder: newTicketData.melder || 'Onbekend',
              behandelaar: newTicketData.behandelaar || 'Onbekend',
              meldingsnummer: newTicketData.meldingsnummer, // Zorg dat dit veld er is
              ticketnummer: newTicketData.ticketnummer || newTicketData.meldingsnummer,
              statusHistory: [initialStatus],
              aanmaakDatum: new Date(),
              laatsteUpdate: new Date()
            };

            await Ticket.create(newTicketWithDefaults);
            
            stats.new++;
          }
        } catch (ticketError) {
          console.error('Upload: fout bij verwerken ticket:', 
            newTicketData.meldingsnummer, 
            'Error:', ticketError.message
          );
          // Ga door met volgend ticket
        }
      }

      console.log('Upload statistieken:', stats);
      res.json({ 
        success: true,
        message: 'Tickets verwerkt', 
        stats,
        tickets: validatedTickets
      });
    } catch (parseError) {
      console.error('Upload: parse error:', parseError);
      return res.status(400).json({ error: 'Fout bij parsen bestand: ' + parseError.message });
    }
  } catch (error) {
    console.error('Upload: algemene error:', error);
    res.status(500).json({ error: 'Server fout: ' + error.message });
  }
});

export default router; 