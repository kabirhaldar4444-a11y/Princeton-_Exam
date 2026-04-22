import React from 'react';
import { motion } from 'framer-motion';
import pmisLogo from '../../assets/images/pmis-logo.png';

const PMISLogo = ({ variant = 'default', className = '' }) => {
  // Sizing definitions based on variant for premium, context-aware scaling
  const configs = {
    login: {
      wrapper: "flex flex-col items-center mb-0",
      img: "w-full max-w-[220px] sm:max-w-[280px] md:max-w-[320px] xl:max-w-[360px]"
    },

    navbar: {
      wrapper: "flex items-center",
      img: "h-8 sm:h-9 md:h-10 xl:h-11 w-auto"
    },
    default: {
      wrapper: "flex items-center",
      img: "w-48 h-auto"
    }
  };

  const config = configs[variant] || configs.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for premium feel
        delay: 0.2 
      }}
      className={`${config.wrapper} ${className}`}
    >
      <img
        src={pmisLogo}
        alt="Princeton Professionals"
        className={`${config.img} object-contain select-none pointer-events-none drop-shadow-sm`}
        draggable={false}
      />
    </motion.div>
  );
};

export default PMISLogo;

