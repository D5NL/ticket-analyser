import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registreer alle benodigde componenten
ChartJS.register(
  ArcElement,        // Voor pie charts
  CategoryScale,     // Voor bar/line charts
  LinearScale,       // Voor bar/line charts
  BarElement,        // Voor bar charts
  LineElement,       // Voor line charts
  PointElement,      // Voor line charts
  Title,            // Voor titels
  Tooltip,          // Voor tooltips
  Legend,           // Voor legends
  Filler            // Voor area onder line charts
);

// Globale defaults aanpassen
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.elements.line.tension = 0.1;
ChartJS.defaults.font.family = 'system-ui, -apple-system, sans-serif';
ChartJS.defaults.layout.padding = 20; 