/** @flow */

import React from 'react';
import type {CellRangeRendererParams} from '../Grid/types';
import cellRangeRenderer from './cellRangeRenderer';

function rowRenderer({
  canCacheStyle,
  cellCache,
  cellRangeRenderer,
  cellRenderer,
  className,
  columnSizeAndPositionManager,
  columnStartIndex,
  columnStopIndex,
  deferredMeasurementCache,
  horizontalOffsetAdjustment,
  isRowVisible,
  isScrolling,
  isScrollingOptOut,
  key,
  role,
  rowIndex,
  rowSizeAndPositionManager,
  style,
  styleCache,
  verticalOffsetAdjustment,
  visibleColumnIndices,
}) {
  return React.createElement(
    'div',
    {className, key, role, style},
    cellRangeRenderer({
      canCacheStyle,
      cellCache,
      cellRenderer,
      columnSizeAndPositionManager,
      columnStartIndex,
      columnStopIndex,
      deferredMeasurementCache,
      horizontalOffsetAdjustment,
      isRowVisible,
      isScrolling,
      isScrollingOptOut,
      rowIndex,
      rowSizeAndPositionManager,
      styleCache,
      verticalOffsetAdjustment,
      visibleColumnIndices,
    }),
  );
}

export default function rowRangeRenderer({
  cellCache,
  cellRenderer,
  columnSizeAndPositionManager,
  columnStartIndex,
  columnStopIndex,
  deferredMeasurementCache,
  horizontalOffsetAdjustment,
  isScrolling,
  isScrollingOptOut,
  parent, // Grid (or List or Table)
  rowSizeAndPositionManager,
  rowStartIndex,
  rowStopIndex,
  styleCache,
  verticalOffsetAdjustment,
  visibleColumnIndices,
  visibleRowIndices,
}: CellRangeRendererParams) {
  const renderedRows = [];

  // Browsers have native size limits for elements (eg Chrome 33M pixels, IE 1.5M pixes).
  // User cannot scroll beyond these size limitations.
  // In order to work around this, ScalingCellSizeAndPositionManager compresses offsets.
  // We should never cache styles for compressed offsets though as this can lead to bugs.
  // See issue #576 for more.
  const areOffsetsAdjusted =
    columnSizeAndPositionManager.areOffsetsAdjusted() ||
    rowSizeAndPositionManager.areOffsetsAdjusted();

  const canCacheStyle = !isScrolling && !areOffsetsAdjusted;

  for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
    const rowKey = `row-${rowIndex}`;
    let rowRendererParams = {};
    let rowStyle;

    let rowDatum = rowSizeAndPositionManager.getSizeAndPositionOfCell(rowIndex);
    let isRowVisible =
      rowIndex >= visibleRowIndices.start && rowIndex <= visibleRowIndices.stop;

    if (canCacheStyle && styleCache[rowKey]) {
      rowStyle = styleCache[rowKey];
    } else {
      rowStyle = {
        height: rowDatum.size,
        left: horizontalOffsetAdjustment,
        position: 'absolute',
        top: rowDatum.offset + verticalOffsetAdjustment,
      };
    }

    rowRendererParams = {
      canCacheStyle,
      cellCache,
      cellRangeRenderer,
      cellRenderer,
      className: 'Grid__row',
      columnSizeAndPositionManager,
      columnStartIndex,
      columnStopIndex,
      deferredMeasurementCache,
      horizontalOffsetAdjustment,
      isRowVisible,
      isScrolling,
      isScrollingOptOut,
      key: rowKey,
      role: 'row',
      rowIndex,
      rowSizeAndPositionManager,
      style: rowStyle,
      styleCache,
      verticalOffsetAdjustment,
      visibleColumnIndices,
    };

    let renderedRow;

    // Avoid re-creating rows while scrolling.
    // This can lead to the same row being created many times and can cause performance issues for "heavy" rows.
    // If a scroll is in progress- cache and reuse rows.
    // This cache will be thrown away once scrolling completes.
    // However if we are scaling scroll positions and sizes, we should also avoid caching.
    // This is because the offset changes slightly as scroll position changes and caching leads to stale values.
    // For more info refer to issue #395
    //
    // If isScrollingOptOut is specified, we always cache rows.
    // For more info refer to issue #1028
    if (
      (isScrollingOptOut || isScrolling) &&
      !horizontalOffsetAdjustment &&
      !verticalOffsetAdjustment
    ) {
      if (!cellCache[rowKey]) {
        cellCache[rowKey] = rowRenderer(rowRendererParams);
      }

      renderedRow = cellCache[rowKey];

      // If the user is no longer scrolling, don't cache cells.
      // This makes dynamic cell content difficult for users and would also lead to a heavier memory footprint.
    } else {
      renderedRow = rowRenderer(rowRendererParams);
    }

    if (renderedRow == null || renderedRow === false) {
      continue;
    }

    renderedRow = rowRenderer(rowRendererParams);
    renderedRows.push(renderedRow);
  }

  return renderedRows;
}
