import React, { useEffect, useState } from "react";
import {
  WidgetWrapper,
  TitleBar,
  FormField,
  Select,
  Input,
  Label,
  Button,
  useToast,
  Modal,
} from "uxp/components";
import { IContextProvider } from "./uxp";
import "./BaselineValueManagement.scss";

export interface IWidgetProps {
  uxpContext?: IContextProvider;
  instanceId?: string;
  uiProps?: any;
}

interface BaselineValue {
  activityName: string;
  year: number;
  value: number;
}

const BaselineValueManagement: React.FunctionComponent<IWidgetProps> = (props) => {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<string[]>([]);
  const [existingBaselines, setExistingBaselines] = useState<BaselineValue[]>([]);
  
  // Form state
  const [activityName, setActivityName] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [value, setValue] = useState<string>("");

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingBaseline, setExistingBaseline] = useState<BaselineValue | null>(null);

  // 📹 Fetch available activities
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
      toast.error("Failed to load activities.");
    }
  };

  // 📹 Fetch existing baseline values
  const fetchExistingBaselines = async () => {
    setLoading(true);
    try {
      const result = await props.uxpContext?.executeAction(
        "carbon_reporting_80rr",
        "getAllBaselines",
        {},
        { json: true }
      );
      setExistingBaselines(result || []);
    } catch (error) {
      console.error("Error fetching baselines:", error);
      setExistingBaselines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableActivities();
    fetchExistingBaselines();
  }, []);

  // 📹 Check if baseline exists (case-insensitive + trimmed activity name, exact year match)
  const checkExistingBaseline = (activity: string, yearToCheck: number): BaselineValue | null => {
    const normalizedActivity = activity.trim().toLowerCase();
    return (
      existingBaselines.find(
        (baseline) =>
          baseline.activityName.trim().toLowerCase() === normalizedActivity &&
          Number(baseline.year) === Number(yearToCheck)
      ) || null
    );
  };

  // 📹 Validate form
  const validateForm = (): string | null => {
    if (!activityName.trim()) {
      return "Please select an activity.";
    }
    if (!year || year < 1900 || year > 2100) {
      return "Please enter a valid year.";
    }
    if (!value.trim() || isNaN(Number(value)) || Number(value) < 0) {
      return "Please enter a valid positive number for the baseline value.";
    }
    return null;
  };

  // 📹 Handle form submission
const handleSubmit = async () => {
  const validationError = validateForm();
  if (validationError) {
    toast.error(validationError);
    return;
  }

  const existing = checkExistingBaseline(activityName, year);
  console.log("Submitting", { activityName, year, value, existing });

  if (existing) {
    // Existing baseline found → confirm with user
    setExistingBaseline(existing);
    setShowConfirmModal(true);
  } else {
    // No existing → safe to insert
    await saveBaseline();
  }
};

  // 📹 Save baseline value
const saveBaseline = async () => {
  setSaving(true);
  try {
    const baselineData = {
      activityName: activityName.trim(),
      year,
      value: Number(value),
    };

    console.log("Calling InsertBaselineValue with:", baselineData);

    await props.uxpContext?.executeAction(
      "carbon_reporting_80rr",
      "InsertBaselineValue",
      baselineData,
      { json: true }
    );

    toast.success("Baseline value saved successfully!");

    resetForm();
    await fetchExistingBaselines();
    closeConfirmModal();
  } catch (error) {
    console.error("Error saving baseline:", error);
    toast.error("Failed to save baseline value. Please try again.");
  } finally {
    setSaving(false);
  }
};

  // 📹 Reset form to initial state
  const resetForm = () => {
    setActivityName("");
    setYear(new Date().getFullYear());
    setValue("");
  };

  // 📹 Close confirmation modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setExistingBaseline(null);
  };

  // 📹 Handle confirmation to update existing baseline
  const handleConfirmUpdate = async () => {
    await saveBaseline();
  };

  // 📹 Handle cancellation of update
  const handleCancelUpdate = () => {
    closeConfirmModal();
    toast.info("Update cancelled. No changes were made.");
  };

  // 📹 Activity dropdown options
  const activityOptions = availableActivities.map((activity) => ({
    label: activity,
    value: activity,
  }));

  return (
    <WidgetWrapper>
      <TitleBar title="Baseline Value Management" />

      <div className="baseline-management">
        {loading && <div className="loading">📊 Loading baseline data...</div>}

        {!loading && (
          <div className="baseline-form">
            <div className="form-section">
              <h3>Add/Update Baseline Value</h3>
              
              <FormField>
                <Label>Activity Name *</Label>
                <Select
                  options={activityOptions}
                  selected={activityName}
                  onChange={(val) => setActivityName(val)}
                  placeholder="Select an activity"
                />
              </FormField>

              <FormField>
                <Label>Year *</Label>
                <div className="year-input-container">
                  <Input
                    type="number"
                    value={year.toString()}
                    onChange={(val) => setYear(val ? parseInt(val) : new Date().getFullYear())}
                    placeholder="Enter year"
                    className="year-input"
                  />
                </div>
              </FormField>

              <FormField>
                <Label>Baseline Value (tCO₂e) *</Label>
                <Input
                  type="text"
                  value={value}
                  onChange={(val) => setValue(val)}
                  placeholder="Enter baseline emission value"
                />
              </FormField>

              <div className="form-actions">
                <Button
                  title="submit"
                  onClick={handleSubmit}
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Baseline"}
                </Button>
                
                <Button
                  title="cancel"
                  onClick={resetForm}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Existing Baselines Table */}
            {existingBaselines.length > 0 && (
              <div className="existing-baselines">
                <h3>Existing Baseline Values</h3>
                <div className="baseline-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Year</th>
                        <th>Value (tCO₂e)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingBaselines.map((baseline, index) => (
                        <tr key={index}>
                          <td>{baseline.activityName}</td>
                          <td>{baseline.year}</td>
                          <td>{baseline.value.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal for Existing Baseline */}
        {showConfirmModal && existingBaseline && (
          <Modal
            show={showConfirmModal}
            onClose={handleCancelUpdate}
            title="⚠️ Baseline Value Already Exists"
          >
            <div className="modal-body">
              <p>
                A baseline value already exists for <strong>{activityName}</strong> in{" "}
                <strong>{year}</strong>:
              </p>
              
              <div className="baseline-comparison">
                <div className="existing-value">
                  <span className="label">Current Value:</span>
                  <span className="value">{existingBaseline.value.toLocaleString()} tCO₂e</span>
                </div>
                <div className="new-value">
                  <span className="label">New Value:</span>
                  <span className="value">{Number(value).toLocaleString()} tCO₂e</span>
                </div>
              </div>
              
              <p className="confirmation-message">
                <strong>Do you want to update the existing baseline value?</strong>
              </p>
              
              <div className="warning-note">
                <small>⚠️ This action will replace the current baseline value permanently.</small>
              </div>
            </div>
            
            <div className="modal-footer">
              <Button
                title="Yes, Update Baseline"
                onClick={handleConfirmUpdate}
                loading={saving}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Updating..." : "Yes, Update"}
              </Button>
              
              <Button
                title="Cancel"
                onClick={handleCancelUpdate}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </WidgetWrapper>
  );
};

export default BaselineValueManagement;
