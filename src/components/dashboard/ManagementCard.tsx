import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ManagementCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  hoverColor: string;
  bgGradient: string;
  borderColor: string;
  buttonText: string;
  accent: string;
  onClick: () => void;
}

export const ManagementCard = ({
  id,
  title,
  description,
  icon: Icon,
  color,
  hoverColor,
  bgGradient,
  borderColor,
  buttonText,
  accent,
  onClick
}: ManagementCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className={`${bgGradient} border-2 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 group`}>
        <CardContent className="p-6 relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <motion.div 
              className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 mb-4">{description}</p>
              <button
                onClick={onClick}
                className={`bg-gradient-to-r ${color} hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-300 transform group-hover:scale-105`}
              >
                {buttonText}
              </button>
            </div>
          </div>
          <div className={`absolute inset-0 ${accent} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`} />
        </CardContent>
      </Card>
    </motion.div>
  );
}; 