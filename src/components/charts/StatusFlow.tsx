import React from 'react';
import { ITicket } from '../../database/models/Ticket';

interface Props {
  tickets: ITicket[];
}

export const StatusFlow: React.FC<Props> = ({ tickets }) => {
  const statusTransitions = tickets.reduce((acc, ticket) => {
    // Controleer of historie bestaat en een array is
    if (ticket.historie && Array.isArray(ticket.historie) && ticket.historie.length > 0) {
      ticket.historie.forEach((h, i) => {
        if (i > 0) {
          const from = ticket.historie[i-1].status;
          const to = h.status;
          const key = `${from}->${to}`;
          acc[key] = (acc[key] || 0) + 1;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  // Sorteer op aantal transities
  const sortedTransitions = Object.entries(statusTransitions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Top 10 Status Overgangen</h3>
      <div className="space-y-2">
        {sortedTransitions.map(([transition, count]) => (
          <div key={transition} className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{transition.split('->')[0]}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-sm text-gray-600">{transition.split('->')[1]}</span>
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm font-medium text-gray-900">{count}x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 