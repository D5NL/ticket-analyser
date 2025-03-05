// Interface definities voor de applicatie

// Status historie item
export interface IStatusHistory {
  status: string;
  timestamp: Date;
}

// Ticket interface, komt overeen met het Mongoose schema
export interface ITicket {
  meldingsnummer: string;
  ticketnummer?: string;
  melder: string;
  behandelaar: string;
  status: string;
  probleem?: string;
  melddatum?: Date;
  aanmaakDatum: Date;
  laatsteUpdate: Date;
  afgerondeOp?: Date;
  doorlooptijd?: number;
  statusHistory: IStatusHistory[];
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface voor ticket data tijdens het importeren/verwerken
export interface ITicketData {
  meldingsnummer?: string;
  ticketnummer?: string;
  melder?: string;
  behandelaar?: string;
  status?: string;
  probleem?: string;
  melddatum?: Date;
  aanmaakDatum?: Date;
  laatsteUpdate?: Date;
  afgerondeOp?: Date;
  doorlooptijd?: number;
  statusHistory?: IStatusHistory[];
  [key: string]: any; // Voor extra velden
}

// Error interface voor mislukte tickets
export interface ITicketError {
  error: string;
  ticket: ITicketData;
}

// Statistieken voor ticket uploads
export interface IUploadStats {
  new: number;
  updated: number;
  skipped: number;
  statusChanged: number;
} 