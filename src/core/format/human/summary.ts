export const MAX_LIST_ITEMS_DISPLAY = 10;
export const MAX_MAP_ENTRIES_DISPLAY = 10;

export const summarizeListLines = (
  items: string[],
  noun: string,
  maxItems = MAX_LIST_ITEMS_DISPLAY,
): string[] => {
  if (items.length <= maxItems) {
    return items;
  }

  return [
    `Count: ${items.length} ${noun} total`,
    ...items.slice(0, maxItems),
    `... and ${items.length - maxItems} more`,
  ];
};

export const summarizeMapLines = (
  entries: string[],
  maxItems = MAX_MAP_ENTRIES_DISPLAY,
): string[] => {
  if (entries.length <= maxItems) {
    return entries;
  }

  return [
    `Count: ${entries.length} entries total`,
    ...entries.slice(0, maxItems),
    `... and ${entries.length - maxItems} more`,
  ];
};
