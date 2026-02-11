import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Displays pagination controls with Previous/Next buttons and page indicator
 * 
 * @param {Object} props - Component props
 * @param {number} props.page - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.total - Total number of items
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {boolean} props.loading - Whether data is currently loading
 */
export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  loading = false,
  className = '',
}) {
  // Don't render if there's only one page or no data
  if (totalPages <= 1 && total <= 10) {
    return null;
  }

  const handlePrev = () => {
    if (page > 1 && !loading) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages && !loading) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNum) => {
    if (pageNum !== page && !loading) {
      onPageChange(pageNum);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum visible page numbers
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible range
      let start = Math.max(2, page - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);
      
      // Adjust start if end is at max
      if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisible + 1);
      }
      
      // Add ellipsis if there's a gap at the start
      if (start > 2) {
        pages.push('...');
      }
      
      // Add visible range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if there's a gap at the end
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div 
      className={`flex items-center justify-center gap-2 py-4 ${className}`}
      role="navigation"
      aria-label="Paginación"
    >
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={page <= 1 || loading}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          transition-all duration-200
          ${page <= 1 || loading
            ? 'bg-surface-alt dark:bg-surface text-text-muted/40 cursor-not-allowed'
            : 'bg-surface dark:bg-surface-alt text-text-secondary hover:text-text-primary hover:bg-border/50 dark:hover:bg-border-light'
          }
        `}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((pageNum, idx) => (
          <span key={idx}>
            {pageNum === '...' ? (
              <span className="px-2 py-1 text-text-muted">...</span>
            ) : (
              <button
                onClick={() => handlePageClick(pageNum)}
                disabled={loading}
                className={`
                  min-w-[36px] h-[36px] px-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${page === pageNum
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-transparent text-text-secondary hover:bg-border/50 dark:hover:bg-border-light'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={`Ir a página ${pageNum}`}
                aria-current={page === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={page >= totalPages || loading}
        className={`
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          transition-all duration-200
          ${page >= totalPages || loading
            ? 'bg-surface-alt dark:bg-surface text-text-muted/40 cursor-not-allowed'
            : 'bg-surface dark:bg-surface-alt text-text-secondary hover:text-text-primary hover:bg-border/50 dark:hover:bg-border-light'
          }
        `}
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight size={16} />
      </button>

      {/* Page Info */}
      <span 
        className="ml-2 text-xs text-text-muted hidden sm:inline"
        aria-live="polite"
      >
        de {totalPages} páginas ({total} elementos)
      </span>
    </div>
  );
}

/**
 * Simple Pagination - Minimal version with just Previous/Next
 */
export function SimplePagination({
  page,
  totalPages,
  onPageChange,
  loading = false,
  className = '',
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div 
      className={`flex items-center justify-center gap-4 py-4 ${className}`}
      role="navigation"
      aria-label="Paginación"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
          transition-all duration-200
          ${page <= 1 || loading
            ? 'bg-surface-alt dark:bg-surface text-text-muted/40 cursor-not-allowed'
            : 'bg-surface dark:bg-surface-alt text-text-secondary hover:text-text-primary shadow-card hover:shadow-card-hover'
          }
        `}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
        Anterior
      </button>

      <span 
        className="text-sm font-medium text-text-secondary"
        aria-live="polite"
      >
        Página <span className="font-bold text-text-primary">{page}</span> de <span className="font-bold text-text-primary">{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
          transition-all duration-200
          ${page >= totalPages || loading
            ? 'bg-surface-alt dark:bg-surface text-text-muted/40 cursor-not-allowed'
            : 'bg-primary text-white shadow-md hover:bg-primary/90'
          }
        `}
        aria-label="Página siguiente"
      >
        Siguiente
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
