import React, { useEffect, useRef, useState } from "react";
import Highcharts from 'highcharts';
import { WidgetWrapper, TitleBar, FilterPanel, FormField, Select, Input, Label, useToast } from "uxp/components";
import { IContextProvider } from "./uxp";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

// Emission factors for calculations
const emissionFactors: { [key: string]: number } = {
  "Generator Fuel Consumption": 3.761, // tCO₂e per litre
  "Refrigerant Leakages/Refilling": 1.000, // tCO₂e per litre
  "Electricity Consumption – HVAC": 0.412 // tCO₂e per kWh
};

const ESGDonutChart: React.FunctionComponent<IWidgetProps> = (props) => {
  const chartRef = useRef(null);
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [monthFilter, setMonthFilter] = useState<any>(null);
  const [yearFilter, setYearFilter] = useState<any>(new Date().getFullYear()); // Current year as default
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

      console.log("Fetched emission data:", result);
      
      const cleanedData = result?.map((row: any) => ({
        activity: row.activity,
        year: row.year,
        month: row.month,
        value: parseFloat(row.value)
      })) || [];

      setActivityData(cleanedData);
    } catch (error: any) {
      console.error("Error loading emission data:", error);
      toast.error("Failed to load activity data.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate emissions dynamically from API data
  const calculateEmissions = () => {
    if (activityData.length === 0) {
      return { 
        dynamicEmissionData: [], 
        scope1Total: 0, 
        scope2Total: 0, 
        totalEmissions: 0 
      };
    }

    const emissionsByActivity: { [key: string]: number } = {};
    
    // Group and sum values by activity from real API data
    activityData.forEach(item => {
      if (!emissionsByActivity[item.activity]) {
        emissionsByActivity[item.activity] = 0;
      }
      emissionsByActivity[item.activity] += item.value;
    });

    // Apply emission factors to calculate real CO2e emissions
    const dynamicEmissionData = Object.keys(emissionsByActivity).map(activity => {
      const totalActivityValue = emissionsByActivity[activity];
      const emissionFactor = emissionFactors[activity] || 0;
      const calculatedCO2e = totalActivityValue * emissionFactor;
      
      const isScope1 = activity.includes("Generator") || activity.includes("Refrigerant");
      
      return {
        source: activity,
        totalCO2e: calculatedCO2e,
        scope: isScope1 ? 1 : 2,
        category: isScope1 ? "Scope 1" : "Scope 2"
      };
    });

    // Calculate scope totals from dynamic data
    const scope1Total = dynamicEmissionData
      .filter(item => item.scope === 1)
      .reduce((sum, item) => sum + item.totalCO2e, 0);

    const scope2Total = dynamicEmissionData
      .filter(item => item.scope === 2)
      .reduce((sum, item) => sum + item.totalCO2e, 0);

    const totalEmissions = scope1Total + scope2Total;

    return { dynamicEmissionData, scope1Total, scope2Total, totalEmissions };
  };


  // Get calculated emissions (recalculates when activityData changes)
  const { dynamicEmissionData, scope1Total, scope2Total, totalEmissions } = calculateEmissions();

  useEffect(() => {
    fetchActivityData();
  }, [monthFilter, yearFilter, activityName]);

  useEffect(() => {
    if (chartRef.current && dynamicEmissionData.length > 0) {
      // Prepare scope data for outer donut ring
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
      ].filter(item => item.y > 0); // Only show scopes with actual data

      // Prepare detailed data for inner donut ring with distinct colors
      const detailedData = dynamicEmissionData.map((item, index) => ({
        name: item.source,
        y: item.totalCO2e,
        color: item.scope === 1 
          ? (index === 0 ? '#E74C3C' : '#C0392B') // Different reds for Scope 1 activities
          : '#17A2B8' // Different teal for Scope 2 activities
      }));

      // Highcharts configuration for dynamic ESG donut chart
      const chartConfig: Highcharts.Options = {
        chart: {
          type: 'pie',
          height: 450,
          backgroundColor: 'transparent',
          spacing: [20, 20, 20, 20]
        },
        title: {
          text: 'Carbon Emissions by Scope',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }
        },

        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#bdc3c7',
          borderRadius: 8,
          shadow: true,
          useHTML: true,
          formatter: function() {
            const percentage = ((this.y! / totalEmissions) * 100).toFixed(1);
            return `
              <div style="padding: 8px;">
                <b style="color: ${this.color};">${this.key}</b><br/>
                <strong>${this.y!.toFixed(1)} kgCO₂e</strong><br/>
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
                return `<b>${this.key}</b><br/>${percentage}%<br/>${this.y!.toFixed(1)} kgCO₂e`;
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
            enabled: true,
            distance: -30,
            style: {
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white',
              textOutline: '1px black'
            },
            formatter: function() {
              const percentage = ((this.y! / totalEmissions) * 100).toFixed(0);
              return `${percentage}%`;
            }
          },
          showInLegend: false,
          borderWidth: 1,
          borderColor: '#ffffff'
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

      // Create the dynamic chart
      Highcharts.chart(chartRef.current, chartConfig);
    }
  }, [activityData, dynamicEmissionData, scope1Total, scope2Total, totalEmissions]);

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
            <Label>Filter by Month</Label>
            <Select
              options={monthOptions}
              selected={monthFilter}
              onChange={(newMonth) => setMonthFilter(newMonth)}
            />
          </FormField>

          <FormField>
            <Label>Filter by Year</Label>
            <Input
              type="number"
              value={yearFilter}
              onChange={(val) => setYearFilter(parseInt(val) || null)}
            />
          </FormField>

          <FormField>
            <Label>Filter by Activity</Label>
            <Input
              value={activityName}
              onChange={(val) => setActivityName(val)}
              placeholder="Enter activity name"
            />
          </FormField>
        </FilterPanel>
      </TitleBar>

      <div style={{ 
        width: '100%', 
        height: '100%', 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Dynamic ESG Summary Cards - AT THE TOP */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px',
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
              {scope1Total.toFixed(1)} kgCO₂e
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
              {scope2Total.toFixed(1)} kgCO₂e
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
              {totalEmissions.toFixed(1)} kgCO₂e
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
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '20px', 
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
          border: '1px solid #e9ecef'
        }}
      />
      


        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center' as const,
            padding: '40px',
            color: '#7f8c8d',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            Loading emissions data...
          </div>
        )}

        {/* No Data State */}
        {!loading && activityData.length === 0 && (
          <div style={{
            textAlign: 'center' as const,
            padding: '40px',
            color: '#7f8c8d',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            No emission data found for the selected filters.
          </div>
        )}

      </div>
    </WidgetWrapper>
  );
};

export default ESGDonutChart;