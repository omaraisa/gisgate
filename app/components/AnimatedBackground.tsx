import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary-700 to-background" />
      <motion.div
        animate={{
          y: ['-10%', '10%', '-10%'],
          x: ['-5%', '5%', '-5%'],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl opacity-50"
      />
      <motion.div
        animate={{
          y: ['20%', '-20%', '20%'],
          x: ['10%', '-10%', '10%'],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl opacity-50"
      />
    </motion.div>
  );
}