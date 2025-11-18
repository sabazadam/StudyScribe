/**
 * LoadingSkeleton Component
 * Provides animated skeleton placeholders for loading states
 */

interface LoadingSkeletonProps {
  variant?: 'text' | 'title' | 'circle' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export default function LoadingSkeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1
}: LoadingSkeletonProps) {
  const baseClasses = 'skeleton';

  const variantClasses = {
    text: 'h-4',
    title: 'h-8',
    circle: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;
  const style = {
    width: width || (variant === 'circle' ? height : '100%'),
    height: height || undefined
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={skeletonClass}
      style={style}
      aria-hidden="true"
    />
  ));

  return <>{skeletons}</>;
}

/**
 * Pre-built skeleton layouts for common use cases
 */
export function MaterialCardSkeleton() {
  return (
    <div className="card p-6 space-y-4" aria-busy="true" aria-label="Loading content">
      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="circle" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="title" width="60%" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="text" count={3} />
      <div className="flex gap-2">
        <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
        <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
      </div>
    </div>
  );
}

export function ListItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border-light" aria-hidden="true">
          <LoadingSkeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="70%" />
            <LoadingSkeleton variant="text" width="40%" />
          </div>
          <LoadingSkeleton variant="rectangular" width="60px" height="24px" />
        </div>
      ))}
    </>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page header">
      <LoadingSkeleton variant="title" width="50%" height="48px" />
      <LoadingSkeleton variant="text" width="80%" />
      <LoadingSkeleton variant="text" width="60%" />
      <div className="flex gap-4">
        <LoadingSkeleton variant="rectangular" width="120px" height="44px" />
        <LoadingSkeleton variant="rectangular" width="120px" height="44px" />
      </div>
    </div>
  );
}
