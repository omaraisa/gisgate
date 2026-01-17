import { motion } from "framer-motion";
import Link from "next/link";
import { ArticleStatus, Article, CourseLevel } from "@prisma/client";

// Define interfaces locally to match the ones in page.tsx (or export them from a types file later)
interface ArticleWithStats extends Article {
    imageCount?: number;
}

interface LessonWithStats {
    id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    publishedAt?: Date | null;
    updatedAt: Date;
    imageCount?: number;
    authorName?: string;
}

interface CourseWithStats {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    status: ArticleStatus;
    publishedAt?: Date | null;
    updatedAt: Date;
    price?: number | null;
    currency?: string | null;
    isFree: boolean;
    level: CourseLevel;
    language?: string | null;
    lessonCount?: number;
    enrollmentCount?: number;
}

type ContentItem = ArticleWithStats | LessonWithStats | CourseWithStats;

interface ContentTableProps {
    items: ContentItem[];
    contentType: 'articles' | 'lessons' | 'courses';
    selectedItems: Set<string>;
    toggleSelectAll: () => void;
    toggleSelectItem: (id: string, checked: boolean) => void;
    handleStatusChange: (id: string, status: ArticleStatus) => void;
    handleDelete: (id: string) => void;
}

export default function ContentTable({
    items,
    contentType,
    selectedItems,
    toggleSelectAll,
    toggleSelectItem,
    handleStatusChange,
    handleDelete
}: ContentTableProps) {
    if (items.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="mb-4 text-6xl text-gray-200 dark:text-gray-700">
                    <i className="fas fa-inbox" />
                </div>
                <p className="text-lg">لا توجد {contentType === 'articles' ? 'مقالات' : contentType === 'lessons' ? 'دروس' : 'كورسات'} مطابقة للبحث</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                        <tr>
                            <th className="p-4 text-right w-12">
                                <input
                                    type="checkbox"
                                    checked={items.length > 0 && selectedItems.size === items.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">العنوان</th>
                            {contentType === 'courses' && (
                                <>
                                    <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">الفئة</th>
                                    <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">السعر</th>
                                </>
                            )}
                            <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">تاريخ النشر</th>
                            <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">الحالة</th>
                            {contentType === 'articles' && <th className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">الصور</th>}
                            {contentType === 'courses' && (
                                <>
                                    <th className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">الدروس</th>
                                    <th className="p-4 text-center font-medium text-gray-700 dark:text-gray-300">المسجلين</th>
                                </>
                            )}
                            <th className="p-4 text-right font-medium text-gray-700 dark:text-gray-300">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(item.id)}
                                        onChange={(e) => toggleSelectItem(item.id, e.target.checked)}
                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="p-4">
                                    <div>
                                        <Link
                                            href={`/admin/${contentType}/${item.id}/edit`}
                                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                                        >
                                            {item.title}
                                        </Link>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <Link
                                                href={`/${contentType}/${item.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                                            >
                                                <i className="fas fa-external-link-alt" />
                                                عرض {contentType === 'articles' ? 'المقال' : contentType === 'lessons' ? 'الدرس' : 'الكورس'}
                                            </Link>
                                        </div>
                                    </div>
                                </td>
                                {contentType === 'courses' && (
                                    <>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                                {(item as CourseWithStats).level === 'BEGINNER' ? 'مبتدئ' :
                                                    (item as CourseWithStats).level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            {(item as CourseWithStats).isFree ? (
                                                <span className="text-green-600 dark:text-green-400 font-medium">مجاني</span>
                                            ) : (
                                                `${(item as CourseWithStats).price} ${(item as CourseWithStats).currency || 'USD'}`
                                            )}
                                        </td>
                                    </>
                                )}
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ar-EG') : '-'}
                                </td>
                                <td className="p-4">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value as ArticleStatus)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 ring-1 ring-inset focus:ring-2 focus:ring-blue-500 outline-none ${item.status === ArticleStatus.PUBLISHED
                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                            : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                            }`}
                                    >
                                        <option value={ArticleStatus.PUBLISHED}>منشور</option>
                                        <option value={ArticleStatus.DRAFT}>مسودة</option>
                                    </select>
                                </td>
                                {contentType === 'articles' && (
                                    <td className="p-4 text-gray-600 dark:text-gray-400 text-center font-mono text-sm">
                                        {(item as ArticleWithStats).imageCount || 0}
                                    </td>
                                )}
                                {contentType === 'courses' && (
                                    <>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-center font-mono text-sm">
                                            {(item as CourseWithStats).lessonCount || 0}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-center font-mono text-sm">
                                            {(item as CourseWithStats).enrollmentCount || 0}
                                        </td>
                                    </>
                                )}
                                <td className="p-4">
                                    <div className="flex gap-3 justify-end">
                                        <Link
                                            href={`/admin/${contentType}/${item.id}/edit`}
                                            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="تحرير"
                                        >
                                            <i className="fas fa-edit" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title="حذف"
                                        >
                                            <i className="fas fa-trash-alt" />
                                        </button>
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
