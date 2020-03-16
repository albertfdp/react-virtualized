/** @flow */
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import * as React from 'react';
import {
  ContentBox,
  ContentBoxHeader,
  ContentBoxParagraph,
} from '../demo/ContentBox';
import {LabeledInput, InputRow} from '../demo/LabeledInput';
import AutoSizer from '../AutoSizer';
import Spreadsheet from './Spreadsheet';
import styles from './Spreadsheet.example.css';

const STYLE = {
  border: '1px solid #ddd',
};
const STYLE_BOTTOM_LEFT_GRID = {
  backgroundColor: '#f7f7f7',
};
const STYLE_TOP_LEFT_GRID = {
  borderBottom: '2px solid #aaa',
  fontWeight: 'bold',
};
const STYLE_TOP_RIGHT_GRID = {
  borderBottom: '2px solid #aaa',
  fontWeight: 'bold',
};

export default class SpreadsheetExample extends React.PureComponent {
  static contextTypes = {
    list: PropTypes.instanceOf(Immutable.List).isRequired,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      fixedColumnCount: 2,
      fixedRowCount: 1,
      scrollToColumn: 0,
      scrollToRow: 0,
      direction: 'ltr',
    };

    this._cellRenderer = this._cellRenderer.bind(this);
    this._rowRenderer = this._rowRenderer.bind(this);
    this._onFixedColumnCountChange = this._createEventHandler(
      'fixedColumnCount',
    );
    this._onFixedRowCountChange = this._createEventHandler('fixedRowCount');
    this._onScrollToColumnChange = this._createEventHandler('scrollToColumn');
    this._onScrollToRowChange = this._createEventHandler('scrollToRow');
  }

  render() {
    const isRtl = this.state.direction === 'rtl';

    return (
      <ContentBox>
        <ContentBoxHeader
          text="Spreadsheet"
          sourceLink="https://github.com/bvaughn/react-virtualized/blob/master/source/Spreadsheet/Spreadsheet.example.js"
          docsLink="https://github.com/bvaughn/react-virtualized/blob/master/docs/Spreadsheet.md"
        />

        <ContentBoxParagraph>
          This component stitches together several grids to provide a fixed
          column/row interface.
        </ContentBoxParagraph>

        <ContentBoxParagraph>
          <label className={styles.checkboxLabel}>
            <input
              aria-label="Use RTL direction"
              className={styles.checkbox}
              type="checkbox"
              value={isRtl}
              onChange={event => this._onDirectionChanged(event.target.checked)}
            />
            Use RTL direction
          </label>
        </ContentBoxParagraph>

        <InputRow>
          {this._createLabeledInput(
            'fixedColumnCount',
            this._onFixedColumnCountChange,
          )}
          {this._createLabeledInput(
            'fixedRowCount',
            this._onFixedRowCountChange,
          )}
          {this._createLabeledInput(
            'scrollToColumn',
            this._onScrollToColumnChange,
          )}
          {this._createLabeledInput('scrollToRow', this._onScrollToRowChange)}
        </InputRow>

        <AutoSizer disableHeight>
          {({width}) => (
            <Spreadsheet
              {...this.state}
              cellRenderer={this._cellRenderer}
              columnWidth={75}
              columnCount={50}
              enableFixedColumnScroll
              enableFixedRowScroll
              height={300}
              rowHeight={40}
              rowCount={100}
              style={STYLE}
              styleBottomLeftGrid={{
                ...STYLE_BOTTOM_LEFT_GRID,
                borderRight: isRtl ? undefined : '2px solid #aaa',
                borderLeft: isRtl ? '2px solid #aaa' : undefined,
              }}
              styleTopLeftGrid={{
                ...STYLE_TOP_LEFT_GRID,
                borderRight: isRtl ? undefined : '2px solid #aaa',
                borderLeft: isRtl ? '2px solid #aaa' : undefined,
              }}
              styleTopRightGrid={STYLE_TOP_RIGHT_GRID}
              width={width}
              hideTopRightGridScrollbar
              hideBottomLeftGridScrollbar
              rowRendererBottomRight={this._rowRenderer}
            />
          )}
        </AutoSizer>
      </ContentBox>
    );
  }

  _cellRenderer({columnIndex, key, rowIndex, style, role}) {
    return (
      <div
        className={styles.Cell}
        key={key}
        style={style}
        role={role}
        aria-colindex={columnIndex - 2}>
        {columnIndex}, {rowIndex}
      </div>
    );
  }

  _rowRenderer({rowIndex, key, style, role, children, className}) {
    return (
      <div className={className} key={key} style={style} role={role}>
        {children}
      </div>
    );
  }

  _onDirectionChanged(value) {
    this.setState({
      direction: value ? 'rtl' : 'ltr',
    });
  }

  _createEventHandler(property) {
    return event => {
      const value = parseInt(event.target.value, 10) || 0;

      this.setState({
        [property]: value,
      });
    };
  }

  _createLabeledInput(property, eventHandler) {
    const value = this.state[property];

    return (
      <LabeledInput
        label={property}
        name={property}
        onChange={eventHandler}
        value={value}
      />
    );
  }
}
