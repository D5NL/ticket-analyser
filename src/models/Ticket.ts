interface StatusHistory {
  status: string;
  timestamp: Date;
}

const ticketSchema = new Schema({
  ticketnummer: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  omschrijving: String,
  klant: String,
  aanmaakDatum: Date,
  laatsteUpdate: Date,
  afgerondeOp: Date,
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, required: true }
  }]
}); 