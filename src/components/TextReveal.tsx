import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

const TextReveal: React.FC<TextRevealProps> = ({ text, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const shouldReduceMotion = useReducedMotion();

  // Split text by new lines or just use standard single line
  const lines = text.split('\n');

  return (
    <div ref={ref} className={className}>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="overflow-hidden inline-block w-full">
          <motion.div
            initial={shouldReduceMotion ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
            animate={isInView || shouldReduceMotion ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: delay + (lineIndex * 0.1) }}
          >
            {line === "" ? "\u00A0" : line}
          </motion.div>
        </div>
      ))}
    </div>
  );
};

export default TextReveal;
