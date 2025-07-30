import React, { useEffect, useRef } from "react";
import { IWidgetProps } from "widget-designer/components";
import Highcharts from 'highcharts';

// ESG Carbon Emissions data (calculated from monthly data)
const carbonEmissionsData = [
  // Scope 1 Emissions (Direct emissions from owned/controlled sources)
  { 
    category: "Scope 1", 
    source: "Generator Fuel Consumption", 
    totalCO2e: 577, // Sum of monthly values * emission factor
    color: "#FF6B6B",
    scope: 1
  },
  { 
    category: "Scope 1", 
    source: "Refrigerant Leakages/Refilling", 
    totalCO2e: 1326, // Sum of monthly values * GWP factor
    color: "#FF8E8E",
    scope: 1
  },
  // Scope 2 Emissions (Indirect emissions from purchased energy)
  { 
    category: "Scope 2", 
    source: "Electricity Consumption – HVAC", 
    totalCO2e: 2438, // Sum of monthly kWh * grid emission factor
    color: "#4ECDC4",
    scope: 2
  }
];

// Calculate totals for each scope
const scope1Total = carbonEmissionsData
  .filter(item => item.scope === 1)
  .reduce((sum, item) => sum + item.totalCO2e, 0);

const scope2Total = carbonEmissionsData
  .filter(item => item.scope === 2)
  .reduce((sum, item) => sum + item.totalCO2e, 0);

const totalEmissions = scope1Total + scope2Total;

const ESGDonutChart: React.FunctionComponent<IWidgetProps> = (props) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Prepare data for donut chart
      const scopeData = [
        {
          name: 'Scope 1 Emissions',
          y: scope1Total,
          color: '#FF6B6B',
          description: 'Direct emissions from owned sources'
        },
        {
          name: 'Scope 2 Emissions',
          y: scope2Total,
          color: '#4ECDC4',
          description: 'Indirect emissions from purchased energy'
        }
      ];

      // Detailed breakdown data for inner ring
      const detailedData = carbonEmissionsData.map(item => ({
        name: item.source,
        y: item.totalCO2e,
        color: item.color
      }));

      // Highcharts configuration for ESG donut chart
      const chartConfig: Highcharts.Options = {
        chart: {
          type: 'pie',
          height: 500,
          backgroundColor: 'transparent',
          spacing: [20, 20, 20, 20]
        },
        title: {
          text: 'Annual Carbon Emissions by Scope',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }
        },
        subtitle: {
          text: `Total: ${totalEmissions.toLocaleString()} tCO₂e | ESG Reporting Dashboard`,
          style: {
            fontSize: '14px',
            color: '#7f8c8d',
            fontWeight: 'normal'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#bdc3c7',
          borderRadius: 8,
          shadow: true,
          useHTML: true,
          formatter: function() {
            const percentage = ((this.y / totalEmissions) * 100).toFixed(1);
            return `
              <div style="padding: 8px;">
                <b style="color: ${this.color};">${this.key}</b><br/>
                <strong>${this.y.toLocaleString()} tCO₂e</strong><br/>
                <span style="color: #7f8c8d;">${percentage}% of total emissions</span>
              </div>
            `;
          }
        },
        legend: {
          align: 'right' as const,
          verticalAlign: 'middle' as const,
          layout: 'vertical' as const,
          x: -50,
          y: 0,
          itemStyle: {
            fontSize: '13px',
            fontWeight: 'normal',
            color: '#2c3e50'
          },
          itemHoverStyle: {
            color: '#000'
          },
          symbolRadius: 8,
          symbolHeight: 16,
          symbolWidth: 16
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              distance: 20,
              style: {
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#2c3e50'
              },
              formatter: function() {
                const percentage = ((this.y! / totalEmissions) * 100).toFixed(1);
                return `<b>${this.key}</b><br/>${percentage}%<br/>${this.y!.toLocaleString()} tCO₂e`;
              }
            },
            showInLegend: true,
            borderWidth: 3,
            borderColor: '#ffffff',
            innerSize: '45%',
            size: '75%',
            center: ['40%', '50%'],
            states: {
              hover: {
                halo: {
                  size: 10,
                  opacity: 0.25
                }
              }
            },
            animation: {
              duration: 1500
            }
          }
        },
        series: [{
          name: 'Carbon Emissions',
          type: 'pie',
          data: scopeData.map(item => ({
            name: item.name,
            y: item.y,
            color: item.color,
            dataLabels: {
              enabled: true
            }
          })),
          size: '80%',
          innerSize: '45%'
        }, {
          name: 'Emission Sources',
          type: 'pie',
          data: detailedData,
          size: '40%',
          innerSize: '20%',
          dataLabels: {
            enabled: false
          },
          showInLegend: false
        }] as Highcharts.SeriesPieOptions[],
        credits: {
          enabled: false
        },
        responsive: {
          rules: [{
            condition: {
              maxWidth: 600
            },
            chartOptions: {
              chart: {
                height: 400
              },
              legend: {
                align: 'center' as const,
                verticalAlign: 'bottom' as const,
                layout: 'horizontal' as const,
                x: 0,
                y: 0
              },
              plotOptions: {
                pie: {
                  center: ['50%', '45%'],
                  size: '85%'
                }
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
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '20px', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: '500px',
          minHeight: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}
      />
      
      {/* ESG Summary Cards */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginTop: '20px',
        flexWrap: 'wrap' as const
      }}>
        <div style={{
          flex: 1,
          minWidth: '200px',
          backgroundColor: '#fff5f5',
          border: '2px solid #FF6B6B',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center' as const
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#FF6B6B',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Scope 1 Emissions
          </h4>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 5px 0',
            color: '#2c3e50'
          }}>
            {scope1Total.toLocaleString()} tCO₂e
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#7f8c8d',
            margin: 0
          }}>
            Direct emissions from fuel & refrigerants
          </p>
        </div>

        <div style={{
          flex: 1,
          minWidth: '200px',
          backgroundColor: '#f0fdfc',
          border: '2px solid #4ECDC4',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center' as const
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#4ECDC4',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Scope 2 Emissions
          </h4>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 5px 0',
            color: '#2c3e50'
          }}>
            {scope2Total.toLocaleString()} tCO₂e
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#7f8c8d',
            margin: 0
          }}>
            Indirect emissions from electricity
          </p>
        </div>

        <div style={{
          flex: 1,
          minWidth: '200px',
          backgroundColor: '#f8f9fa',
          border: '2px solid #6c757d',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center' as const
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#6c757d',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Total Emissions
          </h4>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 5px 0',
            color: '#2c3e50'
          }}>
            {totalEmissions.toLocaleString()} tCO₂e
          </p>
          <p style={{ 
            fontSize: '12px', 
            color: '#7f8c8d',
            margin: 0
          }}>
            Combined carbon footprint
          </p>
        </div>
      </div>
    </div>
  );
};

export default ESGDonutChart;