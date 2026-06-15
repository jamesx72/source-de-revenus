import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWidgetProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  handle?: boolean;
  key?: React.Key;
}

export function SortableWidget({ id, children, className, handle }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={className} 
      {...(handle ? {} : attributes)} 
      {...(handle ? {} : listeners)}
    >
      {children}
    </div>
  );
}
