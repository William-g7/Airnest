'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { useRef, useState, useEffect } from 'react';

interface AnimatedTextProps {
  tagline: string;
  description: string;
  resetOnScrollTop?: boolean;
  maxAnimations?: number;
}

const AnimatedText = ({
  tagline,
  description,
  resetOnScrollTop = true,
  maxAnimations = 2,
}: AnimatedTextProps) => {
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: false, amount: 0.3 });
  const [shouldPlayAnimation, setShouldPlayAnimation] = useState(true);
  const [animationCount, setAnimationCount] = useState(0);
  const [hasScrolledBeyondThreshold, setHasScrolledBeyondThreshold] = useState(false);

  // when the user scrolls beyond the threshold, set the hasScrolledBeyondThreshold to true
  useEffect(() => {
    if (!resetOnScrollTop) return;

    const handleScroll = () => {
      if (window.scrollY > window.innerHeight) {
        setHasScrolledBeyondThreshold(true);
      } else if (window.scrollY < 100 && hasScrolledBeyondThreshold) {
        setHasScrolledBeyondThreshold(false);
        setAnimationCount(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolledBeyondThreshold, resetOnScrollTop]);

  // When the element is in view and the animation is not playing, set the shouldPlayAnimation to true
  useEffect(() => {
    if (isInView && !shouldPlayAnimation && animationCount < maxAnimations) {
      // Add a small delay to ensure the animation is not triggered immediately
      const timer = setTimeout(() => {
        setShouldPlayAnimation(true);
        setAnimationCount(prev => prev + 1);
      }, 300);

      return () => clearTimeout(timer);
    } else if (!isInView && shouldPlayAnimation) {
      setShouldPlayAnimation(false);
    }
  }, [isInView, shouldPlayAnimation, animationCount, maxAnimations]);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      ref={headerRef}
      className="text-center mb-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      {/* Tagline section */}
      <div className="h-[3.75rem] mb-6 relative flex justify-center">
        <AnimatePresence mode="wait">
          {shouldPlayAnimation ? (
            <motion.div
              key="animated-tagline"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="absolute"
            >
              <TypeAnimation
                sequence={[tagline, () => {}]}
                wrapper="h1"
                speed={30}
                className="text-3xl font-bold inline-block"
                cursor={false}
                repeat={0}
              />
            </motion.div>
          ) : (
            <motion.h1
              key="static-tagline"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="text-3xl font-bold inline-block absolute"
            >
              {tagline}
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {/* Description section */}
      <div className="h-[3rem] relative flex justify-center">
        <AnimatePresence mode="wait">
          {shouldPlayAnimation ? (
            <motion.div
              key="animated-description"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="absolute"
            >
              <TypeAnimation
                sequence={[1500, description, () => {}]}
                wrapper="p"
                speed={32}
                className="text-gray-600"
                cursor={false}
                repeat={0}
              />
            </motion.div>
          ) : (
            <motion.p
              key="static-description"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="text-gray-600 absolute"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AnimatedText;
