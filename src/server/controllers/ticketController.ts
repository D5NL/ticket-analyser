import { Request, Response } from 'express';
import { Ticket, ITicket, TicketStatus } from '../../database/models/Ticket';
import mongoose from 'mongoose';

// Mock data voor gebruik wanneer de database offline is
const mockTickets = [
  {
    _id: 'mock-1',
    meldingsnummer: 'M-00001',
    melddatum: new Date('2023-05-15'),
    probleem: 'Testprobleem 1',
    status: 'Nieuw' as TicketStatus,
    behandelaar: 'John Doe',
    prioriteit: 'Hoog',
    historie: [
      {
        status: 'Nieuw' as TicketStatus,
        startDatum: new Date('2023-05-15'),
        behandelaar: 'John Doe',
        duur: 0
      }
    ]
  },
  {
    _id: 'mock-2',
    meldingsnummer: 'M-00002',
    melddatum: new Date('2023-05-16'),
    probleem: 'Testprobleem 2',
    status: 'In behandeling' as TicketStatus,
    behandelaar: 'Jane Smith',
    prioriteit: 'Medium',
    historie: [
      {
        status: 'Nieuw' as TicketStatus,
        startDatum: new Date('2023-05-16'),
        behandelaar: 'John Doe',
        duur: 24
      },
      {
        status: 'In behandeling' as TicketStatus,
        startDatum: new Date('2023-05-17'),
        behandelaar: 'Jane Smith',
        duur: 0
      }
    ]
  },
  {
    _id: 'mock-3',
    meldingsnummer: 'M-00003',
    melddatum: new Date('2023-05-17'),
    probleem: 'Testprobleem 3',
    status: 'Afgerond' as TicketStatus,
    behandelaar: 'Jane Smith',
    prioriteit: 'Laag',
    historie: [
      {
        status: 'Nieuw' as TicketStatus,
        startDatum: new Date('2023-05-17'),
        behandelaar: 'John Doe',
        duur: 12
      },
      {
        status: 'In behandeling' as TicketStatus,
        startDatum: new Date('2023-05-18'),
        behandelaar: 'Jane Smith',
        duur: 36
      },
      {
        status: 'Afgerond' as TicketStatus,
        startDatum: new Date('2023-05-20'),
        behandelaar: 'Jane Smith',
        duur: 0
      }
    ]
  }
];

// Hulpfunctie om te controleren of MongoDB verbonden is
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, terugvallen op testgegevens');
      return res.json(mockTickets);
    }

    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('Fout bij ophalen tickets:', error);
    // Fallback naar mock data als er een fout is
    res.json(mockTickets);
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, simuleer ticket creatie');
      return res.status(200).json({
        message: 'Ticket gesimuleerd (database offline)',
        ticket: {
          ...req.body,
          _id: `mock-${Date.now()}`,
          createdAt: new Date()
        }
      });
    }

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
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, simuleer ticket update');
      return res.status(200).json({
        message: 'Ticket update gesimuleerd (database offline)',
        ticket: {
          _id: req.params.id,
          ...req.body,
          updatedAt: new Date()
        }
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: 'Fout bij updaten ticket', error });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, simuleer ticket verwijdering');
      return res.status(200).json({
        message: 'Ticket verwijdering gesimuleerd (database offline)',
        id: req.params.id
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ticket verwijderd' });
  } catch (error) {
    res.status(400).json({ message: 'Fout bij verwijderen ticket', error });
  }
};

export const getTicketStats = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, terugvallen op test statistieken');
      return res.json({
        totaal: mockTickets.length,
        perStatus: [
          { _id: 'Nieuw', count: 1 },
          { _id: 'In behandeling', count: 1 },
          { _id: 'Afgerond', count: 1 }
        ],
        perBehandelaar: [
          { _id: 'John Doe', count: 1 },
          { _id: 'Jane Smith', count: 2 }
        ]
      });
    }

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
    console.error('Fout bij ophalen statistieken:', error);
    res.json({
      totaal: mockTickets.length,
      perStatus: [
        { _id: 'Nieuw', count: 1 },
        { _id: 'In behandeling', count: 1 },
        { _id: 'Afgerond', count: 1 }
      ],
      perBehandelaar: [
        { _id: 'John Doe', count: 1 },
        { _id: 'Jane Smith', count: 2 }
      ]
    });
  }
};

export const resetAllTickets = async (req: Request, res: Response) => {
  try {
    if (!isDatabaseConnected()) {
      console.log('Database niet verbonden, simuleer reset');
      return res.json({ 
        message: 'Reset gesimuleerd (database offline)',
        timestamp: new Date()
      });
    }

    await Ticket.deleteMany({});
    res.json({ 
      message: 'Alle tickets zijn verwijderd',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Fout bij verwijderen tickets', 
      error 
    });
  }
}; 