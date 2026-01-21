import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend } from 'recharts';
import StatsCard from './StatsCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'];

interface UserStats {
    users: {
        total: number;
        active: number;
        newLast30Days: number;
        activeLast7Days: number;
    };
    enrollments: {
        total: number;
        active: number;
        completed: number;
        completionRate: number;
        enrollmentsLast30Days: number;
        avgProgress: number;
    };
    certificates: {
        total: number;
        issuedLast30Days: number;
    };
    downloads: {
        total: number;
        last30Days: number;
    };
    revenue: {
        total: number;
        last30Days: number;
    };
    lessons: {
        totalProgress: number;
        completed: number;
    };
    popularCourses: Array<{
        id: string;
        title: string;
        enrollments: number;
    }>;
    charts: {
        userActivity: Array<{ date: Date; count: number }>;
        enrollmentActivity: Array<{ date: Date; count: number }>;
        completionActivity: Array<{ date: Date; count: number }>;
    };
}

interface StatsOverviewProps {
    userStats: UserStats | null;
    loading: boolean;
}

export default function StatsOverview({ userStats, loading }: StatsOverviewProps) {
    if (loading || !userStats) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl animate-pulse">
                            <div className="h-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Calculate trends
    const userGrowthRate = userStats.users.total > 0 
        ? Math.round((userStats.users.newLast30Days / userStats.users.total) * 100) 
        : 0;
    
    const enrollmentGrowthRate = userStats.enrollments.total > 0 
        ? Math.round((userStats.enrollments.enrollmentsLast30Days / userStats.enrollments.total) * 100) 
        : 0;

    const certificateGrowthRate = userStats.certificates.total > 0 
        ? Math.round((userStats.certificates.issuedLast30Days / userStats.certificates.total) * 100) 
        : 0;

    const downloadGrowthRate = userStats.downloads.total > 0 
        ? Math.round((userStats.downloads.last30Days / userStats.downloads.total) * 100) 
        : 0;

    // Prepare chart data
    const activityData = userStats.charts.enrollmentActivity.map((enrollment) => {
        const userReg = userStats.charts.userActivity.find(u => 
            format(new Date(u.date), 'yyyy-MM-dd') === format(new Date(enrollment.date), 'yyyy-MM-dd')
        );
        const completion = userStats.charts.completionActivity.find(c => 
            format(new Date(c.date), 'yyyy-MM-dd') === format(new Date(enrollment.date), 'yyyy-MM-dd')
        );
        
        return {
            date: format(new Date(enrollment.date), 'dd MMM', { locale: ar }),
            registrations: userReg?.count || 0,
            enrollments: enrollment.count,
            completions: completion?.count || 0,
        };
    });

    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="إجمالي المستخدمين"
                    value={userStats.users.total}
                    delay={0.1}
                    trend={{ value: userGrowthRate, isPositive: userGrowthRate > 0 }}
                    subtitle={`نشط: ${userStats.users.active}`}
                    icon={<i className="fas fa-users text-xl" />}
                />
                <StatsCard
                    title="الالتحاقات النشطة"
                    value={userStats.enrollments.active}
                    delay={0.2}
                    trend={{ value: enrollmentGrowthRate, isPositive: enrollmentGrowthRate > 0 }}
                    subtitle={`معدل الإنجاز: ${userStats.enrollments.completionRate}%`}
                    icon={<i className="fas fa-user-graduate text-xl" />}
                />
                <StatsCard
                    title="الشهادات الصادرة"
                    value={userStats.certificates.total}
                    delay={0.3}
                    trend={{ value: certificateGrowthRate, isPositive: certificateGrowthRate > 0 }}
                    subtitle={`آخر 30 يوم: ${userStats.certificates.issuedLast30Days}`}
                    icon={<i className="fas fa-certificate text-xl" />}
                />
                <StatsCard
                    title="التحميلات"
                    value={userStats.downloads.total}
                    delay={0.4}
                    trend={{ value: downloadGrowthRate, isPositive: downloadGrowthRate > 0 }}
                    subtitle={`آخر 30 يوم: ${userStats.downloads.last30Days}`}
                    icon={<i className="fas fa-download text-xl" />}
                />
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatsCard
                    title="مستخدمون جدد (30 يوم)"
                    value={userStats.users.newLast30Days}
                    delay={0.5}
                    icon={<i className="fas fa-user-plus text-xl" />}
                />
                <StatsCard
                    title="الإكمالات"
                    value={userStats.enrollments.completed}
                    delay={0.6}
                    subtitle={`متوسط التقدم: ${userStats.enrollments.avgProgress}%`}
                    icon={<i className="fas fa-check-circle text-xl" />}
                />
                <StatsCard
                    title="نشاط الأسبوع الماضي"
                    value={userStats.users.activeLast7Days}
                    delay={0.7}
                    subtitle="مستخدم نشط"
                    icon={<i className="fas fa-chart-line text-xl" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Activity Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
                >
                    <h3 className="text-white text-lg font-medium mb-6">نشاط المستخدمين (30 يوم)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                                <Legend 
                                    wrapperStyle={{ color: '#f3f4f6' }}
                                    formatter={(value) => {
                                        const labels: Record<string, string> = {
                                            registrations: 'تسجيلات جديدة',
                                            enrollments: 'التحاقات',
                                            completions: 'إكمالات'
                                        };
                                        return labels[value] || value;
                                    }}
                                />
                                <Line type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="enrollments" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="completions" stroke="#6ee7b7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Popular Courses */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
                >
                    <h3 className="text-white text-lg font-medium mb-6">الكورسات الأكثر شعبية</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={userStats.popularCourses.slice(0, 5)}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                <YAxis 
                                    type="category" 
                                    dataKey="title" 
                                    stroke="#6b7280" 
                                    fontSize={10}
                                    width={120}
                                    tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    formatter={(value) => [`${value} التحاقات`, '']}
                                />
                                <Bar dataKey="enrollments" fill="#10b981" radius={[0, 8, 8, 0]}>
                                    {userStats.popularCourses.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
