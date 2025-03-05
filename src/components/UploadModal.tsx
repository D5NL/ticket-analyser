import React, { useState } from 'react';
import { ITicket } from '../database/models/Ticket';

// API basis URL - dynamisch voor productie
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (tickets: any[]) => Promise<void>;
  onReset: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, onReset }) => {
  const [uploadStats, setUploadStats] = useState<{
    totalRead: number;
    newTickets: number;
    updatedTickets: number;
    autoCompletedTickets?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // Lees het Excel bestand
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/tickets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Fout bij uploaden bestand');
      }

      const { tickets, stats } = await response.json();
      
      // Update statistieken
      setUploadStats({
        totalRead: tickets.length,
        newTickets: stats.new,
        updatedTickets: stats.updated,
        autoCompletedTickets: stats.autoCompleted || 0
      });

      // Upload de tickets
      await onUpload(tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upload Tickets</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            {/* Upload sectie */}
            <div className="space-y-4">
              <label className="block">
                <span className="sr-only">Kies een bestand</span>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </label>

              {loading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Bestand verwerken...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 p-4 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {uploadStats && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Upload resultaat:</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>Totaal ingelezen: {uploadStats.totalRead} tickets</li>
                    <li>Nieuwe tickets: {uploadStats.newTickets}</li>
                    <li>Gewijzigde tickets: {uploadStats.updatedTickets}</li>
                    {uploadStats.autoCompletedTickets !== undefined && uploadStats.autoCompletedTickets > 0 && (
                      <li>Automatisch afgerond: {uploadStats.autoCompletedTickets} tickets</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Acties */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onReset}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Reset alle data
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 