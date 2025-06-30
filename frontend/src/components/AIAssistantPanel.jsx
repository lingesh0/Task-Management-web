import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import aiAvatar from '../assets/ai-avatar-blink.json'; // Place a Lottie JSON here

export function AIAssistantPanel({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 w-96 h-full bg-white dark:bg-gray-900 shadow-2xl z-50"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl">×</button>
          <div className="flex flex-col items-center mt-8 mb-4">
            <Lottie animationData={aiAvatar} loop style={{ width: 64, height: 64 }} />
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 