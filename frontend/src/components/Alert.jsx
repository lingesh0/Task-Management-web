import { motion, AnimatePresence } from 'framer-motion';

export default function Alert({ type, message, show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {message}
          <motion.button
            onClick={onClose}
            className="ml-4 text-lg font-bold"
            whileTap={{ scale: 0.8 }}
          >×</motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 