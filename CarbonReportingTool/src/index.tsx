import * as React from "react";
import {
    WidgetWrapper,
    TitleBar,
    FilterPanel,
    Button,
    useToast
} from "uxp/components";
import { registerWidget, IContextProvider } from './uxp';
import Papa from 'papaparse';

import './styles.scss';
import all_data from "./all_data";
import BarChartComponent from "./bar_cahrt";

export interface IWidgetProps {
    uxpContext?: IContextProvider,
    instanceId?: string,
    uiProps?: any
}

const LucyPackage = "carbon_reporting_80rr";

const carbon_reporting_80rr: React.FunctionComponent<IWidgetProps> = (props) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [parsedData, setParsedData] = React.useState<any[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [fileName, setFileName] = React.useState<string | null>(null);

    const toast = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<any>) => {
                const jsonData = results.data.map((row: any) => {
                    const cleanedRow: any = {};
                    for (const key in row) {
                        cleanedRow[key] = row[key] === null || row[key] === undefined ? "" : row[key];
                    }
                    return cleanedRow;
                });
                
                console.log("Parsed JSON Data:", jsonData);

                setParsedData(jsonData);
                setFileName(file.name);
            },
            error: (err) => {
                console.error("CSV parsing error:", err);
                toast.error("Failed to parse CSV file");
            }
        });

        // Reset file input so user can re-select the same file again if needed
        e.target.value = '';
    };

    const uploadToLucy = async () => {
        if (!props.uxpContext || !parsedData) return;
        
        setLoading(true);
        try {
            const result = await props.uxpContext.executeAction(
                LucyPackage,
                "InsertCarbonReport",
                { CarbonInputData: parsedData },
                { json: true }
            );

            console.log("Upload result:", result);
            toast.success("Data uploaded successfully!");
            resetState();
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(`Upload failed: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setParsedData(null);
        setFileName(null);
        setLoading(false);
    };

    return (
        <WidgetWrapper>
            <TitleBar title="Carbon Reporting Tool">
                <FilterPanel />
            </TitleBar>
            {!parsedData && (
                <Button
                    title={loading ? "Uploading..." : "Select CSV"}
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                />
            )}

            {parsedData && (
                <div style={{ marginTop: "1rem" }}>
                    <p><strong>File:</strong> {fileName}</p>
                    <p>{parsedData.length} rows parsed. Proceed to upload?</p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Button
                            title={loading ? "Uploading..." : "Upload"}
                            onClick={uploadToLucy}
                            disabled={loading}
                        />
                        <Button
                            title="Cancel"
                            onClick={resetState}
                            disabled={loading}
                    
                        />
                    </div>
                </div> 
            )}

            <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </WidgetWrapper>
    );
};




/**
 * Register as a Widget
 */
registerWidget({
    id: "carbon_reporting_80rr",
    widget: carbon_reporting_80rr,
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