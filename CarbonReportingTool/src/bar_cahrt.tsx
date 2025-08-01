import React, { useEffect, useRef, useState } from "react";
import Highcharts, { SeriesColumnOptions, Chart } from 'highcharts';
import {
  FilterPanel, FormField, Input, Label, Select, TitleBar, WidgetWrapper, useToast
} from "uxp/components";
import { IContextProvider } from "./uxp";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}
interface ActivityRow {
  activity: string;
  year: string;
  month: string;
  value: number;
}
const monthOrder: { [key: string]: number } = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

const BarChartComponent: React.FunctionComponent<IWidgetProps> = (props) => {
  const chartRef = useRef(null);
  const chartInstance = useRef<Chart | null>(null); // 🔧 chart instance ref
  const toast = useToast();

  const [activityData, setActivityData] = useState([]);
  const [monthFilter, setMonthFilter] = useState<any>(null);
  const [yearFilter, setYearFilter] = useState<any>(new Date().getFullYear());
  const [activityName, setActivityName] = useState<any>("");
  const [activityNames, setActivityNames] = useState<string[]>([]); // 🔧 for custom legend

  const monthOptions = Object.keys(monthOrder).map(m => ({ label: m, value: m }));
  const [selectedLegend, setSelectedLegend] = useState<string | null>("all");

  const fetchActivityData = async () => {
    try {
      const result = await props.uxpContext?.executeAction(
        "carbon_reporting_80rr",
        "GetAllData",
        { year: yearFilter, month: monthFilter, activityName },
        { json: true }
      );

      const cleanedData = result?.map((row: any) => ({
        activity: row.activity,
        year: row.year,
        month: row.month,
        value: parseFloat(row.value)
      })) || [];

      setActivityData(cleanedData);

      // 🔧 collect distinct activity names for legend
      const distinctActivities = Array.from(new Set(
        cleanedData.map((item: { activity: string }) => item.activity)
      ));
      
      setActivityNames(
        Array.from(new Set(
          cleanedData.map((item: any) => item.activity as string)
        ))
      );
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };
  const legendItemStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: 4,
    backgroundColor: active ? '#f0f8ff' : 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 'bold' : 'normal',
    border: active ? `1px solid ${color}` : '1px solid transparent',
    transition: 'all 0.2s ease'
  });
  
  const legendDotStyle = (color: string): React.CSSProperties => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: color,
    display: 'inline-block'
  });
  
  useEffect(() => { fetchActivityData(); }, [monthFilter, yearFilter, activityName]);

  useEffect(() => {
    if (!chartRef.current) return;

    const processedData: { [key: string]: number[] } = {};

    activityData.forEach(item => {
      if (!processedData[item.activity]) {
        processedData[item.activity] = [];
      }
    });

    Object.keys(processedData).forEach(activity => {
      const activityItems = activityData
        .filter(item => item.activity === activity)
        .sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);

      processedData[activity] = activityItems.map(item => item.value);
    });

    const categories = activityData.length > 0
      ? Array.from(new Set(activityData.map(d => d.month))).sort((a, b) => monthOrder[a] - monthOrder[b])
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const series: SeriesColumnOptions[] =
      Object.keys(processedData).length > 0
        ? Object.keys(processedData).map((activity, index) => ({
            name: activity,
            data: processedData[activity],
            type: 'column',
            yAxis: activity === 'Electricity Consumption – HVAC' ? 1 : 0,
            color: index === 0 ? '#7cb5ec' : index === 1 ? '#434348' : '#90ed7d',
            borderWidth: 0,
            borderRadius: 2
          }))
        : [{
            name: 'No Data',
            data: [],
            type: 'column'
          }];

    const chartConfig: Highcharts.Options = {
      chart: {
        type: 'column',
        height: 450,
        backgroundColor: 'transparent',
        spacing: [20, 20, 20, 20]
      },
      title: {
        text: 'Monthly Activity Data - Bar Chart',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }
      },

      xAxis: {
        categories: categories,
        title: {
          text: 'Month',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        gridLineWidth: 0,
        lineWidth: 1,
        lineColor: '#ccc',
        tickWidth: 1,
        tickColor: '#ccc'
      },
      yAxis: [{
        title: {
          text: 'Generator Fuel & Refrigerant (Units)',
          style: { color: '#666', fontSize: '12px', fontWeight: 'bold' }
        },
        labels: { style: { color: '#666', fontSize: '11px' } },
        gridLineWidth: 1,
        gridLineColor: '#e6e6e6'
      }, {
        title: {
          text: 'HVAC Electricity (kWh)',
          style: { color: '#666', fontSize: '12px', fontWeight: 'bold' }
        },
        labels: { style: { color: '#666', fontSize: '11px' } },
        opposite: true,
        gridLineWidth: 0
      }],
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderRadius: 8,
        shadow: true,
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
        style: { fontSize: '12px' }
      },
      legend: { enabled: false }, // 🔧 disable default legend
      plotOptions: {
        column: {
          dataLabels: { enabled: false },
          enableMouseTracking: true,
          borderWidth: 0,
          groupPadding: 0.1,
          pointPadding: 0.05,
          states: { hover: { brightness: 0.1 } },
          animation: { duration: 1000 }
        }
      },
      series: series,
      credits: { enabled: false },
      responsive: {
        rules: [{
          condition: { maxWidth: 600 },
          chartOptions: { chart: { height: 400 } }
        }]
      }
    };

    chartInstance.current = Highcharts.chart(chartRef.current, chartConfig); // 🔧 save chart instance
  }, [activityData]);

  // 🔧 Legend toggle helpers
  const showAllSeries = () => {
    chartInstance.current?.series.forEach(s => s.show());
  };

  const showOnlySeries = (name: string) => {
    chartInstance.current?.series.forEach(s => {
      if (s.name === name) s.show();
      else s.hide();
    });
  };

  return (
    <WidgetWrapper>
      <TitleBar title="">
        <FilterPanel onClear={() => {
          setMonthFilter(null);
          setYearFilter(new Date().getFullYear());
          setActivityName("");
        }}>
          <FormField>
            <Label>Month</Label>
            <Select options={monthOptions} selected={monthFilter} onChange={(val) => setMonthFilter(val)} />
          </FormField>
          <FormField>
            <Label>Year</Label>
            <Input type="number" value={yearFilter} onChange={(val) => setYearFilter(parseInt(val) || null)} />
          </FormField>
        </FilterPanel>
      </TitleBar>

      {/* 🔧 Custom Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
  <div
    style={legendItemStyle(selectedLegend === "all", "#888")}
    onClick={() => {
      setSelectedLegend("all");
      showAllSeries();
    }}
  >
    <span style={legendDotStyle("#888")}></span>
    All
  </div>

  {activityNames.map((name, idx) => {
  const rawColor = chartInstance.current?.series.find(s => s.name === name)?.color;
  const color = typeof rawColor === 'string' ? rawColor : "#ccc";

    return (
      <div
        key={name}
        style={legendItemStyle(selectedLegend === name, color)}
        onClick={() => {
          setSelectedLegend(name);
          showOnlySeries(name);
        }}
      >
        <span style={legendDotStyle(color)}></span>
        {name}
      </div>
    );
  })}
</div>


      <div style={{ width: '100%', height: '100%', padding: '20px' }}>
        <div
          ref={chartRef}
          style={{
            width: '100%',
            height: '450px',
            minHeight: '450px',
            borderRadius: '8px',
          }}
        />
      </div>
    </WidgetWrapper>
  );
};

export default BarChartComponent;
