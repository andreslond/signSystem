import { FileText, Loader2 } from 'lucide-react';

/**
 * DocumentViewerSkeleton Component
 * Full-page skeleton loader for document viewer pages
 * Provides a professional loading experience with animated elements
 */
export default function DocumentViewerSkeleton() {
    return (
        <div className="fixed inset-0 bg-background dark:bg-background z-50" data-testid="document-viewer-skeleton">
            {/* Header Skeleton */}
            <div className="bg-surface dark:bg-surface border-b border-border-light dark:border-border-light px-6 py-4">
                <div className="flex items-center gap-3 max-w-[440px] mx-auto">
                    <div className="w-5 h-5 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                    <div className="h-5 w-24 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                </div>
            </div>

            <div className="px-6 py-6 max-w-[440px] mx-auto flex flex-col gap-6">
                {/* Back Button & Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                        <div className="h-5 w-16 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                    </div>
                    <div className="w-10 h-10 bg-surface-alt dark:bg-surface-alt rounded-xl animate-pulse" />
                </div>

                {/* Main Card Skeleton */}
                <div className="bg-background dark:bg-surface rounded-[24px] shadow-card overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-6 border-b border-border-light dark:border-border-light">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-surface-alt dark:bg-surface-alt rounded-lg animate-pulse" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-surface-alt dark:bg-surface-alt rounded animate-pulse mb-2" />
                                <div className="h-6 w-48 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-5 w-40 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                    </div>

                    {/* PDF Preview Area */}
                    <div className="p-4">
                        <div className="bg-surface-alt dark:bg-surface-alt rounded-2xl aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-border dark:border-border-light gap-4">
                            {/* Animated Document Icon */}
                            <div className="relative">
                                <div className="w-16 h-20 bg-surface dark:bg-surface rounded-lg shadow-card flex items-center justify-center animate-pulse">
                                    <FileText size={32} strokeWidth={1} className="text-text-muted/30" data-testid="file-text-icon" />
                                </div>
                                {/* Loading indicator */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <Loader2 size={14} className="text-white animate-spin" data-testid="loader-icon" />
                                </div>
                            </div>
                            
                            {/* Loading Text */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-4 w-40 bg-surface dark:bg-surface rounded animate-pulse" />
                                <div className="h-3 w-28 bg-surface dark:bg-surface rounded animate-pulse" />
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-48 h-1 bg-surface dark:bg-surface rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-primary animate-pulse rounded-full" style={{
                                    animation: 'loading 1.5s ease-in-out infinite'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-6 bg-surface-alt dark:bg-surface-alt border-t border-border-light dark:border-border-light">
                        <div className="flex flex-col gap-4">
                            {/* Info Rows */}
                            <div className="flex justify-between">
                                <div className="h-4 w-24 bg-surface dark:bg-surface rounded animate-pulse" />
                                <div className="h-4 w-20 bg-surface dark:bg-surface rounded animate-pulse" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-surface dark:bg-surface rounded animate-pulse" />
                                <div className="h-5 w-28 bg-surface dark:bg-surface rounded animate-pulse" />
                            </div>
                            
                            {/* Action Button Skeleton */}
                            <div className="h-12 w-full bg-surface dark:bg-surface rounded-xl mt-4 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-background dark:bg-surface rounded-[24px] shadow-card p-6">
                    <div className="flex flex-col gap-3">
                        <div className="h-4 w-32 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                        <div className="h-3 w-full bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes loading {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(250%);
                    }
                }
            `}</style>
        </div>
    );
}

/**
 * CompactDocumentViewerSkeleton Component
 * A more compact skeleton for the viewer
 */
export function CompactDocumentViewerSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4" data-testid="compact-document-viewer-skeleton">
            <div className="relative">
                <div className="w-16 h-20 bg-surface-alt dark:bg-surface-alt rounded-lg shadow-card flex items-center justify-center">
                    <FileText size={32} strokeWidth={1} className="text-text-muted/30" data-testid="compact-file-text-icon" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Loader2 size={14} className="text-white animate-spin" data-testid="compact-loader-icon" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="h-4 w-40 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
                <div className="h-3 w-28 bg-surface-alt dark:bg-surface-alt rounded animate-pulse" />
            </div>
        </div>
    );
}
