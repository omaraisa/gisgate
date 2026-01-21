import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  delay?: number;
}

export default function StatsCard({ title, value, icon, trend, subtitle, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-emerald-900/30 backdrop-blur-md border border-emerald-500/30 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:bg-emerald-800/40 transition-all duration-300"
    >
      <div className="flex justify-between items-start z-10 relative">
        <div className="flex-1">
          <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
          <div className="text-3xl font-bold text-white mb-2">{value}</div>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'} mb-1`}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-500 ml-2 text-xs">مقارنة بالشهر الماضي</span>
            </div>
          )}
          {subtitle && (
            <div className="text-gray-400 text-xs mt-1">
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-emerald-800/40 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors duration-500" />
    </motion.div>
  );
}
