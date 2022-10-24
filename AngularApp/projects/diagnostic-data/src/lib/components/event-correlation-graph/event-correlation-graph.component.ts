import { Component, Input, OnInit } from '@angular/core';
import { DataTableDataType, DiagnosticData, TimeSeriesRendering, DataTableResponseObject, RenderingType } from '../../models/detector';
import { HighchartsData, HighchartGraphSeries } from '../highcharts-graph/highcharts-graph.component';
import { DataRenderBaseComponent, DataRenderer } from '../data-render-base/data-render-base.component';
import { TimeSeries, TablePoint, HighChartTimeSeries, MetricType,GraphSeries, GraphPoint } from '../../models/time-series';
import * as momentNs from 'moment';
import { TimeUtilities } from '../../utilities/time-utilities';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TimeSeriesGraphComponent } from 'dist/diagnostic-data/lib/components/time-series-graph/time-series-graph.component';
import { Data } from '@microsoft/applicationinsights-common';
import { Series } from 'highcharts';

const moment = momentNs;

@Component({
  selector: 'event-correlation-graph',
  templateUrl: './event-correlation-graph.component.html',
  styleUrls: ['./event-correlation-graph.component.scss']
})
export class EventCorrelationGraphComponent extends TimeSeriesGraphComponent implements OnInit, DataRenderer {

  EventDataRenderingType = RenderingType.EventCorrelationBase;
  _renderingProperties: TimeSeriesRendering;  
  allHighChartSeries: HighChartTimeSeries[] = [];
  TimeStampColumn = "TIMESTAMP";
  DetectorNameColumn = "DetectorName";

  
  @Input() eventCorrelationBaseSeries: TimeSeries[] = [];
  @Input() set eventCorrelationDataPointsSeries(eventCorrelationDataPointsSeries: TimeSeries[]) {
    this._mergeEventCorrelationDataPoints(eventCorrelationDataPointsSeries);
  }

  constructor(protected t: TelemetryService) {
    super(t);
  }

  ngOnInit(): void {
  }

  processData(data: DiagnosticData) {
    super.processData(data);

    if (data) {
      this._renderingProperties = <TimeSeriesRendering>data.renderingProperties;
      this.defaultValue = this.renderingProperties.defaultValue !== null ? this.renderingProperties.defaultValue : this.defaultValue;
      this.graphOptions = this.renderingProperties.graphOptions;

      if (this.renderingProperties.metricType != undefined) {
        this.metricType = this.renderingProperties.metricType;
      }

      this.customizeXAxis = this.graphOptions && this.graphOptions.customizeX && this.graphOptions.customizeX === 'true';
      this.timeGrain = this._getInitialTimegrain();
      this.dataTable = data.table;
      this._processDiagnosticData(data);
      this.selectSeries();
    }
  }


  selectSeries() {
    this.selectedSeries = this.allSeries.map(series => series.series);
    this.selectedHighChartSeries = this.allHighChartSeries.map(series => series.series);
  }

  
  // Initial Time Grain: The max allowed for each range
  private _getInitialTimegrain(): momentNs.Duration {
    const rangeInMonths = Math.abs(this.startTime.diff(this.endTime, 'months'));
    const rangeInHours = Math.abs(this.startTime.diff(this.endTime, 'hours'));

    // Greater than 1 month: 1 month
    if (rangeInMonths > 1 || this.customizeXAxis && rangeInMonths === 1) {
      return moment.duration(1, 'months');
    }
    // 7 days -> 1 month: 1 day
    if (rangeInHours > 168) {
      return moment.duration(1, 'days');
    }

    // Other scenarios we set the default as 60 minutes
    return moment.duration(60, 'minutes');
  }


  private _mergeEventCorrelationDataPoints(eventCorrelationDataPointsSeries: TimeSeries[]) {
    const timestampColumn = this._getTimeStampColumnIndex();
    const detectorNameColumnIndex = this._getDetectorNameColumnIndex();
    eventCorrelationDataPointsSeries = data.table.rows.map(row => row[detectorNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
    this.eventCorrelationBaseSeries.forEach(timeSeries =>{
       let seriesName = timeSeries.name;
       let series = timeSeries.series;
      
    })
    this.allHighChartSeries.push(this.eventCorrelationBaseSeries);
    highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting }};
    this.allHighChartSeries.push(this.eventCorrelationDataPointsSeries);
    


    Data.table.rows.forEach(row => {
      numberValueColumns.forEach(column => {
          const columnIndex: number = data.table.columns.indexOf(column);

          const timestamp = moment.utc(row[timestampColumn]);

          if (!this.customizeXAxis) {
              const currentGcf = this._getGreatestCommonFactor(timestamp);
              if (currentGcf.asMilliseconds() < this.timeGrain.asMilliseconds()) {
                  this.timeGrain = currentGcf.clone();
              }
          }

          lastTimeStamp = timestamp;

          if (columnIndex > -1 && row[columnIndex] != null) {
              const point: TablePoint = <TablePoint>{
                  timestamp: timestamp,
                  value: parseFloat(row[columnIndex]),
                  column: column.columnName,
                  counterName: counterNameColumnIndex >= 0 ? row[counterNameColumnIndex] : null
              };

              tablePoints.push(point);
          }
      });
  });

  }

  private _getTimeStampColumnIndex(): number {
    const columnIndex = this.renderingProperties.timestampColumnName ?
        this.dataTable.columns.findIndex(column => this.renderingProperties.timestampColumnName === "TIMESTAMP") :
        this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);

    return columnIndex;
}

private _getDetectorNameColumnIndex(): number {
    const columnIndex = this.renderingProperties.counterColumnName ?
        this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === "DetectorName") :
        this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.String);

    return columnIndex;
}



    return columns;
}
}