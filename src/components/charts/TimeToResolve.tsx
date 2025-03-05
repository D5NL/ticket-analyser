import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ITicket } from '../../database/models/Ticket';

interface Props {
  tickets: ITicket[];
}

export const TimeToResolve: React.FC<Props> = ({ tickets }) => {
  const problemStats = tickets
    .filter(ticket => ticket.status === 'Afgerond')
    .reduce((acc, ticket) => {
      if (!acc[ticket.probleem]) {
        acc[ticket.probleem] = { total: 0, count: 0 };
      }
      acc[ticket.probleem].total += ticket.doorlooptijd;
      acc[ticket.probleem].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

  // Bereken gemiddelden en sorteer op doorlooptijd
  const sortedProblems = Object.entries(problemStats)
    .map(([problem, stats]) => ({
      problem,
      average: Math.round(stats.total / stats.count)
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  const data = {
    labels: sortedProblems.map(p => p.problem),
    datasets: [{
      label: 'Gemiddelde doorlooptijd (dagen)',
      data: sortedProblems.map(p => p.average),
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
      <h3 className="text-lg font-medium mb-4">Doorlooptijd per Probleem (Top 10)</h3>
      <div className="flex-1 relative">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}; 