import React from 'react';
import { Line } from 'react-chartjs-2';
import { ITicket } from '../../database/models/Ticket';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Props {
  tickets: ITicket[];
}

export const TicketsPerMonth: React.FC<Props> = ({ tickets }) => {
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  
  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: now
  });

  const ticketCounts = months.map(month => {
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.melddatum);
      return ticketDate.getMonth() === month.getMonth() &&
             ticketDate.getFullYear() === month.getFullYear();
    }).length;
  });

  const data = {
    labels: months.map(month => format(month, 'MMM yyyy', { locale: nl })),
    datasets: [{
      label: 'Aantal tickets',
      data: ticketCounts,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.1,
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-medium mb-4">Tickets per Maand</h3>
      <div className="flex-1 relative">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}; 