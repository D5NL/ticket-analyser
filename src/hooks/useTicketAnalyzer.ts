import { useState, useEffect } from 'react';
import { ITicket } from '../database/models/Ticket.js';

interface TicketStats {
  totaal: number;
  perStatus: Array<{ _id: string; count: number }>;
  perBehandelaar: Array<{ _id: string; count: number }>;
}

// API basis URL - dynamisch voor productie
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

export const useTicketAnalyzer = () => {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/tickets`);
      if (!response.ok) throw new Error('Fout bij ophalen tickets');
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError('Fout bij ophalen tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/stats`);
      if (!response.ok) throw new Error('Fout bij ophalen statistieken');
      const data = await response.json();
      setStats(data);
    } catch (err) {
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

      // Maak een map van bestaande tickets op ticketnummer
      const existingTicketsMap = new Map(
        tickets.map(ticket => [ticket.ticketnummer, ticket])
      );

      // Update bestaande tickets en voeg nieuwe toe
      const updatedTickets = newTickets.map(newTicket => {
        const existingTicket = existingTicketsMap.get(newTicket.ticketnummer);
        if (existingTicket) {
          // Als het ticket bestaat, update alleen als het nieuwe ticket een latere update heeft
          const existingDate = new Date(existingTicket.laatsteUpdate);
          const newDate = new Date(newTicket.laatsteUpdate);
          return newDate > existingDate ? newTicket : existingTicket;
        }
        return newTicket;
      });

      // Voeg tickets toe die nog niet in de nieuwe set zitten
      const newTicketNumbers = new Set(newTickets.map(t => t.ticketnummer));
      const remainingTickets = tickets.filter(
        ticket => !newTicketNumbers.has(ticket.ticketnummer)
      );

      // Combineer alle tickets
      const allTickets = [...remainingTickets, ...updatedTickets];

      // Stuur naar de server
      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTickets),
      });

      if (!response.ok) {
        throw new Error('Fout bij uploaden tickets');
      }

      setTickets(allTickets);
      await fetchStats(); // Update de statistieken
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/tickets`);
      const data = await response.json();
      setTickets(data);
      await fetchStats();
    } catch (error) {
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