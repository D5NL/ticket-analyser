import React, { useEffect, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { ITicket } from '../../database/models/Ticket';
import { Chart as ChartJS } from 'chart.js';

interface Props {
  tickets: ITicket[];
}

export const ProblemDistribution: React.FC<Props> = ({ tickets }) => {
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const problemCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.probleem] = (acc[ticket.probleem] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sorteer op aantal en neem top 10
  const topProblems = Object.entries(problemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const data = {
    labels: topProblems.map(([label]) => label),
    datasets: [{
      data: topProblems.map(([,value]) => value),
      backgroundColor: [
        'rgba(59, 130, 246, 0.5)',  // blue
        'rgba(16, 185, 129, 0.5)',  // green
        'rgba(239, 68, 68, 0.5)',   // red
        'rgba(245, 158, 11, 0.5)',  // yellow
        'rgba(139, 92, 246, 0.5)',  // purple
        'rgba(236, 72, 153, 0.5)',  // pink
        'rgba(14, 165, 233, 0.5)',  // light blue
        'rgba(168, 85, 247, 0.5)',  // violet
        'rgba(249, 115, 22, 0.5)',  // orange
        'rgba(20, 184, 166, 0.5)',  // teal
      ]
    }]
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Top 10 Problemen</h3>
      <div className="relative w-full h-[300px]">
        <div className="absolute inset-0">
          <Pie 
            ref={chartRef}
            data={data} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right' as const
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}; 