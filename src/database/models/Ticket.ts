import mongoose, { Schema, Document, Model } from 'mongoose';

// Enum voor ticket statussen
export enum TicketStatus {
  Nieuw = 'Nieuw',
  Actief = 'Actief',
  InBehandeling = 'In behandeling',
  InAfwachting = 'In afwachting',
  InAfwachtingGoedkeuring = 'In afwachting goedkeuring (eigenaar)',
  WachtOpHuurder = 'Wacht op huurder',
  WachtOpLeverancier = 'Wacht op leverancier/ materialen',
  Ingepland = 'Ingepland (taak aangemaakt)',
  OfferteAanvraag = 'Offerte aanvraag',
  OpdrachtbonVerstuurd = 'Opdrachtbon verstuurd',
  OnHold = 'On hold',
  Afgerond = 'Afgerond'
}

export type PrioriteitType = 'Laag' | 'Medium' | 'Hoog' | 'Kritiek';

// Interface voor de historie items met verbeterde tijdsregistratie
interface IStatusHistory {
  status: TicketStatus;
  startDatum: Date;    // Wanneer de status inging
  eindDatum?: Date;    // Wanneer de status wijzigde (null voor huidige status)
  duur?: number;       // Duur in dagen
  behandelaar: string; // Wie de status wijzigde
  opmerking?: string;  // Optionele toelichting
}

// Interface voor het Ticket document
export interface ITicket extends Document {
  _id: string;  // Moet required zijn omdat Document dit vereist
  meldingsnummer: string;
  ticketnummer?: string;    // Alternatieve id voor tickets
  melddatum: Date;
  object: string;
  probleem: string;
  melder: string;
  leverancier: string;
  omschrijving: string;
  status: TicketStatus;
  behandelaar: string;
  prioriteit: 'Laag' | 'Medium' | 'Hoog' | 'Kritiek';
  historie: Array<{
    status: TicketStatus;
    startDatum: Date;
    eindDatum?: Date;       // Datum wanneer de status werd gewijzigd
    behandelaar: string;
    duur: number;
  }>;
  doorlooptijd: number;    // Berekende doorlooptijd
  laatsteUpdate: Date;     // Datum van laatste statuswijziging
  afgerondeOp?: Date;      // Datum waarop het ticket is afgerond
  createdAt?: Date;        // Datum van eerste registratie
  updatedAt?: Date;        // Datum van laatste update
}

// Schema voor de historie
const statusHistorySchema = new Schema<IStatusHistory>({
  status: {
    type: String,
    enum: Object.values(TicketStatus),
    required: true
  },
  startDatum: {
    type: Date,
    required: true
  },
  eindDatum: Date,
  duur: Number,
  behandelaar: {
    type: String,
    required: true,
    trim: true
  },
  opmerking: String
});

// Schema voor het Ticket
const ticketSchema = new Schema<ITicket>({
  meldingsnummer: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  melddatum: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TicketStatus),
    required: true,
    default: TicketStatus.Nieuw
  },
  behandelaar: {
    type: String,
    required: true,
    trim: true
  },
  object: {
    type: String,
    trim: true,
    default: ''
  },
  probleem: {
    type: String,
    required: true,
    trim: true,
    default: 'Geen probleem opgegeven'
  },
  leverancier: {
    type: String,
    trim: true,
    default: ''
  },
  omschrijving: {
    type: String,
    trim: true,
    default: ''
  },
  prioriteit: {
    type: String,
    enum: ['Laag', 'Medium', 'Hoog', 'Kritiek'],
    required: true,
    default: 'Medium'
  },
  historie: {
    type: [statusHistorySchema],
    required: true,
    default: []
  },
  doorlooptijd: {
    type: Number,
    default: 0
  },
  laatsteUpdate: {
    type: Date,
    default: Date.now
  },
  melder: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Pre-save middleware voor betere historie tracking
ticketSchema.pre('save', function(next) {
  const ticket = this;
  const now = new Date();
  
  // Als het een nieuw ticket is
  if (ticket.isNew && (!ticket.historie || ticket.historie.length === 0)) {
    ticket.historie = [{
      status: ticket.status,
      startDatum: ticket.melddatum,
      behandelaar: ticket.behandelaar,
      duur: 0
    }];
  } 
  // Als het een bestaand ticket is en de status is gewijzigd
  else if (ticket.isModified('status')) {
    const laatsteHistorie = ticket.historie[ticket.historie.length - 1];
    
    // Sluit vorige status af
    if (laatsteHistorie && !laatsteHistorie.eindDatum) {
      laatsteHistorie.eindDatum = now;
      laatsteHistorie.duur = Math.round(
        (laatsteHistorie.eindDatum.getTime() - laatsteHistorie.startDatum.getTime()) 
        / (1000 * 60 * 60 * 24)
      );
    }

    // Voeg nieuwe status toe
    ticket.historie.push({
      status: ticket.status,
      startDatum: now,
      behandelaar: ticket.behandelaar,
      duur: 0
    });
  }

  // Update laatsteUpdate en bereken totale doorlooptijd
  ticket.laatsteUpdate = now;
  if (ticket.historie && ticket.historie.length > 0) {
    const start = ticket.historie[0].startDatum;
    ticket.doorlooptijd = Math.round(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  next();
});

// Static method voor het bijwerken van tickets met historie
ticketSchema.statics.updateWithHistory = async function(ticketData: Partial<ITicket>) {
  const Ticket = this;
  const now = new Date();

  const existingTicket = await Ticket.findOne({ 
    meldingsnummer: ticketData.meldingsnummer 
  });

  if (existingTicket) {
    // Update alleen als er iets is gewijzigd
    if (
      existingTicket.status !== ticketData.status ||
      existingTicket.behandelaar !== ticketData.behandelaar ||
      existingTicket.prioriteit !== ticketData.prioriteit
    ) {
      // Sluit huidige status af als de status wijzigt
      if (existingTicket.status !== ticketData.status) {
        const laatsteHistorie = existingTicket.historie[existingTicket.historie.length - 1];
        if (laatsteHistorie && !laatsteHistorie.eindDatum) {
          laatsteHistorie.eindDatum = now;
          laatsteHistorie.duur = Math.round(
            (now.getTime() - laatsteHistorie.startDatum.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Voeg nieuwe status toe aan historie
        existingTicket.historie.push({
          status: ticketData.status!,
          startDatum: now,
          behandelaar: ticketData.behandelaar!,
          duur: 0
        });
      }

      // Update de velden
      Object.assign(existingTicket, {
        ...ticketData,
        laatsteUpdate: now
      });

      return existingTicket.save();
    }
    return existingTicket; // Geen wijzigingen nodig
  }

  // Maak nieuw ticket aan met initiële historie
  return Ticket.create({
    ...ticketData,
    melddatum: now,
    historie: [{
      status: ticketData.status || TicketStatus.Nieuw,
      startDatum: now,
      behandelaar: ticketData.behandelaar,
      duur: 0
    }],
    laatsteUpdate: now
  });
};

// Model type definitie met static methods
interface TicketModel extends Model<ITicket> {
  updateWithHistory(ticketData: Partial<ITicket>): Promise<ITicket>;
}

// Export het model
export const Ticket = mongoose.model<ITicket, TicketModel>('Ticket', ticketSchema); 