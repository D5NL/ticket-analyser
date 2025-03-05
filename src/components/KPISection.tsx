import React, { useState } from 'react';
import { ITicket } from '../database/models/Ticket';
import { format, subMonths, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';

interface KPISectionProps {
  tickets: ITicket[];
}

export const KPISection: React.FC<KPISectionProps> = ({ tickets }) => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'), // Standaard laatste maand
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  // Filter tickets op datum range
  const filteredTickets = tickets.filter(ticket => {
    const ticketDate = new Date(ticket.melddatum);
    return ticketDate >= new Date(dateRange.startDate) && 
           ticketDate <= new Date(dateRange.endDate);
  });

  // Bereken KPIs
  const kpiStats = {
    nieuw: filteredTickets.filter(ticket => ticket.status === 'Nieuw').length,
    afgerond: filteredTickets.filter(ticket => ticket.status === 'Afgerond').length,
    openstaand: filteredTickets.filter(ticket => ticket.status !== 'Afgerond').length,
    gemiddeldeDoorlooptijd: Math.round(
      filteredTickets
        .filter(ticket => ticket.status === 'Afgerond')
        .reduce((acc, ticket) => acc + ticket.doorlooptijd, 0) / 
      filteredTickets.filter(ticket => ticket.status === 'Afgerond').length || 0
    )
  };

  return (
    <div className="mb-6">
      {/* Datum filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Van:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tot:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Openstaande tickets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Openstaand</p>
              <p className="text-2xl font-bold text-gray-900">{kpiStats.openstaand}</p>
            </div>
          </div>
        </div>

        {/* Gemiddelde doorlooptijd */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gem. doorlooptijd</p>
              <p className="text-2xl font-bold text-gray-900">{kpiStats.gemiddeldeDoorlooptijd} dagen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 