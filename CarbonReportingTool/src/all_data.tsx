import React, { useEffect, useRef } from "react";
import { IWidgetProps } from "widget-designer/components";
import Highcharts from 'highcharts';

// Sample data
const activityData = [
  { activity: "Generator Fuel Consumption", year: "2025", month: "Jan", value: "43" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Feb", value: "56" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Mar", value: "49" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Apr", value: "51" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "May", value: "39" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Jun", value: "45" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Jul", value: "50" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Aug", value: "47" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Sep", value: "52" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Oct", value: "48" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Nov", value: "44" },
  { activity: "Generator Fuel Consumption", year: "2025", month: "Dec", value: "53" },

  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Jan", value: "45" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Feb", value: "76" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Mar", value: "68" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Apr", value: "55" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "May", value: "62" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Jun", value: "71" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Jul", value: "60" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Aug", value: "58" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Sep", value: "67" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Oct", value: "59" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Nov", value: "65" },
  { activity: "Refrigerant Leakages/Refilling", year: "2025", month: "Dec", value: "70" },

  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Jan", value: "4855" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Feb", value: "4720" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Mar", value: "4985" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Apr", value: "5100" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "May", value: "5205" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Jun", value: "5350" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Jul", value: "5470" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Aug", value: "5395" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Sep", value: "5250" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Oct", value: "4950" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Nov", value: "4825" },
  { activity: "Electricity Consumption – HVAC", year: "2025", month: "Dec", value: "4750" }
];

// Month sort helper
const monthOrder: { [key: string]: number } = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
};

const all_data: React.FunctionComponent<IWidgetProps> = (props) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Process data for Highcharts
      const processedData: { [key: string]: number[] } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Group data by activity
      activityData.forEach(item => {
        if (!processedData[item.activity]) {
          processedData[item.activity] = [];
        }
      });

      // Sort and organize data for each activity
      Object.keys(processedData).forEach(activity => {
        const activityItems = activityData
          .filter(item => item.activity === activity)
          .sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);
        
        processedData[activity] = activityItems.map(item => parseFloat(item.value));
      });

      // Create series for Highcharts
      const series: Highcharts.SeriesLineOptions[] = Object.keys(processedData).map((activity, index) => ({
        name: activity,
        data: processedData[activity],
        type: 'line',
        yAxis: activity === 'Electricity Consumption – HVAC' ? 1 : 0,
        color: index === 0 ? '#7cb5ec' : index === 1 ? '#434348' : '#90ed7d',
        marker: {
          enabled: true,
          radius: 4
        }
      }));

      // Highcharts configuration
      const chartConfig: Highcharts.Options = {
        chart: {
          type: 'line',
          height: 400,
          backgroundColor: 'transparent'
        },
        title: {
          text: 'Monthly Activity Data - 2025',
          style: {
            fontSize: '18px',
            fontWeight: 'bold'
          }
        },
        subtitle: {
          text: 'Generator Fuel, Refrigerant Leakages, and HVAC Electricity Consumption'
        },
        xAxis: {
          categories: months,
          title: {
            text: 'Month'
          },
          gridLineWidth: 1,
          gridLineColor: '#e6e6e6'
        },
        yAxis: [{
          title: {
            text: 'Generator Fuel & Refrigerant (Units)',
            style: { color: '#666' }
          },
          labels: {
            style: { color: '#666' }
          }
        }, {
          title: {
            text: 'HVAC Electricity (kWh)',
            style: { color: '#666' }
          },
          labels: {
            style: { color: '#666' }
          },
          opposite: true
        }],
        tooltip: {
          shared: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderRadius: 5,
          shadow: true
        },
        legend: {
          align: 'center' as const,
          verticalAlign: 'bottom' as const,
          layout: 'horizontal' as const,
          itemStyle: {
            fontSize: '12px'
          }
        },
        plotOptions: {
          line: {
            dataLabels: {
              enabled: false
            },
            enableMouseTracking: true,
            lineWidth: 2,
            marker: {
              symbol: 'circle' as const,
              states: {
                hover: {
                  radius: 6
                }
              }
            }
          }
        },
        series: series,
        credits: {
          enabled: false
        },
        responsive: {
          rules: [{
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              legend: {
                layout: 'horizontal' as const,
                align: 'center' as const,
                verticalAlign: 'bottom' as const
              }
            }
          }]
        }
      };

      // Create the chart
      Highcharts.chart(chartRef.current, chartConfig);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px' }}>
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          minHeight: '400px'
        }}
      />
    </div>
  );
};

export default all_data;