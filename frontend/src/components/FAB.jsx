import { motion } from 'framer-motion';

export default function FAB({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 bg-violet-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 0.95, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      whileHover={{ scale: 1.15, boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}
      aria-label="Add Task"
    >
      ＋
    </motion.button>
  );
} 