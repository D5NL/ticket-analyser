import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { useTicketAnalyzer } from './hooks/useTicketAnalyzer';
import { FilterBar } from './components/FilterBar';
import { format, subMonths } from 'date-fns';
import { DashboardStats } from './components/DashboardStats';
import { ITicket, TicketStatus } from './database/models/Ticket';
import { StatusDistribution } from './components/charts/StatusDistribution';
import { RecentlyCompleted } from './components/tables/RecentlyCompleted';
import { TicketsPerMonth } from './components/charts/TicketsPerMonth';
import { HandlerPerformance } from './components/charts/HandlerPerformance';
import { ProblemDistribution } from './components/charts/ProblemDistribution';
import { StatusFlow } from './components/charts/StatusFlow';
import { TimeToResolve } from './components/charts/TimeToResolve';
import { LongOpenTickets } from './components/tables/LongOpenTickets';
import './utils/chartConfig';  // Voeg deze import toe bovenaan
import { KPISection } from './components/KPISection';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { UploadModal } from './components/UploadModal';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useDarkMode } from './hooks/useDarkMode';

export const App: React.FC = () => {
  // Gebruik de dark mode hook
  const { isDarkMode } = useDarkMode();

  const initialFilters = {
    dateRange: {
      startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    },
    status: [] as TicketStatus[],
    behandelaar: '',
    probleem: ''
  };

  const [activeFilters, setActiveFilters] = useState<null | typeof initialFilters>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { 
    tickets, 
    stats, 
    loading, 
    error, 
    uploadTickets, 
    refreshData 
  } = useTicketAnalyzer();

  // Beschikbare filter opties berekenen
  const availableFilters = useMemo(() => {
    if (!tickets) return { behandelaars: [], problemen: [] };
    
    return {
      behandelaars: [...new Set(tickets.map(t => t.behandelaar))].sort(),
      problemen: [...new Set(tickets.map(t => t.probleem))].sort()
    };
  }, [tickets]);

  // Gefilterde tickets alleen als er actieve filters zijn
  const filteredTickets = useMemo(() => {
    console.log('Raw tickets:', tickets);
    console.log('Active filters:', activeFilters);

    if (!tickets || !activeFilters) {
      console.log('Returning unfiltered tickets:', tickets || []);
      return tickets || [];
    }

    const filtered = tickets.filter(ticket => {
      // Datum filter
      const ticketDate = new Date(ticket.melddatum);
      const startDate = new Date(activeFilters.dateRange.startDate);
      const endDate = new Date(activeFilters.dateRange.endDate);
      
      if (ticketDate < startDate || ticketDate > endDate) {
        return false;
      }

      // Status filter
      if (activeFilters.status.length > 0 && !activeFilters.status.includes(ticket.status)) {
        return false;
      }

      // Behandelaar filter
      if (activeFilters.behandelaar && ticket.behandelaar !== activeFilters.behandelaar) {
        return false;
      }

      // Probleem filter
      if (activeFilters.probleem && ticket.probleem !== activeFilters.probleem) {
        return false;
      }

      return true;
    });

    console.log('Filtered tickets:', filtered);
    return filtered;
  }, [tickets, activeFilters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setActiveFilters(newFilters);
  };

  const handleReset = async () => {
    if (window.confirm('Weet je zeker dat je alle tickets wilt verwijderen?')) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';
        await fetch(`${API_BASE_URL}/api/tickets/reset`, {
          method: 'POST',
        });
        refreshData();
      } catch (error) {
        console.error('Fout bij reset:', error);
      }
    }
  };

  // KPI stats berekening
  const kpiStats = useMemo(() => ({
    nieuw: tickets?.filter(ticket => ticket.status === 'Nieuw').length || 0,
    afgerond: tickets?.filter(ticket => ticket.status === 'Afgerond').length || 0
  }), [tickets]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-darkBackground text-darkText' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`py-4 px-6 flex justify-between items-center ${isDarkMode ? 'bg-darkSurface border-darkBorder' : 'bg-white border-gray-200'} border-b`}>
        <h1 className="text-2xl font-bold">Service Ticket Dashboard</h1>
        <div className="flex space-x-4 items-center">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Tickets
          </button>
          <DarkModeToggle />
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-6">
                <FilterBar 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  availableFilters={availableFilters}
                />
                
                <KPISection tickets={filteredTickets} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StatusDistribution tickets={filteredTickets} />
                  <TicketsPerMonth tickets={filteredTickets} />
                  <ProblemDistribution tickets={filteredTickets} />
                  <HandlerPerformance tickets={filteredTickets} />
                  <TimeToResolve tickets={filteredTickets} />
                  <StatusFlow tickets={filteredTickets} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecentlyCompleted tickets={filteredTickets} />
                  <LongOpenTickets tickets={filteredTickets} />
                </div>
              </div>
            ) : (
              <div className={`text-center p-12 rounded-lg ${isDarkMode ? 'bg-darkSurface' : 'bg-white'} shadow-sm`}>
                <h2 className="text-xl font-medium mb-4">Geen tickets gevonden</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Upload tickets om de dashboard analyses te bekijken.</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                  Tickets Uploaden
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {isUploadModalOpen && (
        <UploadModal 
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)} 
          onUpload={uploadTickets}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default App; 