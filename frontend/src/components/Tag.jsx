import { motion, AnimatePresence } from 'framer-motion';

export function TagList({ tags, removeTag }) {
  return (
    <AnimatePresence>
      {tags.map(tag => (
        <motion.span
          key={tag}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0, x: 40 }}
          transition={{ duration: 0.2 }}
          className="inline-block bg-violet-100 text-violet-700 px-2 py-1 rounded mr-2"
        >
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-1">×</button>
        </motion.span>
      ))}
    </AnimatePresence>
  );
} 