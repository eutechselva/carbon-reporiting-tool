import React, { useEffect, useRef, useState } from "react";
import Highcharts from 'highcharts';
import {
  AsyncButton,
  FilterPanel,
  FormField,
  Input,
  Label,
  Select,
  TitleBar,
  WidgetWrapper,
  useToast
} from "uxp/components";
import { IContextProvider } from "./uxp";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

// Month sort helper
const monthOrder: { [key: string]: number } = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

// 🔧 Style helpers for legend
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

const AllData: React.FunctionComponent<IWidgetProps> = (props) => {
  const chartRef = useRef(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);

  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [selectedLegend, setSelectedLegend] = useState<string>("all");

  const [monthFilter, setMonthFilter] = useState<any>(null);
  const [yearFilter, setYearFilter] = useState<any>(new Date().getFullYear());
  const [activityName, setActivityName] = useState<string>("");

  const monthOptions = [
    { label: "Jan", value: "Jan" }, { label: "Feb", value: "Feb" },
    { label: "Mar", value: "Mar" }, { label: "Apr", value: "Apr" },
    { label: "May", value: "May" }, { label: "Jun", value: "Jun" },
    { label: "Jul", value: "Jul" }, { label: "Aug", value: "Aug" },
    { label: "Sep", value: "Sep" }, { label: "Oct", value: "Oct" },
    { label: "Nov", value: "Nov" }, { label: "Dec", value: "Dec" },
  ];

  const fetchActivityData = async () => {
    if (!props.uxpContext) return;

    setLoading(true);
    try {
      const result = await props.uxpContext.executeAction(
        "carbon_reporting_80rr",
        "GetAllData",
        { year: yearFilter, month: monthFilter, activityName: activityName },
        { json: true }
      );

      const cleanedData = result?.map((row: any) => ({
        activity: row.activity,
        year: row.year,
        month: row.month,
        value: parseFloat(row.value)
      })) || [];

      setActivityData(cleanedData);

      setActivityNames(
        Array.from(new Set(
          cleanedData.map((item: any) => item.activity as string)
        ))
      );
      
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load activity data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [monthFilter, yearFilter]);

  useEffect(() => {
    if (!chartRef.current) return;

    const processedData: { [key: string]: number[] } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

    const series: Highcharts.SeriesLineOptions[] =
      Object.keys(processedData).length > 0
        ? Object.keys(processedData).map((activity, index) => ({
            name: activity,
            data: processedData[activity],
            type: 'line',
            yAxis: activity === 'Electricity Consumption – HVAC' ? 1 : 0,
            color: index === 0 ? '#7cb5ec' : index === 1 ? '#434348' : '#90ed7d',
            marker: {
              enabled: true,
              radius: 4
            }
          }))
        : [{
            name: 'No Data',
            data: [],
            type: 'line'
          }];

    const xCategories = activityData.length > 0
      ? Array.from(new Set(activityData.map(d => d.month))).sort((a, b) => monthOrder[a] - monthOrder[b])
      : months;

    const chartConfig: Highcharts.Options = {
      chart: {
        type: 'line',
        height: 400,
        backgroundColor: 'transparent'
      },
      title: {
        text: 'Activity Data (Line Chart)',
        style: { fontSize: '18px', fontWeight: 'bold' , color: '#333'}
      },

      xAxis: {
        categories: xCategories,
        title: { text: 'Month' ,style: { color: '#666', fontSize: '14px', fontWeight: 'bold' }},
        gridLineWidth: 1,
        gridLineColor: '#e6e6e6'
      },
      yAxis: [{
        title: { text: 'Generator Fuel & Refrigerant (Units)', style: { color: '#666', fontSize: '12px', fontWeight: 'bold' } },
        labels: { style: { color: '#666' } }
      }, {
        title: { text: 'HVAC Electricity (kWh)', style: { color: '#666', fontSize: '12px', fontWeight: 'bold' } },
        labels: { style: { color: '#666' } },
        opposite: true
      }],
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderRadius: 5,
        shadow: true
      },
      legend: { enabled: false }, // ✅ custom legend replaces native one
      plotOptions: {
        line: {
          dataLabels: { enabled: false },
          enableMouseTracking: true,
          lineWidth: 2,
          marker: {
            symbol: 'circle',
            states: { hover: { radius: 6 } }
          }
        }
      },
      series: series,
      credits: { enabled: false },
      responsive: {
        rules: [{
          condition: { maxWidth: 500 },
          chartOptions: {}
        }]
      }
    };

    chartInstance.current = Highcharts.chart(chartRef.current, chartConfig);
  }, [activityData]);

  return (
    <WidgetWrapper>
      <TitleBar title="">
        <FilterPanel
          onClear={() => {
            setMonthFilter(null);
            setYearFilter(new Date().getFullYear());
            setActivityName("");
          }}
        >
          <FormField>
            <Label>Filter by month</Label>
            <Select options={monthOptions} selected={monthFilter} onChange={(newMonth) => setMonthFilter(newMonth)} />
          </FormField>

          <FormField>
            <Label>Filter by Year</Label>
            <Input
              type="number"
              value={yearFilter}
              onChange={(val) => setYearFilter(parseInt(val) || null)}
            />
          </FormField>
        </FilterPanel>
      </TitleBar>

      {/* ✅ Custom Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div
          style={legendItemStyle(selectedLegend === "all", "#888")}
          onClick={() => {
            setSelectedLegend("all");
            chartInstance.current?.series.forEach(s => s.show());
          }}
        >
          <span style={legendDotStyle("#888")}></span>
          All
        </div>

        {activityNames.map((name) => {
          const rawColor = chartInstance.current?.series.find(s => s.name === name)?.color;
          const color = typeof rawColor === "string" ? rawColor : "#ccc";

          return (
            <div
              key={name}
              style={legendItemStyle(selectedLegend === name, color)}
              onClick={() => {
                setSelectedLegend(name);
                chartInstance.current?.series.forEach(s => {
                  if (s.name === name) s.show();
                  else s.hide();
                });
              }}
            >
              <span style={legendDotStyle(color)}></span>
              {name}
            </div>
          );
        })}
      </div>

      {/* Chart Container */}
      <div style={{ width: '100%', height: '100%', padding: '20px' }}>
        <div
          ref={chartRef}
          style={{ width: '100%', height: '400px', minHeight: '400px' }}
        />
      </div>
    </WidgetWrapper>
  );
};

export default AllData;
