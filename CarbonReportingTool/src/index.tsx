import * as React from "react";
import {
  WidgetWrapper,
  TitleBar,
  FilterPanel,
  Button,
  useToast
} from "uxp/components";
import { registerWidget, IContextProvider } from "./uxp";
import Papa from "papaparse";

import "./styles.scss";
import all_data from "./all_data";
import BarChartComponent from "./bar_cahrt";
import ESGDonutChart from "./carbon_emissions";
import ESGEmissionFactorsTable from "./ESGEmissionFactorsTable";
import ESGStackedBarChart from "./ESGStackedBarChart";
import ESGAreaChart from "./ESGAreaChart";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

const CarbonReportingTool: React.FunctionComponent<IWidgetProps> = (props) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const toast = useToast();

  const resetState = () => {
    setParsedData(null);
    setFileName(null);
    setLoading(false);
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const jsonData = results.data.map((row: any) => {
          const cleanedRow: any = {};
          for (const key in row) {
            cleanedRow[key] = row[key] ?? "";
          }
          return cleanedRow;
        });
        console.log("parsed data",jsonData)
        console.log("parse data type",typeof(jsonData))
        setParsedData(   jsonData);
        setFileName(file.name);
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        toast.error("Failed to parse CSV file");
      }
    });
  };

  const uploadToLucy =  () => {

    // if (!props.uxpContext || !parsedData) return;
    if (!parsedData || !Array.isArray(parsedData)) {
        toast.error("Parsed data is empty or invalid.");
        return;
      }
    setLoading(true);
    debugger;
    try {
      const result = props.uxpContext.executeAction(
        "carbon_reporting_80rr", // Backend model name remains
        "InsertCarbonReport",
        { CarbonInputData: JSON.stringify(parsedData)   },
       
      );

      toast.success("Data uploaded successfully!");
      resetState();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WidgetWrapper>
      <TitleBar title="Bulk Data Upload" />
  
      <div
        className={`dropzone ${loading ? "disabled" : ""}`}
        style={{
          maxWidth: '600px',
          width: '90%',
          margin: '5% auto',
          border: '2px dashed #ccc',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
          textAlign: 'center',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'border-color 0.3s ease',
          cursor: loading ? 'not-allowed' : 'pointer',
          position: 'relative'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#0078d4';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#ccc';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#ccc';
          const file = e.dataTransfer.files?.[0];
          if (file) parseCSVFile(file);
        }}
        onClick={() => {
          if (!loading) fileInputRef.current?.click();
        }}
      >
        {fileName ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              background: '#e6f7ff',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #91d5ff',
              marginBottom: '0.5rem',
              maxWidth: '100%',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px'
              }}>{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#ff4d4f'
                }}
                title="Remove file"
              >
                ✖
              </button>
            </div>
  
            <p style={{
              marginBottom: '1.5rem',
              fontSize: '14px',
              color: '#555'
            }}>
              ✅ <strong>{parsedData.length}</strong> rows parsed
            </p>
  
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap"
            }}>
              <Button
                title={loading ? "Uploading..." : "Upload"}
                onClick={(e) => {
                  e.stopPropagation();
                  uploadToLucy();
                }}
                disabled={loading}
              />
              <Button
                title="Cancel"
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <p style={{ color: '#888', fontSize: '14px' }}>
            Drag & drop a CSV file here,<br />or click to select
          </p>
        )}
      </div>
  
      <input
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) parseCSVFile(file);
          e.target.value = "";
        }}
      />
    </WidgetWrapper>
  );
  
  
};



/**
 * Register as a Widget
 */
registerWidget({
    id: "CarbonReportingTool",
    widget: CarbonReportingTool,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "all_data",
    widget: all_data,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "bar_chart",
    widget: BarChartComponent,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "ESG_Donut_Chart",
    widget: ESGDonutChart,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "ESGEmissionFactorsTable",
    widget: ESGEmissionFactorsTable,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "ESGStackedBarChart",
    widget: ESGStackedBarChart,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

registerWidget({
    id: "ESGAreaChart",
    widget: ESGAreaChart,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    }
});

/**
 * Register as a Sidebar Link
 */
/*
registerLink({
    id: "CarbonReportingTool",
    label: "CarbonReportingTool",
    // click: () => alert("Hello"),
    component: CarbonReportingToolWidget
});
*/

/**
 * Register as a UI
 */

/*
registerUI({
   id:"CarbonReportingTool",
   component: CarbonReportingToolWidget
});
*/


/**
 * Register as a Widget template
 * This will enable this widget to be edited through the designer
 */

/**
registerCustomWidgetTemplate({
    id: "CarbonReportingTool", // use all lowercase letters
    name: 'CarbonReportingTool',
    description: 'Tempalte Description',
    template: CarbonReportingToolWidget,
    moduleId: BundleConfig.id,
    complexity: 'advanced',
    icon: ['fas', 'list'],
    expectedSchema: 'dictionary-array'
});
*/


/**
 * Enable localization
 *
 * This will enable the localization
 *
 * you can use uxpContext.$L() function
 *
 * Ex: Assume you  have a localization message in localization json
 *
 * ```
 * // localization.json
 *
 * {
 *      "uxp.my-widget.title": {
 *          "en": "This is my widget" // english translation,
 *          "ar": "<arabic tranlation >",
 *          ... here goes other translations
 *      }
 * }
 *
 * ```
 *
 *
 * thne in your widget
 *
 * ```
 * // your widget
 *
 * return <WidgetWrapper>
 *      <div class='title'>
 *          {props.uxpContext.$L('uxp.my-widget.title')}
 *      </div>
 *  </WidgetWrapper>
 *
 * ```
 *
 * /// you can have parameters as well
 * // we use `$` mark to identify params
 * // Ex: $name, $location
 *
 * ```
 * // localization.json
 *
 * {
 *      ...
 *      "uxp.my-widget.user-welcom-msg":{
 *          "en": "$userName welcome to my widget"
 *      }
 * }
 * ```
 *
 * in widget
 *
 * ```
 *      ...
 *      <div> {props.uxpContext.$L('uxp.my-widget.user-welcom-msg', {userName: "Jane Doe"})} </div>
 * ```
 *
 *
 */

// enableLocalization()