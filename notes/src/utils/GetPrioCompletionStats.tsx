import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Helper to get completion data by priority
export function getPriorityCompletionData(tasks: any[]) {
    const priorities = ['low', 'medium', 'high'];
    const total: Record<string, number> = { low: 0, medium: 0, high: 0 };
    const completed: Record<string, number> = { low: 0, medium: 0, high: 0 };

    tasks.forEach(task => {
        if (priorities.includes(task.priority)) {
            total[task.priority]++;
            if (task.completed) completed[task.priority]++;
        }
    });

    return { total, completed };
}