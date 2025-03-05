import express from 'express';
import multer from 'multer';
import { 
  getAllTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
  resetAllTickets
} from '../controllers/ticketController.js';
import { Ticket, ITicket } from '../models/Ticket.js';
import { parseExcel } from '../utils/excelParser.js';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAllTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.get('/stats', getTicketStats);
router.post('/reset', resetAllTickets);

// Hulpfunctie om te controleren of MongoDB verbonden is
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen bestand geüpload' });
    }

    console.log('Upload ontvangen: bestandsgrootte', req.file.size, 'bytes');

    try {
      // Parse Excel bestand
      const tickets = await parseExcel(req.file.buffer) as any[];
      console.log(`Aantal tickets geparseerd: ${tickets.length}`);
      
      // Controleren of de database verbonden is
      if (!isDatabaseConnected()) {
        console.log('Database niet verbonden tijdens upload, simulatie modus');
        return res.json({
          success: true,
          message: 'Upload gesimuleerd (database offline)',
          tickets,
          stats: {
            new: tickets.length,
            updated: 0,
            autoCompleted: 0,
            errors: 0
          }
        });
      }
      
      // Verzamel alle meldingsnummers in de upload voor later gebruik
      const uploadedTicketIds = tickets
        .filter(t => t.meldingsnummer && t.meldingsnummer.startsWith('M-'))
        .map(t => t.meldingsnummer);
      
      console.log(`Aantal M-nummers in upload: ${uploadedTicketIds.length}`);
      
      // Houd statistieken bij
      let stats = {
        new: 0,
        updated: 0,
        autoCompleted: 0,
        errors: 0
      };

      // Verwerk elk ticket
      for (const ticket of tickets) {
        try {
          if (!ticket.ticketnummer && !ticket.meldingsnummer) {
            console.error('Ticket zonder ticketnummer of meldingsnummer:', ticket);
            stats.errors++;
            continue;
          }

          const searchQuery = ticket.ticketnummer 
            ? { ticketnummer: ticket.ticketnummer }
            : { meldingsnummer: ticket.meldingsnummer };
            
          const existingTicket = await Ticket.findOne(searchQuery);
          
          if (existingTicket) {
            // Update alleen als het nieuwe ticket een latere update heeft
            const existingDate = new Date(existingTicket.laatsteUpdate || new Date());
            const newDate = new Date(ticket.laatsteUpdate || new Date());
            
            if (newDate > existingDate) {
              await (Ticket.findOneAndUpdate as any)(
                searchQuery,
                ticket,
                { new: true }
              );
              stats.updated++;
            }
          } else {
            await (Ticket.create as any)(ticket);
            stats.new++;
          }
        } catch (ticketError) {
          console.error('Fout bij verwerken ticket:', ticketError);
          stats.errors++;
        }
      }
      
      // Markeer tickets met M-nummers die niet meer in de upload zitten als "Afgerond"
      if (uploadedTicketIds.length > 0) {
        try {
          // Vind alle tickets met M-nummers die niet in de uploadlijst zitten
          const ticketsToComplete = await (Ticket.find as any)({
            meldingsnummer: { 
              $regex: /^M-/,  // Alleen tickets die beginnen met M-
              $nin: uploadedTicketIds  // Niet in de geüploade lijst
            },
            status: { $ne: 'Afgerond' }  // Nog niet afgerond
          });
          
          console.log(`Aantal automatisch af te ronden tickets: ${ticketsToComplete.length}`);
          
          // Update alle gevonden tickets naar status "Afgerond"
          for (const ticket of ticketsToComplete) {
            const now = new Date();
            
            // Voeg een statushistorie item toe
            const newHistoryItem = {
              status: 'Afgerond',
              startDatum: now,
              behandelaar: ticket.behandelaar || 'Systeem',
              duur: 0
            };
            
            // Werk het ticket bij
            await (Ticket.findByIdAndUpdate as any)(ticket._id, {
              status: 'Afgerond',
              afgerondeOp: now,
              $push: { historie: newHistoryItem }
            });
            
            stats.autoCompleted++;
          }
        } catch (autoCompleteError) {
          console.error('Fout bij automatisch afronden tickets:', autoCompleteError);
        }
      }

      res.json({
        success: true,
        message: `Import voltooid: ${stats.new} nieuwe tickets, ${stats.updated} bijgewerkt, ${stats.autoCompleted} automatisch afgerond, ${stats.errors} fouten`,
        tickets,
        stats
      });
    } catch (parseError) {
      console.error('Fout bij het parsen van Excel bestand:', parseError);
      res.status(500).json({ 
        error: 'Fout bij het parsen van Excel bestand', 
        details: (parseError as Error).message 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Fout bij verwerken bestand',
      details: (error as Error).message
    });
  }
});

export default router; 