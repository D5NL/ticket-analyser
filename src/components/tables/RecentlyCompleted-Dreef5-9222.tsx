import React from 'react';
import { ITicket } from '../../database/models/Ticket.js';
import { format, isValid } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  tickets: ITicket[];
}

export const RecentlyCompleted: React.FC<Props> = ({ tickets }) => {
  // Debug logs toevoegen
  console.log('Alle tickets:', tickets);
  console.log('Eerste ticket voorbeeld:', tickets[0]);

  const recentlyCompleted = tickets
    .filter(ticket => {
      console.log('Ticket status:', ticket.status);
      // Case-insensitive vergelijking
      return ticket.status?.toLowerCase() === 'afgerond';
    })
    .sort((a, b) => {
      const dateA = new Date(a.afgerondeOp || a.laatsteUpdate);
      const dateB = new Date(b.afgerondeOp || b.laatsteUpdate);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  console.log('Gefilterde afgeronde tickets:', recentlyCompleted);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Onbekend';
    const date = new Date(dateString);
    return isValid(date) 
      ? format(date, 'd MMMM yyyy', { locale: nl })
      : 'Ongeldige datum';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Recent Afgeronde Tickets</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticketnummer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probleem
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Behandelaar
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Afgerond op
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doorlooptijd
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentlyCompleted.map((ticket, index) => (
              <tr key={ticket.ticketnummer || `row-${index}`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {ticket.ticketnummer}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.probleem}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {ticket.behandelaar}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(ticket.afgerondeOp)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
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