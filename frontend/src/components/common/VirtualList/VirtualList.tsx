import React from 'react';
// @ts-ignore - react-window types may not be fully compatible
import { FixedSizeList as List } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width: string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  width,
  renderItem,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );

  return (
    <List height={height} itemCount={items.length} itemSize={itemHeight} width={width}>
      {Row}
    </List>
  );
}
