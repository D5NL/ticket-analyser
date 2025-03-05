import React, { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { TicketStatus } from '../database/models/Ticket';

interface FilterBarProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    status: TicketStatus[];
    behandelaar: string;
    probleem: string;
  };
  onFilterChange: (filters: any) => void;
  availableFilters: {
    behandelaars: string[];
    problemen: string[];
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const statusOptions: TicketStatus[] = [
    'Actief',
    'Afgerond',
    'In afwachting',
    'In afwachting goedkeuring (eigenaar)',
    'Ingepland (taak aangemaakt)',
    'Offerte aanvraag',
    'On hold',
    'Opdrachtbon verstuurd',
    'Wacht op huurder',
    'Wacht op leverancier/ materialen'
  ];

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      dateRange: {
        startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      },
      status: [],
      behandelaar: '',
      probleem: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="font-medium text-gray-900">Filters</h3>
          <div className="flex items-center gap-2">
            {localFilters.status.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {localFilters.status.length} status
              </span>
            )}
            {localFilters.behandelaar && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Behandelaar
              </span>
            )}
            {localFilters.probleem && (
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Probleem
              </span>
            )}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start datum</label>
              <input
                type="date"
                value={localFilters.dateRange.startDate}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  dateRange: { ...localFilters.dateRange, startDate: e.target.value }
                })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eind datum</label>
              <input
                type="date"
                value={localFilters.dateRange.endDate}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  dateRange: { ...localFilters.dateRange, endDate: e.target.value }
                })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Multiselect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {statusOptions.map(status => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.status.includes(status)}
                    onChange={(e) => {
                      const newStatus = e.target.checked
                        ? [...localFilters.status, status]
                        : localFilters.status.filter(s => s !== status);
                      setLocalFilters({ ...localFilters, status: newStatus });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Behandelaar & Probleem Selects */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Behandelaar</label>
              <select
                value={localFilters.behandelaar}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  behandelaar: e.target.value
                })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Alle behandelaars</option>
                {availableFilters.behandelaars.map(behandelaar => (
                  <option key={behandelaar} value={behandelaar}>
                    {behandelaar}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probleem</label>
              <select
                value={localFilters.probleem}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  probleem: e.target.value
                })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Alle problemen</option>
                {availableFilters.problemen.map(probleem => (
                  <option key={probleem} value={probleem}>
                    {probleem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Filters toepassen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 