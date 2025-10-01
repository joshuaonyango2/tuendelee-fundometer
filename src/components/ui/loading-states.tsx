import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, isReconnecting, className }: ConnectionStatusProps) {
  if (isReconnecting) {
    return (
      <Badge variant="secondary" className={cn("animate-pulse", className)}>
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Reconnecting...
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"} 
      className={className}
    >
      {isConnected ? (
        <>
          <Wifi className="mr-1 h-3 w-3" />
          Live
        </>
      ) : (
        <>
          <WifiOff className="mr-1 h-3 w-3" />
          Offline
        </>
      )}
    </Badge>
  );
}

interface OptimisticStatusProps {
  isPending?: boolean;
  error?: string;
  type?: 'create' | 'update' | 'delete';
  className?: string;
}

export function OptimisticStatus({ isPending, error, type, className }: OptimisticStatusProps) {
  if (error) {
    return (
      <Badge variant="destructive" className={cn("text-xs", className)}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (isPending) {
    return (
      <Badge variant="secondary" className={cn("text-xs animate-pulse", className)}>
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        {type === 'create' && 'Creating...'}
        {type === 'update' && 'Updating...'}
        {type === 'delete' && 'Deleting...'}
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={cn("text-xs", className)}>
      <CheckCircle className="mr-1 h-3 w-3" />
      Synced
    </Badge>
  );
}

interface PledgeSkeletonProps {
  count?: number;
  className?: string;
}

export function PledgeSkeleton({ count = 3, className }: PledgeSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ThermometerSkeletonProps {
  className?: string;
}

export function ThermometerSkeleton({ className }: ThermometerSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  );
}

interface ErrorFallbackProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorFallback({ error, onRetry, className }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-sm underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface OfflineFallbackProps {
  message?: string;
  className?: string;
}

export function OfflineFallback({ 
  message = "You're currently offline. Some features may not work.", 
  className 
}: OfflineFallbackProps) {
  return (
    <Alert className={className}>
      <WifiOff className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}