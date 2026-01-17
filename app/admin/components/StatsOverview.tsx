import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import StatsCard from './StatsCard';
import { motion } from 'framer-motion';

const data = [
    { name: 'يناير', students: 400, revenue: 2400 },
    { name: 'فبراير', students: 300, revenue: 1398 },
    { name: 'مارس', students: 200, revenue: 9800 },
    { name: 'أبريل', students: 278, revenue: 3908 },
    { name: 'مايو', students: 189, revenue: 4800 },
    { name: 'يونيو', students: 239, revenue: 3800 },
    { name: 'يوليو', students: 349, revenue: 4300 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface StatsOverviewProps {
    stats: {
        articlesCount: number;
        lessonsCount: number;
        coursesCount: number;
        publishedCount: number;
        draftCount: number;
    };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="إجمالي المقالات"
                    value={stats.articlesCount}
                    delay={0.1}
                    trend={{ value: 12, isPositive: true }}
                    icon={<i className="fas fa-newspaper text-xl" />}
                />
                <StatsCard
                    title="إجمالي الدروس"
                    value={stats.lessonsCount}
                    delay={0.2}
                    trend={{ value: 5, isPositive: true }}
                    icon={<i className="fas fa-book-open text-xl" />}
                />
                <StatsCard
                    title="إجمالي الكورسات"
                    value={stats.coursesCount}
                    delay={0.3}
                    icon={<i className="fas fa-graduation-cap text-xl" />}
                />
                <StatsCard
                    title="محتوى منشور"
                    value={stats.publishedCount}
                    delay={0.4}
                    trend={{ value: 2, isPositive: false }}
                    icon={<i className="fas fa-check-circle text-xl" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue/Students Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
                >
                    <h3 className="text-white text-lg font-medium mb-6">نمو الطلاب والإيرادات</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#f3f4f6' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                                <Area type="monotone" dataKey="students" stroke="#8884d8" fillOpacity={1} fill="url(#colorStudents)" />
                                <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Content Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
                >
                    <h3 className="text-white text-lg font-medium mb-6">توزيع المحتوى</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'مقالات', value: stats.articlesCount },
                                { name: 'دروس', value: stats.lessonsCount },
                                { name: 'كورسات', value: stats.coursesCount },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="value" fill="#8884d8">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % 20]} />
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
