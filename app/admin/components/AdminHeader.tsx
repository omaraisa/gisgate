import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth-store";

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
    const { user } = useAuthStore();
    const displayName = user?.fullNameArabic || user?.fullNameEnglish || user?.username || user?.email || 'مسؤول النظام';
    const initial = displayName && displayName.length > 0 ? displayName[0] : 'A';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md"
        >
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-kufi">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-500 dark:text-gray-400">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-white">{displayName}</p>
                    <p className="text-xs text-blue-400">{user?.role || 'Admin'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {initial}
                </div>
            </div>
        </motion.div>
    );
}
