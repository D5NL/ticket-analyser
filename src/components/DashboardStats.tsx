import React, { useMemo } from 'react';
import { ITicket } from '../database/models/Ticket.js';

interface DashboardStatsProps {
  tickets: ITicket[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tickets }) => {
  // Status verdeling
  const statusCounts = useMemo(() => {
    // ... bestaande code ...
  }, [tickets]);

  // Nieuwe en afgeronde tickets tellen
  const kpiStats = useMemo(() => ({
    nieuw: tickets.filter(ticket => ticket.status === 'Nieuw').length,
    afgerond: tickets.filter(ticket => ticket.status === 'Afgerond').length
  }), [tickets]);

  // Afgeronde tickets per maand (laatste 6 maanden)
  const completedPerMonth = useMemo(() => {
    // ... bestaande code ...
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Nieuwe KPIs bovenaan */}
      <div className="grid grid-cols-2 gap-4">
        {/* Nieuwe tickets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Nieuwe tickets</p>
              <p className="text-2xl font-bold text-gray-900">{kpiStats.nieuw}</p>
            </div>
          </div>
        </div>

        {/* Afgeronde tickets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Afgeronde tickets</p>
              <p className="text-2xl font-bold text-gray-900">{kpiStats.afgerond}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bestaande status wijzigingen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ... bestaande status wijzigingen code ... */}
      </div>

      {/* Bestaande grafieken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ... bestaande grafieken code ... */}
      </div>
    </div>
  );
}; 