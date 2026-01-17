import Link from "next/link";

interface FilterBarProps {
    contentType: 'articles' | 'lessons' | 'courses';
    filter: 'all' | 'PUBLISHED' | 'DRAFT';
    setFilter: (filter: 'all' | 'PUBLISHED' | 'DRAFT') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export default function FilterBar({
    contentType,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm
}: FilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6 bg-white/40 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/20">
            {/* Search */}
            <div className="flex-1 max-w-md w-full relative">
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder={`بحث في ${contentType === 'articles' ? 'المقالات' : contentType === 'lessons' ? 'الدروس' : 'الكورسات'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
            </div>

            {/* Filter Toggles */}
            <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
                {(['all', 'PUBLISHED', 'DRAFT'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === status
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        {status === 'all' ? 'الكل' : status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                    </button>
                ))}
            </div>

            {/* Add New Button */}
            <Link
                href={contentType === 'articles' ? '/admin/articles/new' : contentType === 'lessons' ? '/admin/lessons/new' : '/admin/courses/new'}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
            >
                <i className="fas fa-plus" />
                <span>إضافة {contentType === 'articles' ? 'مقال' : contentType === 'lessons' ? 'درس' : 'كورس'}</span>
            </Link>
        </div>
    );
}
