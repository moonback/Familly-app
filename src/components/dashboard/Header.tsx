import { motion } from 'framer-motion';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ManualButton } from '@/components/manual/manual-dialog';

interface HeaderProps {
  childName: string;
  onManualClick: () => void;
}

export const Header = ({ childName, onManualClick }: HeaderProps) => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="text-center mb-12"
    >
      <motion.p 
        className="text-2xl text-gray-700 font-semibold mb-4"
        animate={{ 
          y: [0, -8, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Bonjour {childName} ! 🦸‍♀️
      </motion.p>
      <div className="flex items-center justify-center gap-4">
        <motion.div 
          className="inline-flex items-center bg-white/80 backdrop-blur-md rounded-full px-8 py-3 shadow-xl border-2 border-purple-200"
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <CalendarIcon className="h-6 w-6 mr-3 text-purple-600 drop-shadow-xl" />
          <span className="text-xl font-medium text-gray-800">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
        </motion.div>
        <ManualButton onClick={onManualClick} />
      </div>
    </motion.div>
  );
}; 