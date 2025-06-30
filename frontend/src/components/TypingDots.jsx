import { motion } from 'framer-motion';

export function TypingDots() {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-2 h-2 bg-violet-500 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
} 