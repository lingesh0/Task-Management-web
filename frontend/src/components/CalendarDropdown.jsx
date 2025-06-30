import { motion, AnimatePresence } from 'framer-motion';

export function CalendarDropdown({ open, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute bg-white dark:bg-gray-800 shadow-lg rounded p-2 z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 