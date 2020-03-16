/** @flow */

import React from 'react';
import type {CellRangeRendererParams} from '../Grid/types';

/**
 * Default implementation of cellRangeRenderer used by Grid.
 * This renderer supports cell-caching while the user is scrolling.
 */

export default function tableCellRangeRenderer({
  cellCache,
  cellRenderer,
  columnSizeAndPositionManager,
  columnStartIndex,
  columnStopIndex,
  deferredMeasurementCache,
  direction,
  horizontalOffsetAdjustment,
  isScrolling,
  isScrollingOptOut,
  parent, // Grid (or List or Table)
  rowSizeAndPositionManager,
  rowStartIndex,
  rowStopIndex,
  rowRenderer,
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
  const isRtl = direction === 'rtl';

  for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
    const renderedCells = [];
    let rowDatum = rowSizeAndPositionManager.getSizeAndPositionOfCell(rowIndex);

    const rowKey = `row-${rowIndex}`;
    let rowStyle = {};
    let rowRendererParams = {};
    let renderedRow;

    if (canCacheStyle && styleCache[rowKey]) {
      rowStyle = styleCache[rowKey];
    } else {
      rowStyle = {
        height: rowDatum.size,
        position: 'relative',
        // top: rowDatum.offset + verticalOffsetAdjustment,
      };
    }

    for (
      let columnIndex = columnStartIndex;
      columnIndex <= columnStopIndex;
      columnIndex++
    ) {
      let columnDatum = columnSizeAndPositionManager.getSizeAndPositionOfCell(
        columnIndex,
      );
      let isVisible =
        columnIndex >= visibleColumnIndices.start &&
        columnIndex <= visibleColumnIndices.stop &&
        rowIndex >= visibleRowIndices.start &&
        rowIndex <= visibleRowIndices.stop;
      let cellKey = `${rowIndex}-${columnIndex}`;
      let cellStyle;

      // Cache style objects so shallow-compare doesn't re-render unnecessarily.
      if (canCacheStyle && styleCache[cellKey]) {
        cellStyle = styleCache[cellKey];
      } else {
        // In deferred mode, cells will be initially rendered before we know their size.
        // Don't interfere with CellMeasurer's measurements by setting an invalid size.
        if (
          deferredMeasurementCache &&
          !deferredMeasurementCache.has(rowIndex, columnIndex)
        ) {
          // Position not-yet-measured cells at top/left 0,0,
          // And give them width/height of 'auto' so they can grow larger than the parent Grid if necessary.
          // Positioning them further to the right/bottom influences their measured size.
          const columnOffset = 0;

          cellStyle = {
            left: isRtl ? undefined : columnOffset,
            right: isRtl ? columnOffset : undefined,
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 'auto',
          };
        } else {
          const columnOffset = columnDatum.offset + horizontalOffsetAdjustment;

          cellStyle = {
            bottom: 0,
            left: isRtl ? undefined : columnOffset,
            right: isRtl ? columnOffset : undefined,
            position: 'absolute',
            top: 0,
            width: columnDatum.size,
          };

          styleCache[cellKey] = cellStyle;
        }
      }

      let cellRendererParams = {
        columnIndex,
        isScrolling,
        isVisible,
        key: cellKey,
        parent,
        rowIndex,
        style: cellStyle,
      };

      let renderedCell;

      // Avoid re-creating cells while scrolling.
      // This can lead to the same cell being created many times and can cause performance issues for "heavy" cells.
      // If a scroll is in progress- cache and reuse cells.
      // This cache will be thrown away once scrolling completes.
      // However if we are scaling scroll positions and sizes, we should also avoid caching.
      // This is because the offset changes slightly as scroll position changes and caching leads to stale values.
      // For more info refer to issue #395
      //
      // If isScrollingOptOut is specified, we always cache cells.
      // For more info refer to issue #1028
      if (
        (isScrollingOptOut || isScrolling) &&
        !horizontalOffsetAdjustment &&
        !verticalOffsetAdjustment
      ) {
        if (!cellCache[cellKey]) {
          cellCache[cellKey] = cellRenderer(cellRendererParams);
        }

        renderedCell = cellCache[cellKey];

        // If the user is no longer scrolling, don't cache cells.
        // This makes dynamic cell content difficult for users and would also lead to a heavier memory footprint.
      } else {
        renderedCell = cellRenderer(cellRendererParams);
      }

      if (renderedCell == null || renderedCell === false) {
        continue;
      }

      renderedCells.push(renderedCell);
    }

    rowRendererParams = {
      rowIndex,
      key: rowKey,
      style: rowStyle,
      role: 'row',
      className: 'Grid__row',
      children: renderedCells,
    };

    renderedRow = rowRenderer(rowRendererParams);

    renderedRows.push(renderedRow);
  }

  return renderedRows;
}
