
import { registerWidget, IContextProvider } from "./uxp";

import "./styles.scss";

import all_data from "./all_data";
import BarChartComponent from "./bar_cahrt";
import ESGDonutChart from "./carbon_emissions";
import ESGEmissionFactorsTable from "./ESGEmissionFactorsTable";
import ESGStackedBarChart from "./ESGStackedBarChart";
import ESGAreaChart from "./ESGAreaChart";
import AnnualCarbonEmissionChart from "./AnnualCarbonEmissionChart";
import CarbonReportingTool from "./upload";
import AnnualCarbonEmissionWithBaselineComparison from "./AnnualCarbonEmissionWithBaselineComparison";
import BaselineValueManagement from "./BaselineValueManagement";






registerWidget({ id: "CarbonReportingTool", widget: CarbonReportingTool });
registerWidget({ id: "all_data", widget: all_data });
registerWidget({ id: "bar_chart", widget: BarChartComponent });
registerWidget({ id: "ESG_Donut_Chart", widget: ESGDonutChart });
registerWidget({ id: "BaselineValueManagement", widget: BaselineValueManagement });
registerWidget({ id: "ESGEmissionFactorsTable", widget: ESGEmissionFactorsTable });
registerWidget({ id: "ESGStackedBarChart", widget: ESGStackedBarChart });
registerWidget({ id: "AnnualCarbonEmissionChart", widget: AnnualCarbonEmissionChart });
registerWidget({ id: "AnnualCarbonEmissionWithBaselineComparison", widget: AnnualCarbonEmissionWithBaselineComparison });
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