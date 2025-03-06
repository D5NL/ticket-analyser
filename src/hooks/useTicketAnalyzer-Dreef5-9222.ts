import { useState, useEffect } from 'react';
import { ITicket } from '../database/models/Ticket.js';

interface TicketStats {
  totaal: number;
  perStatus: Array<{ _id: string; count: number }>;
  perBehandelaar: Array<{ _id: string; count: number }>;
}

export const useTicketAnalyzer = () => {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Ophalen tickets...');
      const response = await fetch('http://localhost:3000/api/tickets');
      if (!response.ok) throw new Error('Fout bij ophalen tickets');
      const data = await response.json();
      console.log('Ontvangen tickets:', data.length);
      setTickets(data);
    } catch (err) {
      console.error('Fout bij ophalen tickets:', err);
      setError('Fout bij ophalen tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tickets/stats');
      if (!response.ok) throw new Error('Fout bij ophalen statistieken');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Fout bij ophalen statistieken:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  const uploadTickets = async (newTickets: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Uploading tickets:', newTickets); // Debug log

      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickets: newTickets }), // Wrap in tickets object
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij uploaden tickets');
      }

      await fetchTickets(); // Ververs de tickets
      await fetchStats();   // Ververs de statistieken
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      console.log('Refreshing data...');
      const response = await fetch('http://localhost:3000/api/tickets');
      const data = await response.json();
      console.log('Refreshed data:', data);
      setTickets(data);
      await fetchStats();
    } catch (error) {
      console.error('Refresh error:', error);
      setError('Fout bij ophalen tickets');
    } finally {
      setLoading(false);
    }
  };

  return {
    tickets,
    stats,
    loading,
    error,
    uploadTickets,
    refreshData: () => {
      fetchTickets();
      fetchStats();
    }
  };
}; 