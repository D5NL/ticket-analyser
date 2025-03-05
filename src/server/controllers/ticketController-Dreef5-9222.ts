import { Request, Response } from 'express';
import { Ticket, ITicket } from '../../database/models/Ticket.js';

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Fout bij ophalen tickets', error });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const tickets = Array.isArray(req.body) ? req.body : [req.body];
    
    console.log('Ontvangen tickets:', tickets);

    // Valideer en formatteer elk ticket
    const formattedTickets = tickets.map(ticket => {
      const now = new Date();
      return {
        ...ticket,
        melddatum: now,
        status: ticket.status || 'Nieuw',
        prioriteit: ticket.prioriteit || 'Medium',
        historie: [{
          status: ticket.status || 'Nieuw',
          startDatum: now,
          behandelaar: ticket.behandelaar,
          duur: 0
        }]
      };
    });

    // Verwerk tickets één voor één om historie correct bij te houden
    const updatedTickets = [];
    for (const ticket of formattedTickets) {
      try {
        console.log('Verwerken ticket:', ticket);
        const updatedTicket = await Ticket.updateWithHistory(ticket);
        updatedTickets.push(updatedTicket);
      } catch (err) {
        console.error('Fout bij verwerken ticket:', ticket.meldingsnummer, err);
        throw err;
      }
    }

    console.log('Bijgewerkte/nieuwe tickets:', updatedTickets);
    res.status(200).json(updatedTickets);
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(400).json({ 
      message: 'Fout bij verwerken tickets', 
      error: error.message,
      details: error.errors
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: 'Fout bij updaten ticket', error });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket verwijderd' });
  } catch (error) {
    res.status(400).json({ message: 'Fout bij verwijderen ticket', error });
  }
};

export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const totalCount = await Ticket.countDocuments();
    const statusCount = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const behandelaarStats = await Ticket.aggregate([
      { $group: { _id: '$behandelaar', count: { $sum: 1 } } }
    ]);

    res.json({
      totaal: totalCount,
      perStatus: statusCount,
      perBehandelaar: behandelaarStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Fout bij ophalen statistieken', error });
  }
};

export const resetAllTickets = async (req, res) => {
  try {
    console.log('Resetting all tickets...');
    
    // Verwijder alle tickets uit de database
    const result = await Ticket.deleteMany({});
    
    console.log(`${result.deletedCount} tickets verwijderd.`);
    
    res.json({ 
      success: true, 
      message: `Alle tickets zijn verwijderd (${result.deletedCount} in totaal).`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Fout bij het resetten van tickets' });
  }
}; 