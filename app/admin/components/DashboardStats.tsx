'use client';

import React from 'react';
import { Users, FileText, BookOpen, Package, DollarSign, TrendingUp, Clock, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  stats: {
    counts: {
      users: number;
      articles: number;
      courses: number;
      solutions: number;
      enrollments: number;
      completedEnrollments: number;
    };
    revenue: number;
    recentActivity: {
      users: Array<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        createdAt: string;
        role: string;
      }>;
      purchases: Array<{
        id: string;
        amount: number;
        currency: string;
        purchasedAt: string;
        user: {
          email: string;
          firstName: string | null;
          lastName: string | null;
        };
        solution: {
          title: string;
        };
      }>;
      enrollments: Array<{
        id: string;
        enrolledAt: string;
        user: {
          email: string;
          firstName: string | null;
          lastName: string | null;
        };
        course: {
          title: string;
        };
      }>;
    };
  };
  loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-32 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.counts.users,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'المقالات',
      value: stats.counts.articles,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'الدورات',
      value: stats.counts.courses,
      icon: BookOpen,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'التسجيلات',
      value: stats.counts.enrollments,
      icon: GraduationCap,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'إكمال الدورات',
      value: stats.counts.completedEnrollments,
      icon: Package, // Using Package as a placeholder for completion/certificate
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              المستخدمين الجدد
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">لا يوجد مستخدمين جدد</div>
            ) : (
              stats.recentActivity.users.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              أحدث التسجيلات
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.enrollments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">لا توجد تسجيلات حديثة</div>
            ) : (
              stats.recentActivity.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{enrollment.course.title}</p>
                      <p className="text-xs text-gray-500">
                        {enrollment.user.firstName ? `${enrollment.user.firstName} ${enrollment.user.lastName || ''}` : enrollment.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              أحدث المبيعات
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentActivity.purchases.length === 0 ? (
              <div className="p-6 text-center text-gray-500">لا توجد مبيعات حديثة</div>
            ) : (
              stats.recentActivity.purchases.map((purchase) => (
                <div key={purchase.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{purchase.solution.title}</p>
                      <p className="text-xs text-gray-500">
                        {purchase.user.firstName ? `${purchase.user.firstName} ${purchase.user.lastName || ''}` : purchase.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      +{purchase.amount} {purchase.currency}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(purchase.purchasedAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
