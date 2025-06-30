import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import confettiJson from '../assets/confetti.json'; // Place a confetti Lottie JSON here

export default function TaskCompleteAnimation() {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.7, rotate: -30, opacity: 0 }}
        animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className="text-green-500 text-5xl"
      >
        ✔️
      </motion.div>
      <Lottie animationData={confettiJson} style={{ width: 120, height: 120 }} loop={false} />
    </div>
  );
} 