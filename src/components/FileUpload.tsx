import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onUpload: (data: any[]) => void;
  onReset?: () => void;
}

const DEFAULT_HANDLER = 'Service Support';

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, onReset }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateData = (data: any[]) => {
    // Filter lege rijen
    const nonEmptyRows = data.filter(row => 
      Object.values(row).some(value => value !== undefined && value !== '')
    );

    if (nonEmptyRows.length === 0) {
      throw new Error('Het Excel bestand bevat geen geldige data');
    }

    // Mapping van verwachte naar gevonden kolomnamen
    const columnMapping = {
      meldingsnummer: 'Meldingsnummer',
      melddatum: 'Melddatum',
      object: 'Object',
      probleem: 'Probleem',
      melder: 'Melder',
      leverancier: 'Leverancier',
      omschrijving: 'Omschrijving',
      status: 'Status',
      behandelaar: 'Behandelaar',
      prioriteit: 'Prioriteit'
    };

    // Verplichte kolommen
    const requiredColumns = ['Meldingsnummer', 'Melddatum', 'Probleem', 'Behandelaar'];
    const missingColumns = requiredColumns.filter(col => 
      !Object.keys(nonEmptyRows[0]).includes(col)
    );

    if (missingColumns.length > 0) {
      throw new Error(
        'Verplichte kolommen ontbreken:\n' + 
        missingColumns.join('\n')
      );
    }

    return nonEmptyRows;
  };

  const formatExcelData = (jsonData: any[]) => {
    console.log('Formatting Excel data:', jsonData);
    // Debug logging
    console.log('Ruwe data van Excel:', jsonData);
    console.log('Eerste rij kolommen:', jsonData[0] ? Object.keys(jsonData[0]) : 'Geen data');

    // Filter lege rijen
    const validRows = jsonData.filter(row => {
      const hasValues = Object.values(row).some(value => 
        value !== undefined && value !== null && value !== ''
      );
      if (!hasValues) {
        console.log('Lege rij overgeslagen:', row);
      }
      return hasValues;
    });

    // Status mapping
    const statusMapping: { [key: string]: string } = {
      'Actief': 'Actief',
      'Afgerond': 'Afgerond',
      'In afwachting': 'In afwachting',
      'In afwachting goedkeuring (eigenaar)': 'In afwachting goedkeuring (eigenaar)',
      'Ingepland (taak aangemaakt)': 'Ingepland (taak aangemaakt)',
      'Offerte aanvraag': 'Offerte aanvraag',
      'On hold': 'On hold',
      'Opdrachtbon verstuurd': 'Opdrachtbon verstuurd',
      'Wacht op huurder': 'Wacht op huurder',
      'Wacht op leverancier/ materialen': 'Wacht op leverancier/ materialen'
    };

    // Prioriteit mapping
    const prioriteitMapping: { [key: string]: string } = {
      'Normaal': 'Medium',
      'Laag': 'Laag',
      'Medium': 'Medium',
      'Hoog': 'Hoog',
      'Kritiek': 'Kritiek'
    };

    const formattedData = validRows.map((row, index) => {
      // Debug logging voor probleem rij
      if (row['Meldingsnummer'] === 'M-06341') {
        console.log('Probleem ticket data:', {
          rij: index + 1,
          alleKolommen: row,
          kolomNamen: Object.keys(row),
          behandelaarWaarde: row['Behandelaar'],
          behandelaarType: typeof row['Behandelaar']
        });
      }

      const meldingsnummer = row['Meldingsnummer']?.toString().trim();
      if (!meldingsnummer) {
        throw new Error('Meldingsnummer ontbreekt');
      }

      // Controleer eerst de status
      const rawStatus = row['Status']?.trim() || 'Nieuw';
      let mappedStatus = statusMapping[rawStatus] || 'Afgerond';
      
      // Behandelaar logica
      let behandelaar = row['Behandelaar']?.toString().trim();
      if (!behandelaar) {
        const allowEmptyHandler = [
          'on hold',
          'wacht op leverancier/ materialen',
          'afgerond',
          'geannuleerd'
        ];

        const currentStatus = rawStatus.toLowerCase();
        if (allowEmptyHandler.includes(currentStatus)) {
          behandelaar = DEFAULT_HANDLER;
          console.log(`Standaard behandelaar toegewezen voor ticket ${meldingsnummer} met status ${rawStatus}`);
        } else {
          throw new Error(`Behandelaar ontbreekt voor ticket ${meldingsnummer} (rij ${index + 1})`);
        }
      }

      // Als de behandelaar Service Support is, zet de status op Nieuw
      if (behandelaar === DEFAULT_HANDLER) {
        mappedStatus = 'Nieuw';
      }

      // Map de status en prioriteit
      const rawPrioriteit = row['Prioriteit']?.trim() || 'Medium';
      const mappedPrioriteit = prioriteitMapping[rawPrioriteit] || 'Medium';

      // Parse de melddatum
      let melddatum = new Date();
      try {
        const datumString = row['Melddatum']?.toString().trim();
        if (datumString) {
          const [dag, maand, jaar] = datumString.split(/[-/]/);
          melddatum = new Date(parseInt(jaar), parseInt(maand) - 1, parseInt(dag));
          if (isNaN(melddatum.getTime())) {
            melddatum = new Date();
          }
        }
      } catch (err) {
        console.warn('Kon melddatum niet parsen:', row['Melddatum']);
      }

      const formattedTicket = {
        meldingsnummer,
        melddatum,
        object: row['Object']?.toString().trim() || '',
        probleem: row['Probleem']?.toString().trim() || 'Geen probleem opgegeven',
        melder: row['Melder']?.toString().trim() || '',
        leverancier: row['Leverancier']?.toString().trim() || '',
        omschrijving: row['Omschrijving']?.toString().trim() || '',
        status: mappedStatus,
        behandelaar,
        prioriteit: mappedPrioriteit,
        historie: [{
          status: mappedStatus,
          startDatum: melddatum,
          behandelaar,
          duur: 0
        }]
      };

      console.log(`Formatted ticket ${index}:`, formattedTicket);
      return formattedTicket;
    });

    console.log('All formatted tickets:', formattedData);
    return formattedData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: '', // Gebruik lege string voor lege cellen
            header: 1 // Gebruik eerste rij als headers
          });

          // Verwijder lege rijen en kolommen
          const cleanData = jsonData.filter((row: any[]) => 
            row.some(cell => cell !== undefined && cell !== null && cell !== '')
          );

          // Converteer array naar object met kolomnamen
          const headers = cleanData[0];
          const rows = cleanData.slice(1).map((row: any[]) => {
            const obj: { [key: string]: any } = {};
            headers.forEach((header: string, i: number) => {
              if (header) {
                obj[header.trim()] = row[i] || '';
              }
            });
            return obj;
          });

          console.log('Headers:', headers);
          console.log('Verwerkte rijen:', rows);

          const validData = validateData(rows);
          const formattedData = formatExcelData(validData);
          await onUpload(formattedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Fout bij verwerken Excel bestand');
          console.error('Excel verwerking error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Fout bij het lezen van het bestand');
      console.error('Bestand lezen error:', err);
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Weet je zeker dat je alle tickets wilt verwijderen?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/tickets/reset', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Fout bij resetten tickets');
      }

      const result = await response.json();
      console.log('Reset resultaat:', result);
      
      // Roep de onReset callback aan als die bestaat
      if (onReset) {
        onReset();
      }
    } catch (err) {
      setError('Fout bij resetten tickets');
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-blue-100 rounded-xl bg-gradient-to-br from-white to-blue-50 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Service Ticket Import</h2>
        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          Excel Upload
        </span>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-3 file:px-6
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white
                       hover:file:bg-blue-700
                       file:transition-colors file:cursor-pointer
                       file:shadow-sm"
            />
          </div>
          
          <button
            onClick={handleReset}
            className="py-3 px-6 rounded-full text-sm font-semibold 
                     bg-red-600 text-white hover:bg-red-700 
                     transition-colors shadow-sm
                     flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset Data
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-lg">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="font-medium">Bezig met verwerken...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm whitespace-pre-line">{error}</div>
          </div>
        )}

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verwacht Excel Formaat
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Verplichte Kolommen:</p>
              <ul className="space-y-1">
                {['Meldingsnummer', 'Melddatum', 'Behandelaar', 'Probleem'].map(col => (
                  <li key={col} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {col}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Optionele Kolommen:</p>
              <ul className="space-y-1">
                {['Status', 'Object', 'Leverancier', 'Omschrijving', 'Prioriteit'].map(col => (
                  <li key={col} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                    </svg>
                    {col}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 space-y-1">
              <span className="block font-medium text-gray-700">Let op:</span>
              <span className="block">• Status 'Opdrachtbon verstuurd' → 'In Behandeling'</span>
              <span className="block">• Prioriteit 'Normaal' → 'Medium'</span>
              <span className="block">• Datumformaat: dd-mm-yyyy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 