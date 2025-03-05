import mongoose from 'mongoose';

/**
 * @typedef {Object} IStatusHistory
 * @property {string} status - Status van het ticket
 * @property {Date} timestamp - Tijdstip van statuswijziging
 */

/**
 * @typedef {Object} ITicket
 * @property {string} meldingsnummer - Uniek identificatienummer voor het ticket
 * @property {string} [ticketnummer] - Alternatief identificatienummer (optioneel)
 * @property {string} melder - Persoon die het ticket heeft gemeld
 * @property {string} behandelaar - Persoon die het ticket behandelt
 * @property {string} status - Huidige status van het ticket
 * @property {string} [probleem] - Beschrijving van het probleem (optioneel)
 * @property {Date} [melddatum] - Datum van melding (optioneel)
 * @property {Date} aanmaakDatum - Datum van aanmaken in systeem
 * @property {Date} laatsteUpdate - Datum van laatste update
 * @property {Date} [afgerondeOp] - Datum van afronding (optioneel)
 * @property {number} [doorlooptijd] - Doorlooptijd in uren (optioneel)
 * @property {IStatusHistory[]} statusHistory - Geschiedenis van statuswijzigingen
 */

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  meldingsnummer: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ticketnummer: {
    type: String,
    index: true
  },
  melder: {
    type: String,
    default: 'Onbekend'
  },
  behandelaar: {
    type: String,
    default: 'Onbekend'
  },
  status: {
    type: String,
    required: true,
    default: 'Nieuw'
  },
  probleem: {
    type: String,
    default: ''
  },
  melddatum: {
    type: Date,
    default: Date.now
  },
  aanmaakDatum: {
    type: Date,
    default: Date.now
  },
  laatsteUpdate: {
    type: Date,
    default: Date.now
  },
  afgerondeOp: {
    type: Date
  },
  doorlooptijd: {
    type: Number,
    default: 0
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  }
}, {
  timestamps: true
});

// Voeg een pre-save hook toe om ervoor te zorgen dat ticketnummer = meldingsnummer indien niet opgegeven
ticketSchema.pre('save', function(next) {
  if (!this.ticketnummer) {
    this.ticketnummer = this.meldingsnummer;
  }
  
  // Als dit een nieuw ticket is of status is gewijzigd, voeg toe aan statusHistory
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  
  // Bereken doorlooptijd als afgerondeOp is ingesteld
  if (this.status === 'Afgerond' && !this.afgerondeOp) {
    this.afgerondeOp = new Date();
  }
  
  if (this.melddatum && this.afgerondeOp) {
    const start = new Date(this.melddatum);
    const end = new Date(this.afgerondeOp);
    this.doorlooptijd = Math.round((end - start) / (1000 * 60 * 60)); // in uren
  }
  
  next();
});

export const Ticket = mongoose.model('Ticket', ticketSchema); 