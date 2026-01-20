import { motion, AnimatePresence } from 'framer-motion'
import { ArticleStatus } from '@prisma/client'

interface BulkActionPanelProps {
  selectedCount: number
  onDelete: () => void
  onStatusChange?: (status: ArticleStatus) => void
  onClearSelection: () => void
}

export default function BulkActionPanel({
  selectedCount,
  onDelete,
  onStatusChange,
  onClearSelection
}: BulkActionPanelProps) {
  if (selectedCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[300px] max-w-[90vw]"
      >
        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
            {selectedCount}
          </span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">عناصر محددة</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
          >
            <i className="fas fa-trash-alt" />
            <span>حذف</span>
          </button>

          {/* Example of adding more actions in the future */}
          {onStatusChange && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStatusChange('PUBLISHED')}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:hover:bg-green-900/20 rounded-xl transition-colors font-medium text-sm"
              >
                <i className="fas fa-check-circle" />
                <span>نشر</span>
              </button>
              <button
                onClick={() => onStatusChange('DRAFT')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-900/10 dark:text-gray-400 dark:hover:bg-gray-900/20 rounded-xl transition-colors font-medium text-sm"
              >
                <i className="fas fa-edit" />
                <span>مسودة</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClearSelection}
          className="mr-auto p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          title="إلغاء التحديد"
        >
          <i className="fas fa-times" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
