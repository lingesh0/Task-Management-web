import Lottie from 'lottie-react';
import emptyTasks from '../assets/empty-tasks.json'; // Place a Lottie JSON here

export default function EmptyStateAnimation({ message = "You're all caught up!" }) {
  return (
    <div className="flex flex-col items-center py-12">
      <Lottie animationData={emptyTasks} style={{ width: 180, height: 180 }} />
      <p className="mt-4 text-lg text-gray-500">{message}</p>
    </div>
  );
} 