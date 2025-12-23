'use client';

import { ArticleStatus } from '@prisma/client';
import { motion } from 'framer-motion';
import { ExternalLink, Check, X } from 'lucide-react';

interface Solution {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  createdAt: string;
  sourceCodeUrl?: string;
  demoUrl?: string;
  author: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  course: {
    title: string;
  } | null;
}

interface SolutionsTableProps {
  solutions: Solution[];
  onStatusChange: (id: string, status: ArticleStatus) => void;
}

export default function SolutionsTable({ solutions, onStatusChange }: SolutionsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-right font-medium text-gray-900">العنوان</th>
              <th className="p-4 text-right font-medium text-gray-900">المستخدم</th>
              <th className="p-4 text-right font-medium text-gray-900">الدورة</th>
              <th className="p-4 text-right font-medium text-gray-900">الحالة</th>
              <th className="p-4 text-right font-medium text-gray-900">الروابط</th>
              <th className="p-4 text-right font-medium text-gray-900">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((solution, index) => (
              <motion.tr
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-4">
                  <div className="font-medium text-gray-900">{solution.title}</div>
                  <div className="text-sm text-gray-500">{new Date(solution.createdAt).toLocaleDateString('ar-SA')}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {solution.author.firstName ? `${solution.author.firstName} ${solution.author.lastName || ''}` : solution.author.email}
                    </div>
                    <div className="text-gray-500">{solution.author.email}</div>
                  </div>
                </td>
                <td className="p-4 text-gray-600">
                  {solution.course?.title || '-'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    solution.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    solution.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                    solution.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {solution.status === 'PUBLISHED' ? 'منشور' :
                     solution.status === 'PENDING_REVIEW' ? 'قيد المراجعة' :
                     solution.status === 'REJECTED' ? 'مرفوض' : 'مسودة'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {solution.sourceCodeUrl && (
                      <a href={solution.sourceCodeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Source Code">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {solution.demoUrl && (
                      <a href={solution.demoUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800" title="Live Demo">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {solution.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => onStatusChange(solution.id, 'PUBLISHED')}
                          className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onStatusChange(solution.id, 'REJECTED')}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {solution.status !== 'PENDING_REVIEW' && (
                      <select
                        value={solution.status}
                        onChange={(e) => onStatusChange(solution.id, e.target.value as ArticleStatus)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="PUBLISHED">نشر</option>
                        <option value="DRAFT">مسودة</option>
                        <option value="REJECTED">رفض</option>
                      </select>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
