import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  priority?: boolean;
}

const ImageReveal: React.FC<ImageRevealProps> = ({ src, alt, className = '', delay = 0, priority = false }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* The Image */}
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        initial={shouldReduceMotion ? { scale: 1 } : { scale: 1.1 }}
        animate={isInView || shouldReduceMotion ? { scale: 1 } : { scale: 1.1 }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1], delay: delay }}
        className="w-full h-full object-cover"
      />
      
      {/* The Reveal Mask (Slides UP) */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ y: 0 }}
          animate={isInView ? { y: "-100%" } : { y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: delay }}
          className="absolute inset-0 bg-struktur-dark origin-bottom z-10"
        />
      )}
    </div>
  );
};

export default ImageReveal;
