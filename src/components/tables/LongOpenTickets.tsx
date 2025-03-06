import React from 'react';
import { ITicket } from '../../database/models/Ticket.js';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  tickets: Omit<ITicket, keyof Document>[];
  threshold?: number; // Aantal dagen waarna een ticket als 'lang open' wordt beschouwd
}

export const LongOpenTickets: React.FC<Props> = ({ tickets, threshold = 14 }) => {
  const openTickets = tickets
    .filter(ticket => ticket.status !== 'Afgerond' && ticket.doorlooptijd > threshold)
    .sort((a, b) => b.doorlooptijd - a.doorlooptijd)
    .slice(0, 10);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        Lang Openstaande Tickets (&gt;{threshold} dagen)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meldingsnummer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probleem
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Behandelaar
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Melddatum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doorlooptijd
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {openTickets.map(ticket => (
              <tr key={ticket.meldingsnummer}>
                <td className="px-4 py-3 text-sm text-gray-900">{ticket.meldingsnummer}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ticket.status}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ticket.probleem}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{ticket.behandelaar}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {format(new Date(ticket.melddatum), 'dd MMM yyyy', { locale: nl })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.doorlooptijd} dagen
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 