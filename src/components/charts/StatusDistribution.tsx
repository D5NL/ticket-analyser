import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { ITicket } from '../../database/models/Ticket';
import { Modal } from '../Modal';

interface Props {
  tickets: ITicket[];
}

export const StatusDistribution: React.FC<Props> = ({ tickets }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = {
    labels: Object.keys(statusCounts),
    datasets: [{
      label: 'Aantal tickets',
      data: Object.values(statusCounts),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      }
    }
  };

  return (
    <>
      <div 
        className="bg-white p-6 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <h3 className="text-lg font-medium mb-4">Status Verdeling</h3>
        <div className="relative w-full h-[400px]">
          <div className="absolute inset-0">
            <Bar data={data} options={chartOptions} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Status Verdeling"
      >
        <Bar data={data} options={chartOptions} />
      </Modal>
    </>
  );
}; 