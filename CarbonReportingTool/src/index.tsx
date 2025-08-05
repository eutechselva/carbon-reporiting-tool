import * as React from "react";
import {
  WidgetWrapper,
  TitleBar,
  Button,
  useToast,
  Modal,
  ActionResponse,
  CRUDComponent
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
  const [showReviewModal, setShowReviewModal] = React.useState(false);

  const toast = useToast();

  const resetState = () => {
    setParsedData(null);
    setFileName(null);
    setLoading(false);
  };

  const downloadEmptySheet = () => {
    const headers = ["activity", "year", "month", "value"];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Empty_Carbon_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        setParsedData(jsonData);
        setFileName(file.name);
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        toast.error("Failed to parse CSV file");
      }
    });
  };

  const uploadToLucy = () => {
    if (!parsedData || !Array.isArray(parsedData)) {
      toast.error("Parsed data is empty or invalid.");
      return;
    }
    setLoading(true);
    try {
      props.uxpContext?.executeAction(
        "carbon_reporting_80rr",
        "InsertCarbonReport",
        { CarbonInputData: JSON.stringify(parsedData) }
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

      <div className="upload-controls">
        <Button title="Download Empty Sheet" onClick={downloadEmptySheet} />
      </div>

      <div
        className={`dropzone ${loading ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("highlight");
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("highlight");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("highlight");
          const file = e.dataTransfer.files?.[0];
          if (file) parseCSVFile(file);
        }}
        onClick={() => {
          if (!loading) fileInputRef.current?.click();
        }}
      >
        {fileName ? (
          <>
            <div className="filename-box">
              <span className="filename">{fileName}</span>
              <button className="remove-file" onClick={(e) => {
                e.stopPropagation();
                resetState();
              }}>✖</button>
            </div>
            <p className="parsed-info">
              ✅ <strong>{parsedData.length}</strong> rows parsed
            </p>
            <div className="action-buttons">
              <Button
                title="Review"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReviewModal(true);
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
          <p className="placeholder-text">
            Drag & drop a CSV file here,<br />or click to select
          </p>
        )}
      </div>

      <Modal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review and Edit CSV Data"
      >
        <div className="modal-body">
          {parsedData && (
            <CRUDComponent
              list={{
                title: "Uploaded Data",
                data: { getData: parsedData },
                columns: Object.keys(parsedData[0] || {}).map(key => ({
                  id: key,
                  label: key
                })),
                defaultPageSize: 10,
              }}
              edit={{
                title: "Edit Record",
                formStructure: [
                  {
                    columns: 1,
                    fields: Object.keys(parsedData[0] || {}).map(key => ({
                      name: key,
                      label: key,
                      type: "text",
                    }))
                  }
                ],
                onSubmit: async (newData: any, oldData: any): Promise<ActionResponse> => {
                  setParsedData((prev: any[]) => prev.map(item => item === oldData ? newData : item));
                  return { status: "done", message: "Record updated" };
                },
                afterSave: () => {}
              }}
              add={{
                title: "Add New Record",
                formStructure: [
                  {
                    columns: 1,
                    fields: Object.keys(parsedData[0] || {}).map(key => ({
                      name: key,
                      label: key,
                      type: "text",
                    }))
                  }
                ],
                onSubmit: async (data: any): Promise<ActionResponse> => {
                  setParsedData((prev: any) => [...prev, data]);
                  return { status: "done", message: "Record added" };
                },
                afterSave: () => {}
              }}
            />
          )}
          <div className="modal-actions">
            <Button
              title="Upload"
              onClick={() => {
                uploadToLucy();
                setShowReviewModal(false);
              }}
            />
            <Button
              title="Cancel"
              onClick={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      </Modal>

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

registerWidget({ id: "CarbonReportingTool", widget: CarbonReportingTool });
registerWidget({ id: "all_data", widget: all_data });
registerWidget({ id: "bar_chart", widget: BarChartComponent });
registerWidget({ id: "ESG_Donut_Chart", widget: ESGDonutChart });
registerWidget({ id: "ESGEmissionFactorsTable", widget: ESGEmissionFactorsTable });
registerWidget({ id: "ESGStackedBarChart", widget: ESGStackedBarChart });
registerWidget({ id: "ESGAreaChart", widget: ESGAreaChart });


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