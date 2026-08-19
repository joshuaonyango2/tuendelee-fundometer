import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface OptimisticOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
  isPending: boolean;
  error?: string;
  timestamp: number;
}

export function useOptimisticUpdates<T extends { id?: string }>() {
  const [items, setItems] = useState<T[]>([]);
  const [operations, setOperations] = useState<Map<string, OptimisticOperation<T>>>(new Map());
  const operationTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const generateOperationId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addOptimisticOperation = useCallback((
    type: OptimisticOperation<T>['type'],
    data: T,
    originalData?: T
  ) => {
    const operationId = generateOperationId();
    const operation: OptimisticOperation<T> = {
      id: operationId,
      type,
      data,
      originalData,
      isPending: true,
      timestamp: Date.now()
    };

    setOperations(prev => new Map(prev).set(operationId, operation));

    // Apply optimistic update immediately
    switch (type) {
      case 'create':
        setItems(prev => [data, ...prev]);
        break;
      case 'update':
        setItems(prev => prev.map(item => 
          item.id === data.id ? { ...item, ...data } : item
        ));
        break;
      case 'delete':
        setItems(prev => prev.filter(item => item.id !== data.id));
        break;
    }

    // Set timeout to handle hanging operations
    const timeout = setTimeout(() => {
      handleOperationTimeout(operationId);
    }, 10000); // 10 second timeout

    operationTimeoutRef.current.set(operationId, timeout);

    return operationId;
  }, []);

  const confirmOperation = useCallback((operationId: string, serverData?: T) => {
    const operation = operations.get(operationId);
    if (!operation) return;

    // Clear timeout
    const timeout = operationTimeoutRef.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      operationTimeoutRef.current.delete(operationId);
    }

    // Update with server data if provided
    if (serverData && operation.type !== 'delete') {
      setItems(prev => prev.map(item => 
        item.id === operation.data.id ? serverData : item
      ));
    }

    // Remove operation
    setOperations(prev => {
      const newOps = new Map(prev);
      newOps.delete(operationId);
      return newOps;
    });

    toast({
      title: "Success",
      description: `${operation.type} completed successfully`,
      variant: "default",
    });
  }, [operations]);

  const rejectOperation = useCallback((operationId: string, error: string) => {
    const operation = operations.get(operationId);
    if (!operation) return;

    // Clear timeout
    const timeout = operationTimeoutRef.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      operationTimeoutRef.current.delete(operationId);
    }

    // Revert optimistic update
    switch (operation.type) {
      case 'create':
        setItems(prev => prev.filter(item => item.id !== operation.data.id));
        break;
      case 'update':
        if (operation.originalData) {
          setItems(prev => prev.map(item => 
            item.id === operation.data.id ? operation.originalData! : item
          ));
        }
        break;
      case 'delete':
        if (operation.originalData) {
          setItems(prev => [operation.originalData!, ...prev]);
        }
        break;
    }

    // Mark operation as failed
    setOperations(prev => {
      const newOps = new Map(prev);
      newOps.set(operationId, { ...operation, isPending: false, error });
      return newOps;
    });

    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });

    // Remove failed operation after delay
    setTimeout(() => {
      setOperations(prev => {
        const newOps = new Map(prev);
        newOps.delete(operationId);
        return newOps;
      });
    }, 3000);
  }, [operations]);

  const handleOperationTimeout = useCallback((operationId: string) => {
    rejectOperation(operationId, "Operation timed out. Please try again.");
  }, [rejectOperation]);

  const setServerItems = useCallback((serverItems: T[] | ((prev: T[]) => T[])) => {
    if (typeof serverItems === 'function') {
      setItems(serverItems);
    } else {
      setItems(serverItems);
    }
  }, []);

  const getItemStatus = useCallback((itemId: string) => {
    for (const operation of operations.values()) {
      if (operation.data.id === itemId) {
        return {
          isPending: operation.isPending,
          error: operation.error,
          type: operation.type
        };
      }
    }
    return null;
  }, [operations]);

  return {
    items,
    operations: Array.from(operations.values()),
    addOptimisticOperation,
    confirmOperation,
    rejectOperation,
    setServerItems,
    getItemStatus
  };
}