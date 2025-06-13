import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
  details?: {
    label: string;
    value: number;
  }[];
  trend?: number;
  subtitle?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  isLoading, 
  details, 
  trend, 
  subtitle 
}: StatCardProps) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  >
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 border-0 rounded-2xl overflow-hidden group relative">
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
      
      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_0)] bg-[size:20px_20px]" />
      </div>
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-600 tracking-wide">{title}</p>
              {trend !== undefined && (
                <motion.div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                    trend > 0 ? 'bg-green-100/80 text-green-700' : 
                    trend < 0 ? 'bg-red-100/80 text-red-700' : 
                    'bg-gray-100/80 text-gray-700'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend)}%
                </motion.div>
              )}
            </div>
            
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div>
                <motion.h3 
                  className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {value.toLocaleString()}
                </motion.h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg relative overflow-hidden`}
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {icon}
          </motion.div>
        </div>
        
        {details && (
          <div className="mt-4 pt-4 border-t border-gray-100/50">
            <div className="flex justify-between text-xs">
              {details.map((detail, index) => (
                <div key={index} className="text-center">
                  <div className="font-semibold text-gray-800">{detail.value}</div>
                  <div className="text-gray-500 font-medium">{detail.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
); 