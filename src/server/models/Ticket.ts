import mongoose from 'mongoose';

export interface ITicket {
  ticketnummer: string;
  melddatum: Date;
  status: string;
  probleem: string;
  behandelaar: string;
  laatsteUpdate: Date;
  afgerondeOp?: Date;
  doorlooptijd: number;
}

const ticketSchema = new mongoose.Schema<ITicket>({
  ticketnummer: { type: String, required: true, unique: true },
  melddatum: { type: Date, required: true },
  status: { type: String, required: true },
  probleem: { type: String, required: true },
  behandelaar: { type: String, required: true },
  laatsteUpdate: { type: Date, required: true },
  afgerondeOp: { type: Date },
  doorlooptijd: { type: Number, default: 0 }
});

// Controleer of het model al bestaat voordat we het maken
export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema); 