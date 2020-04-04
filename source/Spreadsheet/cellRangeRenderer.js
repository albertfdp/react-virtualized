/** @flow */

export default function cellRangeRenderer({
  canCacheStyle,
  cellCache,
  cellRenderer,
  columnSizeAndPositionManager,
  columnStartIndex,
  columnStopIndex,
  deferredMeasurementCache,
  horizontalOffsetAdjustment,
  isRTL,
  isRowVisible,
  isScrolling,
  isScrollingOptOut,
  rowIndex,
  styleCache,
  verticalOffsetAdjustment,
  visibleColumnIndices,
}) {
  const renderedCells = [];

  for (
    let columnIndex = columnStartIndex;
    columnIndex <= columnStopIndex;
    columnIndex++
  ) {
    let columnDatum = columnSizeAndPositionManager.getSizeAndPositionOfCell(
      columnIndex,
    );
    let isColumnVisible =
      columnIndex >= visibleColumnIndices.start &&
      columnIndex <= visibleColumnIndices.stop;

    let isVisible = isColumnVisible && isRowVisible;
    let columnKey = `${rowIndex}-${columnIndex}`;
    let style;

    // Cache style objects so shallow-compare doesn't re-render unnecessarily.
    if (canCacheStyle && styleCache[columnKey]) {
      style = styleCache[columnKey];
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
        style = {
          height: 'auto',
          left: isRTL ? undefined : 0,
          right: isRTL ? 0 : undefined,
          position: 'absolute',
          top: 0,
          width: 'auto',
        };
      } else {
        style = {
          left: isRTL ? undefined : columnDatum.offset,
          right: isRTL ? columnDatum.offset : undefined,
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: columnDatum.size,
        };

        styleCache[columnKey] = style;
      }
    }

    let cellRendererParams = {
      columnIndex,
      isScrolling,
      isVisible,
      key: columnKey,
      parent,
      rowIndex,
      style,
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
      if (!cellCache[columnKey]) {
        cellCache[columnKey] = cellRenderer(cellRendererParams);
      }

      renderedCell = cellCache[columnKey];

      // If the user is no longer scrolling, don't cache cells.
      // This makes dynamic cell content difficult for users and would also lead to a heavier memory footprint.
    } else {
      renderedCell = cellRenderer(cellRendererParams);
    }

    if (renderedCell == null || renderedCell === false) {
      continue;
    }

    if (process.env.NODE_ENV !== 'production') {
      warnAboutMissingStyle(parent, renderedCell);
    }

    renderedCells.push(renderedCell);
  }

  return renderedCells;
}

function warnAboutMissingStyle(parent, renderedCell) {
  if (process.env.NODE_ENV !== 'production') {
    if (renderedCell) {
      // If the direct child is a CellMeasurer, then we should check its child
      // See issue #611
      if (renderedCell.type && renderedCell.type.__internalCellMeasurerFlag) {
        renderedCell = renderedCell.props.children;
      }

      if (
        renderedCell &&
        renderedCell.props &&
        renderedCell.props.style === undefined &&
        parent.__warnedAboutMissingStyle !== true
      ) {
        parent.__warnedAboutMissingStyle = true;

        console.warn(
          'Rendered cell should include style property for positioning.',
        );
      }
    }
  }
}
