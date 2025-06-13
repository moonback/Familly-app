import { motion } from 'framer-motion';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Child {
  name: string;
}

interface HeaderProps {
  child: Child;
}

export function Header({ child }: HeaderProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="text-center mb-12"
    >
      <motion.div
        animate={{ rotateY: [0, 360], scale: [1, 1.2, 1], y: [0, -10, 0] }}
        transition={{
          rotateY: { duration: 4, repeat: Infinity },
          scale: { duration: 2, repeat: Infinity },
          y: { duration: 2, repeat: Infinity }
        }}
        className="text-7xl mb-6 filter drop-shadow-lg"
      >
        🏰
      </motion.div>
      <motion.h1
        className="text-5xl md:text-6xl font-black mb-4 bg-[linear-gradient(45deg,var(--child-color),#667eea,var(--child-color))] bg-clip-text text-transparent [background-size:300%_300%] [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.1))]"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
      >
        Mon Royaume Magique
      </motion.h1>
      <motion.p
        className="text-2xl text-gray-700 font-semibold mb-4"
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Bonjour Super Héros {child.name} ! 🦸‍♀️
      </motion.p>
      <motion.div
        className="inline-flex items-center bg-white/80 backdrop-blur-md rounded-full px-8 py-3 shadow-xl border-2 border-[var(--child-color)]"
        whileHover={{
          scale: 1.05,
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <CalendarIcon className="h-6 w-6 mr-3 text-[color:var(--child-color)] drop-shadow-xl" />
        <span className="text-xl font-medium text-gray-800">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </span>
      </motion.div>
    </motion.div>
  );
}
