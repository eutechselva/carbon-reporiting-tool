import React, { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import {
  WidgetWrapper,
  TitleBar,
  FilterPanel,
  FormField,
  Select,
  Input,
  Label,
  useToast,
} from "uxp/components";
import { IContextProvider } from "./uxp";
import "./AnnualCarbonChart.scss";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

// Emission factors for calculations
const emissionFactors: { [key: string]: number } = {
  "Generator Fuel Consumption": 3.761, // kgCO₂e per litre
  "Refrigerant Leakages/Refilling": 1.0, // kgCO₂e per litre
  "Electricity Consumption – HVAC": 0.412, // kgCO₂e per kWh
};

const AnnualCarbonEmissionWithBaselineComparison: React.FunctionComponent<
  IWidgetProps
> = (props) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState<any>(new Date().getFullYear());
  const [activityName, setActivityName] = useState<string>("");
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);

  // Baseline year
  const baselineYear = 2022;

  // 🔹 Fetch available activities
  const fetchAvailableActivities = async () => {
    try {
      const result = await props.uxpContext?.executeAction(
        "carbon_reporting_80rr",
        "getAllActivities",
        {},
        { json: true }
      );
      setAvailableActivities(result || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    fetchAvailableActivities();
  }, []);

  // 🔹 Fetch activity data
  const fetchActivityData = async () => {
    if (!props.uxpContext) return;

    setLoading(true);
    try {
      const result = await props.uxpContext.executeAction(
        "carbon_reporting_80rr",
        "GetAllData",
        { year: yearFilter, month: null, activityName: activityName },
        { json: true }
      );

      const cleanedData =
        result?.map((row: any) => ({
          activity: row.activity,
          year: row.year,
          month: row.month,
          value: parseFloat(row.value),
        })) || [];

      setActivityData(cleanedData);
    } catch (error: any) {
      console.error("Error loading emission data:", error);
      toast.error("Failed to load activity data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [yearFilter, activityName]);

  // 🔹 Calculate annual emissions by year
  const calculateAnnualEmissions = () => {
    if (activityData.length === 0) return [];

    const yearlyEmissions: { [key: string]: { scope1: number; scope2: number } } =
      {};

    activityData.forEach((item) => {
      const year = item.year.toString();
      if (!yearlyEmissions[year]) {
        yearlyEmissions[year] = { scope1: 0, scope2: 0 };
      }

      const emissionFactor = emissionFactors[item.activity] || 0;
      const calculatedEmission = item.value * emissionFactor;

      const isScope1 =
        item.activity.includes("Generator") ||
        item.activity.includes("Refrigerant");

      if (isScope1) {
        yearlyEmissions[year].scope1 += calculatedEmission;
      } else {
        yearlyEmissions[year].scope2 += calculatedEmission;
      }
    });

    return Object.keys(yearlyEmissions)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((year) => ({
        year: parseInt(year),
        scope1: yearlyEmissions[year].scope1,
        scope2: yearlyEmissions[year].scope2,
        total: yearlyEmissions[year].scope1 + yearlyEmissions[year].scope2,
      }));
  };

  const annualData = calculateAnnualEmissions();
  const baselineData = annualData.find((d) => d.year === baselineYear);
  const baselineValue = baselineData ? baselineData.total : 4000;

  // 🔹 Build chart
  useEffect(() => {
    if (chartRef.current && annualData.length > 0) {
      const years = annualData.map((d) => d.year.toString());
      const scope1Data = annualData.map((d) => d.scope1);
      const scope2Data = annualData.map((d) => d.scope2);

      // constant baseline across all years
      const baselineSeries = years.map(() => baselineValue);

      const chartConfig: Highcharts.Options = {
        chart: {
          type: "column", // vertical stacked
          height: 450,
          backgroundColor: "transparent",
        },
        title: {
          text: "Annual Scope 1 & 2 Carbon Emissions vs Baseline (2022)",
          style: { fontSize: "20px", fontWeight: "bold" },
        },
        xAxis: {
          categories: years,
          title: { text: "Year" },
        },
yAxis: {
  min: 0,
  title: { text: "Emissions (tCO₂e)" },
  plotLines:
    baselineValue > 0
      ? [
          {
            color: "red",
            dashStyle: "Dash",
            width: 2,
            value: baselineValue,
            zIndex: 5,
            label: {
              text: `Baseline 2022: ${baselineValue.toLocaleString()} tCO₂e`,
              align: "right",
              verticalAlign: "bottom",
              style: { color: "red", fontWeight: "bold" },
              y: -5,
            },
          },
        ]
      : [],
},

        plotOptions: {
          column: {
            stacking: "normal",
            dataLabels: {
              enabled: true,
              formatter: function () {
                return this.y && this.y > 0 ? this.y.toLocaleString() : "";
              },
            },
          },
        },
        series: [
          {
            name: "Scope 1",
            data: scope1Data,
            type: "column",
            color: "#1f77b4",
          },
          {
            name: "Scope 2",
            data: scope2Data,
            type: "column",
            color: "#ff7f0e",
          },
          {
            name: "Baseline (2022)",
            data: baselineSeries,
            type: "line",
            color: "red",
            dashStyle: "Dash",
            marker: { enabled: false },
            enableMouseTracking: false,
          },
        ],
        tooltip: {
          shared: true,
          footerFormat: "Total: <b>{point.total}</b> tCO₂e",
        },
        legend: { enabled: true },
        credits: { enabled: false },
      };

      chartInstance.current = Highcharts.chart(chartRef.current, chartConfig);

      // 🔹 Add % change annotations above bars
      if (baselineValue > 0) {
        annualData.forEach((d, i) => {
          const pctChange =
            ((d.total - baselineValue) / baselineValue) * 100 || 0;
          const label = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(
            1
          )}% vs 2022`;

          chartInstance.current?.renderer
            .text(
              label,
              (chartInstance.current.xAxis[0] as any).toPixels(i) + 20,
              (chartInstance.current.yAxis[0] as any).toPixels(d.total) - 10
            )
            .css({ color: "#000", fontSize: "11px", fontWeight: "bold" })
            .add();
        });
      }
    }
  }, [annualData, baselineValue]);

  // 🔹 Activity dropdown options
  const activityOptions = [
    { label: "All Activities", value: "" },
    ...availableActivities.map((a) => ({ label: a, value: a })),
  ];

  return (
    <WidgetWrapper>
      <TitleBar title="Annual Carbon Emissions with Baseline Comparison">
        <FilterPanel
          onClear={() => {
            setYearFilter(null);
            setActivityName("");
          }}
        >
          <FormField>
            <Label>Filter by Year</Label>
            <Input
              type="number"
              value={yearFilter || ""}
              onChange={(val) => setYearFilter(val ? parseInt(val) : null)}
              placeholder="Enter year"
            />
          </FormField>

          <FormField>
            <Label>Filter by Activity</Label>
            <Select
              options={activityOptions}
              selected={activityName}
              onChange={(val) => setActivityName(val)}
              placeholder="Select activity"
            />
          </FormField>
        </FilterPanel>
      </TitleBar>

      <div className="annual-carbon-chart">
        {loading && <div>📊 Loading emission data...</div>}

        {!loading && annualData.length === 0 && (
          <div>📈 No emission data found for selected filters.</div>
        )}

        {!loading && annualData.length > 0 && (
          <div ref={chartRef} className="annual-carbon-chart__chart" />
        )}
      </div>
    </WidgetWrapper>
  );
};

export default AnnualCarbonEmissionWithBaselineComparison;
