import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { theme } from '../theme';

export interface ScheduleSection<T> {
  group: string;
  items: T[];
}

interface ScheduleListProps<T> {
  data: ScheduleSection<T>[];
  renderItem: (item: T) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: React.ReactElement;
  contentContainerStyle?: any;
}

export function ScheduleList<T>({
  data,
  renderItem,
  keyExtractor,
  emptyComponent,
  contentContainerStyle
}: ScheduleListProps<T>) {

  // Build flattened list with header indices for FlashList sticky headers
  const { flattenedItems, headerIndices } = useMemo(() => {
    const items: Array<{
      type: 'header';
      title: string;
    } | {
      type: 'item';
      data: T;
      originalIndex: number;
      sectionIndex: number;
    }> = [];
    const headerIdx: number[] = [];
    let i = 0;
    let itemIndex = 0;

    data.forEach((section, sectionIndex) => {
      items.push({ type: 'header', title: section.group });
      headerIdx.push(i++);

      section.items.forEach((item) => {
        items.push({
          type: 'item',
          data: item,
          originalIndex: itemIndex++,
          sectionIndex
        });
        i++;
      });
    });

    return { flattenedItems: items, headerIndices: headerIdx };
  }, [data]);

  const renderFlashListItem = useCallback(({ item }: {
    item: {
      type: 'header';
      title: string;
    } | {
      type: 'item';
      data: T;
      originalIndex: number;
      sectionIndex: number;
    }
  }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.stickyDateHeader}>
          <Text style={styles.dateHeaderText}>
            {item.title}
          </Text>
        </View>
      );
    }

    return renderItem(item.data);
  }, [renderItem]);

  const getKeyExtractor = useCallback((item: any, index: number) => {
    if (item.type === 'header') return `header-${item.title}`;
    if (keyExtractor) {
      return `item-${keyExtractor(item.data, item.originalIndex)}`;
    }
    return `item-${item.sectionIndex}-${item.originalIndex}`;
  }, [keyExtractor]);

  // Show empty component if no data or all sections are empty
  const hasItems = data.some(section => section.items.length > 0);

  if (!hasItems && emptyComponent) {
    return emptyComponent;
  }

  return (
    <FlashList
      data={flattenedItems}
      renderItem={renderFlashListItem}
      keyExtractor={getKeyExtractor}
      getItemType={(item) => item.type}
      stickyHeaderIndices={headerIndices}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
    />
  );
}

const styles = StyleSheet.create({
  stickyDateHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 6, // Gap between header and items
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.zinc[500],
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});