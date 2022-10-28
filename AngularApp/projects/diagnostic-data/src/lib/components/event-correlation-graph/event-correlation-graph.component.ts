import { Component, Input, OnInit } from '@angular/core';
import { DataTableDataType, DiagnosticData, TimeSeriesRendering, DataTableResponseObject, RenderingType } from '../../models/detector';
import { HighchartGraphSeries } from '../highcharts-graph/highcharts-graph.component';
import { DataRenderBaseComponent, DataRenderer } from '../data-render-base/data-render-base.component';
import { TimeSeries, TablePoint, HighChartTimeSeries, MetricType, GraphSeries, GraphPoint } from '../../models/time-series';
import * as momentNs from 'moment';
import { TimeUtilities } from '../../utilities/time-utilities';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DetectorControlService } from '../../services/detector-control.service';

const moment = momentNs;

@Component({
  selector: 'event-correlation-graph',
  templateUrl: './event-correlation-graph.component.html',
  styleUrls: ['./event-correlation-graph.component.scss']
})
export class EventCorrelationGraphComponent extends DataRenderBaseComponent implements OnInit, DataRenderer {

  EventDataRenderingType = RenderingType.EventCorrelationBase;

  TimeStampColumn = "TIMESTAMP";
  DetectorNameColumn = "DetectorName";
  startTime = this._detectorControl.startTime;
  endTime = this._detectorControl.endTime;

  allSeries: TimeSeries[] = [];
  allSeriesNames: string[] = [];

  // All series with highchart
  allHighChartSeries: HighChartTimeSeries[] = [];
  allHighChartSeriesNames: string[] = [];

  selectedSeries: GraphSeries[];
  selectedHighChartSeries: HighchartGraphSeries[];

  renderingProperties: TimeSeriesRendering;
  dataTable: DataTableResponseObject;
  defaultValue: number = 0;
  graphOptions: any;
  customizeXAxis: boolean;

  timeGrain: momentNs.Duration;
  metricType: MetricType = MetricType.Avg;
  public Data: DiagnosticData;
  scatterPointValue: number;
  labelFontColor: string = "A9A9A9" // Dark gray to comply with contrast requirements with a transparent background for Accessibility purposes

  dataCorrelation: DiagnosticData = {
    "table": {
        "columns": [{
            "columnName": "TIMESTAMP",
            "dataType": "DateTime",
            "columnType": null
        }, {
            "columnName": "DetectorName",
            "dataType": "String",
            "columnType": null
        }
        ],
        "rows": [
            [
                 "2022-10-02T00:10:00",
                "Application Deployment"
            ],
            [
                "2022-10-02T00:40:00",
                "Application Deployment"
            ],
        ]
    },
    "renderingProperties": {
        "type": RenderingType.EventCorrelationDataPoints,
        "title": "CorrelationDataPoint",
        "description": null,
        "isVisible": true
    }
};

dataCorrelation2: DiagnosticData = {
  "table": {
      "columns": [{
          "columnName": "TIMESTAMP",
          "dataType": "DateTime",
          "columnType": null
      }, {
          "columnName": "DetectorName",
          "dataType": "String",
          "columnType": null
      }
      ],
      "rows": [
          [
               "2022-10-01T23:30:00",
               "Platform Deployment"
          ],
      ]
  },
  "renderingProperties": {
      "type": RenderingType.EventCorrelationDataPoints,
      "title": "CorrelationDataPoint",
      "description": null,
      "isVisible": true
  }
};

dataCorrelation3: DiagnosticData = {
  "table": {
      "columns": [{
          "columnName": "TIMESTAMP",
          "dataType": "DateTime",
          "columnType": null
      }, {
          "columnName": "DetectorName",
          "dataType": "String",
          "columnType": null
      }
      ],
      "rows": [
          [
               "2022-10-01T23:40:00",
               "Application Insights Codeless Agent Upgrade"
          ],
      ]
  },
  "renderingProperties": {
      "type": RenderingType.EventCorrelationDataPoints,
      "title": "CorrelationDataPoint",
      "description": null,
      "isVisible": true
  }
};

  @Input() set eventCorrelationBaseSeries (data: DiagnosticData) {
    this.processData(data);
  }
  @Input() set eventCorrelationDataPointsSeries(data: DiagnosticData) {
    this.processData(data);
  }

  constructor(private t: TelemetryService, private _detectorControl: DetectorControlService,) {
    super(t);
  }

  ngOnInit(): void {
  }

  processData(data: DiagnosticData) {
    super.processData(data);

    if (data) {
      this.renderingProperties = <TimeSeriesRendering>data.renderingProperties;
      this.metricType = this.renderingProperties.metricType;
      this.defaultValue = this.renderingProperties.defaultValue !== null ? this.renderingProperties.defaultValue : this.defaultValue;
      this.graphOptions = this.renderingProperties.graphOptions;
      this.graphOptions.yAxis = [{
        tickAmount: 3,
        softMin: 0,
        crosshair: true,
        gridLineColor: "#929294",
        gridLineWidth: 0,
        minorGridLineWidth: 0,
        accessibility: {
            description: `Y axis values`
        },
        title: {
            text: '',
            style: {
                whiteSpace: 'nowrap'
            }
        },
        endOnTick: false,
        labels: {
            format: '{value:.2f}',
            style: {
                whiteSpace: 'nowrap',
                color: this.labelFontColor,
            }
        },
      },
      {
        title: {text: 'Other Events'},
          min:0,
          max: 2,
          opposite: true
        }];
      if (this.renderingProperties.metricType != undefined) {
        this.metricType = this.renderingProperties.metricType;
      }

      this.customizeXAxis = this.graphOptions && this.graphOptions.customizeX && this.graphOptions.customizeX === 'true';
      this.timeGrain = this._getInitialTimegrain();
      this.dataTable = data.table;

      if (this.renderingProperties.type === RenderingType.EventCorrelationBase) {
        this.scatterPointValue = 1;
        //this._processEventCorrelationBaseDiagnosticData(data);
        this._processEventCorrelationDataPointsDiagnosticData(this.dataCorrelation);
      }
      else if (this.renderingProperties.type === RenderingType.EventCorrelationDataPoints) {
        this.scatterPointValue = this.scatterPointValue + 0.1
        this._processEventCorrelationDataPointsDiagnosticData(data);
      }
      this.selectSeries();
    }
  }

  private _processEventCorrelationBaseDiagnosticData(data: DiagnosticData) {
    const timestampColumn = this._getTimeStampColumnIndex();
    const counterNameColumnIndex = this._getCounterNameColumnIndex();
    const numberValueColumns = this._getCounterValueColumns();

    let uniqueCounterNames: string[] = [];
    if (counterNameColumnIndex >= 0) {
      // This gets unique values in counter name row
      uniqueCounterNames = data.table.rows.map(row => row[counterNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
    }

    const timeSeriesDictionary = {};
    const highchartTimeSeriesDictionary = {};

    numberValueColumns.forEach(column => {
      if (uniqueCounterNames.length > 0) {
        uniqueCounterNames.forEach(counterName => {
          const seriesName = this._getSeriesName(column.columnName, counterName);
          timeSeriesDictionary[seriesName] = <TimeSeries>{ name: seriesName, series: <GraphSeries>{ key: seriesName, values: [] } };
          let accessibilitySetting = {
            description: seriesName,
            enabled: true,
            exposeAsGroupOnly: false,
            keyboardNavigation: {
              enabled: true
            }
          };

          highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting } };
        })
      } else {
        const seriesName = column.columnName;
        let accessibilitySetting = {
          description: seriesName,
          enabled: true,
          exposeAsGroupOnly: false,
          keyboardNavigation: {
            enabled: true
          }
        };
        timeSeriesDictionary[seriesName] = <TimeSeries>{ name: seriesName, series: <GraphSeries>{ key: seriesName, values: [] } };
        highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting } };
      }
    });

    const tablePoints: TablePoint[] = [];

    let lastTimeStamp: momentNs.Moment = this.startTime;

    data.table.rows.forEach(row => {
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

    // If there is no point, fallback on no data defaults
    if (data.table.rows.length < 1) {
      this.timeGrain = this._getNoDataTimegrain();
    }

    if (!this.customizeXAxis) {
      this._prepareStartAndEndTime();
    }

    Object.keys(timeSeriesDictionary).forEach(key => {

      const pointsForThisSeries =
        tablePoints
          .filter(point => this._getSeriesName(point.column, point.counterName) === key)
          .sort((b, a) => !this.customizeXAxis ? a.timestamp.diff(b.timestamp) : b.timestamp.diff(a.timestamp));

      if (!this.customizeXAxis) {
        let pointToAdd = pointsForThisSeries.pop();

        // Remove the points that earlier than starttime
        while (pointToAdd && pointToAdd.timestamp && pointToAdd.timestamp.isBefore(this.startTime)) {
          pointToAdd = pointsForThisSeries.pop();
        }

        for (const d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrain)) {
          let value = this.defaultValue;
          if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
            value = pointToAdd.value;
            pointToAdd = pointsForThisSeries.pop();
          }
          timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: d.clone(), y: value });
          highchartTimeSeriesDictionary[key].series.data.push([d.clone().valueOf(), value]);
          highchartTimeSeriesDictionary[key].series.type = 'line';
        }
      } else {
        pointsForThisSeries.forEach(pointToAdd => {
          if (pointToAdd.timestamp.isBefore(this.startTime)) {
            this.startTime = pointToAdd.timestamp;
          }
          timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: momentNs.utc(pointToAdd.timestamp), y: pointToAdd.value });
          highchartTimeSeriesDictionary[key].series.data.push([momentNs.utc(pointToAdd.timestamp).valueOf(), pointToAdd.value]);
          highchartTimeSeriesDictionary[key].series.type = 'line';
        });
      }

      this.allSeries.push(timeSeriesDictionary[key]);
      this.allHighChartSeries.push(highchartTimeSeriesDictionary[key]);
      this._processEventCorrelationDataPointsDiagnosticData(this.dataCorrelation);
      this._processEventCorrelationDataPointsDiagnosticData(this.dataCorrelation2);
      this._processEventCorrelationDataPointsDiagnosticData(this.dataCorrelation3);
    });
  }

  private _processEventCorrelationDataPointsDiagnosticData(data: DiagnosticData) {
    const timestampColumn = 0;
    const counterNameColumnIndex = 1;
    const numberValueColumns = this._getCounterValueColumns();
    const timeSeriesDictionary = {};
    const highchartTimeSeriesDictionary = {};
    const seriesName = data.table.rows[0][counterNameColumnIndex];

    timeSeriesDictionary[seriesName] = <TimeSeries>{ name: seriesName, series: <GraphSeries>{ key: seriesName, values: [] } };    
    let accessibilitySetting = {
      description: seriesName,
      enabled: true,
      exposeAsGroupOnly: false,
      keyboardNavigation: {
          enabled: true
      }
    };
    highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting }};

    let uniqueCounterNames: string[] = [];
    // This gets unique values in counter name row
    uniqueCounterNames = data.table.rows.map(row => row[counterNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);

    const tablePoints: TablePoint[] = [];

    let lastTimeStamp: momentNs.Moment = this.startTime;

    data.table.rows.forEach(row => {
            const timestamp = moment.utc(row[timestampColumn]);

            if (!this.customizeXAxis) {
                const currentGcf = this._getGreatestCommonFactor(timestamp);
                if (currentGcf.asMilliseconds() < this.timeGrain.asMilliseconds()) {
                    this.timeGrain = currentGcf.clone();
                }
            }

            lastTimeStamp = timestamp;
            let pointValue = 1;
            let hCSTemp = this.allHighChartSeries.filter(timeSeries => { timeSeries.series.type === "scatter" });
            // if there's a series with value during this time, increase the value by 0.1 to make it visible
      //      if (hCSTemp) {
      //        hCSTemp.forEach(series => { series.series.data.forEach(value => { value === timestamp.valueOf()? pointValue = pointValue + 0.1 : pointValue } ) });             
      //      }
            if (counterNameColumnIndex > -1 && row[counterNameColumnIndex] != null) {
                const point: TablePoint = <TablePoint>{
                    timestamp: timestamp,
                    value: pointValue,
                    column: seriesName,
                    counterName: counterNameColumnIndex >= 0 ? row[counterNameColumnIndex] : null
                };
                tablePoints.push(point);
            }       
    });

    // If there is no point, fallback on no data defaults
    if (data.table.rows.length < 1) {
        this.timeGrain = this._getNoDataTimegrain();
    }

    if (!this.customizeXAxis) {
        this._prepareStartAndEndTime();
    }

    Object.keys(timeSeriesDictionary).forEach(key => {

        const pointsForThisSeries =
            tablePoints
                .filter(point => this._getSeriesName(point.column, point.counterName) === key)
                .sort((b, a) => !this.customizeXAxis ? a.timestamp.diff(b.timestamp) : b.timestamp.diff(a.timestamp));

        if (!this.customizeXAxis) {
            //let pointToAdd = pointsForThisSeries.pop();

            // Remove the points that earlier than starttime
            // while (pointToAdd && pointToAdd.timestamp && pointToAdd.timestamp.isBefore(this.startTime)) {
            //     pointToAdd = pointsForThisSeries.pop();
            // }

            // for (const d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrain)) {
            //     let value = this.defaultValue;
            //     if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
            //         value = pointToAdd.value;
            //         pointToAdd = pointsForThisSeries.pop();
            //     }
            //     timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: d.clone(), y: value });
            //     highchartTimeSeriesDictionary[key].series.data.push([d.clone().valueOf(), value]);
            //     highchartTimeSeriesDictionary[key].series.type = "scatter";
            //     highchartTimeSeriesDictionary[key].series.marker = { radius: 4 };
            //     highchartTimeSeriesDictionary[key].series.yAxis = 1;
            // }
                timeSeriesDictionary[key].series.values = tablePoints.map(tp => <GraphPoint>{ x: tp.timestamp.clone(), y: tp.value });
                 highchartTimeSeriesDictionary[key].series.data = tablePoints.map(tp => {
                  return [tp.timestamp.clone().valueOf(),tp.value];
                 });
                highchartTimeSeriesDictionary[key].series.type = "scatter";
                highchartTimeSeriesDictionary[key].series.marker = { radius: 4 };
                highchartTimeSeriesDictionary[key].series.yAxis = 1;
        } else {
            pointsForThisSeries.forEach(pointToAdd => {
                if (pointToAdd.timestamp.isBefore(this.startTime)) {
                    this.startTime = pointToAdd.timestamp;
                }
                timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: momentNs.utc(pointToAdd.timestamp), y: pointToAdd.value });
                highchartTimeSeriesDictionary[key].series.data.push([momentNs.utc(pointToAdd.timestamp).valueOf(), pointToAdd.value]);
                highchartTimeSeriesDictionary[key].series.type = "scatter";
                highchartTimeSeriesDictionary[key].series.marker = { radius: 4 };
                highchartTimeSeriesDictionary[key].series.yAxis = 1;
                highchartTimeSeriesDictionary[key].series.tooltip = { pointFormat: '{point.x:%a, %b %e, %H:%M%p}'};
            });
        }
        this.allSeries.push(timeSeriesDictionary[key]);
        this.allHighChartSeries.push(highchartTimeSeriesDictionary[key]);
    });
  }

  selectSeries() {
    this.selectedSeries = this.allSeries.map(series => series.series);
    this.selectedHighChartSeries = this.allHighChartSeries.map(series => series.series);
  }

  private _getGreatestCommonFactor(timestamp: momentNs.Moment): momentNs.Duration {
    const minuteGcf = this._gcd(timestamp.minutes(), this.timeGrain.asMinutes());
    if (minuteGcf !== 60) { return moment.duration(minuteGcf, 'minutes'); }

    const hourGcf = this._gcd(timestamp.hours(), this.timeGrain.asHours());
    if (hourGcf !== 24) { return moment.duration(hourGcf, 'hours'); }

    const daysInMonth = timestamp.daysInMonth();
    const daysGcf = hourGcf === 24 ? this._gcd(timestamp.days(), daysInMonth) : 0;
    if (daysGcf !== daysInMonth) { return moment.duration(daysGcf, 'days'); }

    return moment.duration(1, 'month');

}

private _gcd(a: number, b: number) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (true) {
        if (b > a) { const temp = a; a = b; b = temp; }
        if (b === 0) { return a; }
        a %= b;
        if (a === 0) { return b; }
        b %= a;
    }
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

// No data time grain: The default in the case of one or no data points
private _getNoDataTimegrain() {
    const rangeInMonths = Math.abs(this.startTime.diff(this.endTime, 'months'));
    const rangeInHours = Math.abs(this.startTime.diff(this.endTime, 'hours'));

    // Greater than 1 month: 1 month
    if (rangeInMonths > 1) {
        return moment.duration(1, 'months');
    }
    // 7 days -> 1 month: 1 day
    if (rangeInHours >= 168) {
        return moment.duration(1, 'days');
    }

    // 1 days -> 7 days
    if (rangeInHours > 24) {
        return moment.duration(1, 'hours');
    }

    // else 1 hr
    return moment.duration(5, 'minutes');
}

private _prepareStartAndEndTime() {
    const start = this.startTime;
    const end = this.endTime;

    TimeUtilities.roundDown(start, this.timeGrain);
    TimeUtilities.roundDown(end, this.timeGrain);
    end.minute(end.minute() - end.minute() % this.timeGrain.minutes()).second(0);
    this.startTime = start;
    this.endTime = end;
}


  // private _mergeEventCorrelationDataPoints(eventCorrelationDataPointsSeries: TimeSeries[]) {
  //   const timestampColumn = this._getTimeStampColumnIndex();
  //   const detectorNameColumnIndex = this._getDetectorNameColumnIndex();
  //   const timeSeriesDictionary = {};
  //   const highchartTimeSeriesDictionary = {};
  //   eventCorrelationDataPointsSeries = data.table.rows.map(row => row[detectorNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
  //   this.eventCorrelationBaseSeries.forEach(timeSeries => {
  //     let seriesName = timeSeries.name;
  //     let series = timeSeries.series;

  //   })
  //   this.allHighChartSeries.push(this.eventCorrelationBaseSeries);
  //   seriesData[]
  //   this.selectSeries.data = seriesData[]
  //   highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting } };
  //   this.allHighChartSeries.push(this.eventCorrelationDataPointsSeries);



  //   Data.table.rows.forEach(row => {
  //     numberValueColumns.forEach(column => {
  //       const columnIndex: number = data.table.columns.indexOf(column);

  //       const timestamp = moment.utc(row[timestampColumn]);

  //       if (!this.customizeXAxis) {
  //         const currentGcf = this._getGreatestCommonFactor(timestamp);
  //         if (currentGcf.asMilliseconds() < this.timeGrain.asMilliseconds()) {
  //           this.timeGrain = currentGcf.clone();
  //         }
  //       }

  //       lastTimeStamp = timestamp;

  //       if (columnIndex > -1 && row[columnIndex] != null) {
  //         const point: TablePoint = <TablePoint>{
  //           timestamp: timestamp,
  //           value: parseFloat(row[columnIndex]),
  //           column: column.columnName,
  //           counterName: counterNameColumnIndex >= 0 ? row[counterNameColumnIndex] : null
  //         };

  //         tablePoints.push(point);
  //       }
  //     });
  //   });

  // }

  private _getDetectorNameColumnIndex(): number {
    const columnIndex = this.renderingProperties.counterColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === "DetectorName") :
      this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.String);

    return columnIndex;
  }

  private _getSeriesName(column: string, countername: string) {
    return countername ? `${countername}-${column}` : column;
}  

  private _getTimeStampColumnIndex(): number {
    const columnIndex = this.renderingProperties.timestampColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.timestampColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);

    return columnIndex;
  }

  private _getCounterNameColumnIndex(): number {
    const columnIndex = this.renderingProperties.counterColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.String);

    return columnIndex;
  }

  private _getCounterValueColumns() {
    const columns = this.renderingProperties.seriesColumns ?
      this.dataTable.columns.filter(column => this.renderingProperties.seriesColumns.indexOf(column.columnName) > 0) :
      this.dataTable.columns.filter(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);

    return columns;
  }
}