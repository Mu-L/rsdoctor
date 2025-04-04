import React, { useState, useEffect, memo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { CustomChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import dayjs from 'dayjs';
import { ChartProps, DurationMetric, ITraceEventData } from '../types';
import { groupBy } from 'lodash-es';
import { ChartTypes, PALETTE_COLORS } from '../constants';

interface CoordSysType {
  x: number;
  y: number;
  width: number;
  height: number;
}
type LoaderType = {
  name: string;
  value: number[];
  itemStyle: { normal: { color: string; opacity?: number } };
  ext?: Record<string, any>;
};

const LINE_HEIGHT = 60;

export const TimelineCom: React.FC<{
  loaderData?: DurationMetric[];
  pluginsData?: ITraceEventData[];
  formatterFn: Function;
  chartType?: ChartTypes;
  exts?: { endTimestamp: number; startTimestamp: number };
}> = memo(
  ({
    loaderData,
    pluginsData,
    formatterFn,
    chartType = ChartTypes.Normal,
    exts = null,
  }) => {
    const data: LoaderType[] = [];
    let categories: string[] = [];
    const [optionsData, setOptionsData] = useState({});

    // Register the required components
    echarts.use([
      CustomChart,
      TooltipComponent,
      GridComponent,
      DataZoomComponent,
      CanvasRenderer,
    ]);

    useEffect(() => {
      if (!loaderData) return;
      const _categories: string[] = [];
      loaderData.forEach((_l) => {
        _categories.unshift(_l.n + ' total');
        _categories.unshift(_l.n);
      });

      // Generate mock data
      loaderData.forEach(function (_loaderData, _i) {
        data.push({
          name: _loaderData.n + ' total',
          value: [
            _categories.indexOf(_loaderData.n + ' total'),
            _loaderData.s,
            _loaderData.e,
            _loaderData.e - _loaderData.s,
          ],
          itemStyle: {
            normal: {
              color: PALETTE_COLORS[Math.floor(Math.random() * 27)],
              opacity: 0.25,
            },
          },
        });

        if (!_loaderData?.c) return;
        for (let l = 0; l < _loaderData?.c?.length; l++) {
          data.push({
            name: _loaderData.n,
            value: [
              _categories.indexOf(_loaderData.n),
              _loaderData.c[l].s,
              _loaderData.c[l].e,
              _loaderData.c[l].e - _loaderData.c[l].s,
            ],
            itemStyle: {
              normal: {
                color: PALETTE_COLORS[Math.floor(Math.random() * 27)],
                opacity: 0.25,
              },
            },
            ext: _loaderData.c[l].ext as ChartProps['loaders'][0],
          });
        }
      });

      categories = _categories.map((val, i) => {
        if (i % 2 !== 0) {
          return val.replace(' total', '');
        } else {
          return '';
        }
      });
    }, [loaderData]);

    useEffect(() => {
      if (!pluginsData) return;

      const _pluginsData = groupBy(pluginsData, (e: ITraceEventData) => e.pid);

      Object.keys(_pluginsData)
        .reverse()
        .forEach(function (key, i) {
          _pluginsData[key].forEach((_plugin, _i) => {
            data.push({
              name: String(_plugin.pid),
              value: [
                i,
                _plugin.args.s,
                _plugin.args.e,
                _plugin.args.e - _plugin.args.s,
              ],
              itemStyle: {
                normal: {
                  color: PALETTE_COLORS[Math.floor(Math.random() * 27)],
                  opacity: 0.25,
                },
              },
              ext: _plugin,
            });
          });
          categories.push(String(key.charAt(0).toUpperCase() + key.slice(1)));
        });
    }, [pluginsData]);

    useEffect(() => {
      function renderItem(
        params: { coordSys: CoordSysType },
        api: {
          value: (arg0: number) => number;
          coord: (arg0: number[]) => any;
          size: (arg0: number[]) => number[];
          style: () => string;
        },
      ) {
        const categoryIndex = api.value(0);
        const start = api.coord([api.value(1), categoryIndex]);
        const end = api.coord([api.value(2), categoryIndex]);
        const height = api.size([0, 1])[1] * 0.3;

        const rectShape = echarts.graphic.clipRectByRect(
          {
            x: start[0],
            y:
              chartType === ChartTypes.Loader
                ? start[1] - (categoryIndex % 2 !== 0 ? 0 : height * 2)
                : start[1],
            width: end[0] - start[0] || 5,
            height: height,
          },
          {
            x: params.coordSys.x,
            y: params.coordSys.y,
            width: params.coordSys.width,
            height: params.coordSys.height,
          },
        );
        return (
          rectShape && {
            type: 'rect',
            transition: ['shape'],
            shape: rectShape,
            style: api.style(),
            enterFrom: {
              style: { opacity: 0 },
              x: 0,
            },
          }
        );
      }

      const option = {
        tooltip: {
          formatter: (raw: any) => {
            return formatterFn(raw);
          },
        },
        dataZoom: [
          {
            type: 'slider',
            filterMode: 'weakFilter',
            showDataShadow: false,
            top: -10,
          },
          {
            type: 'inside',
            filterMode: 'weakFilter',
          },
        ],
        grid: {
          top: 10,
          left: 0,
          bottom: 10,
          right: 0,
          height:
            categories.length > (chartType === ChartTypes.Loader ? 6 : 3)
              ? 'auto'
              : categories.length * LINE_HEIGHT,
          containLabel: true,
        },
        xAxis: {
          interval:
            exts?.endTimestamp && exts?.startTimestamp
              ? Math.floor((exts.endTimestamp - exts.startTimestamp) / 8)
              : null,
          position: 'top',
          splitLine: {
            show: true,
          },
          scale: true,
          axisLine: {
            show: false,
          },
          axisLabel: {
            formatter(val: number) {
              return dayjs(val as number).format('HH:mm:ss:SSS');
            },
          },
        },
        yAxis: {
          type: 'category',
          splitLine: {
            show: false,
          },
          axisLabel: {
            inside: true,
            lineHeight: 20,
            width: 100,
            fontSize: 12,
            color: '#000',
            verticalAlign: 'bottom',
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          data: categories,
        },
        series: [
          {
            type: 'custom',
            renderItem,
            itemStyle: {
              opacity: 0.8,
            },
            encode: {
              x: [1, 2],
              y: 0,
            },
            data,
          },
        ],
      };
      setOptionsData(option);
    }, [loaderData, pluginsData, exts]);

    return (
      <ReactEChartsCore
        option={optionsData}
        echarts={echarts}
        style={{
          width: '100%',
          minHeight:
            chartType === ChartTypes.Loader
              ? '500px'
              : chartType === ChartTypes.Minify
                ? '100px'
                : '200px',
          maxHeight: chartType === ChartTypes.Minify ? '100px' : '1000px',
          border: '1px solid #eee',
          borderRadius: '10px',
        }}
      />
    );
  },
);
