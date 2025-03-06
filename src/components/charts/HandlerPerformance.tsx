import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ITicket } from '../../database/models/Ticket.js';

interface Props {
  tickets: ITicket[];
}

export const HandlerPerformance: React.FC<Props> = ({ tickets }) => {
  const handlerStats = tickets.reduce((acc, ticket) => {
    const handler = ticket.behandelaar;
    if (!acc[handler]) {
      acc[handler] = { total: 0, count: 0 };
    }
    acc[handler].total += ticket.doorlooptijd;
    acc[handler].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const handlers = Object.keys(handlerStats);
  const averages = handlers.map(handler => 
    Math.round(handlerStats[handler].total / handlerStats[handler].count)
  );

  const data = {
    labels: handlers,
    datasets: [{
      label: 'Gemiddelde doorlooptijd (dagen)',
      data: averages,
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
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
      <h3 className="text-lg font-medium mb-4">Doorlooptijd per Behandelaar</h3>
      <div className="flex-1 relative">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}; 