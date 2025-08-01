import React from "react";
import { WidgetWrapper } from "uxp/components";
import { IWidgetProps } from "widget-designer/components";

// Emission factors data
const emissionFactorsData = [
  {
    scope: "Scope 1",
    activity: "Generator Fuel Consumption",
    unit: "litres",
    emissionFactor: 3.761,
    source: "SEFR (Singapore Emission Factors Registry)",
    category: "Direct Combustion",
    description: "Diesel fuel combustion in backup generators"
  },
  {
    scope: "Scope 1", 
    activity: "Refrigerant Leakages/Refilling",
    unit: "litres", 
    emissionFactor: 1.000,
    source: "Carrier Centrifugal Chiller Spec",
    category: "Fugitive Emissions",
    description: "HFC refrigerant leakage and refilling"
  },
  {
    scope: "Scope 2",
    activity: "Electricity Consumption – HVAC", 
    unit: "kWh",
    emissionFactor: 0.412,
    source: "Singapore EMA – Energy Statistics 2023",
    category: "Purchased Electricity",
    description: "Grid electricity for HVAC systems"
  }
];

const ESGEmissionFactorsTable: React.FunctionComponent<IWidgetProps> = (props) => {
  const getScopeColor = (scope: string) => {
    return scope === "Scope 1" ? "#FF6B6B" : "#4ECDC4";
  };

  const getScopeBadgeStyle = (scope: string) => ({
    backgroundColor: getScopeColor(scope),
    color: 'white',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    display: 'inline-block',
    minWidth: '70px',
    textAlign: 'center' as const
  });

  return (
    <WidgetWrapper>
    <div style={{ 
      width: '100%', 
      height: '100%', 
      padding: '20px', 

      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px 12px 0 0',
        padding: '20px',
        borderBottom: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          color: '#2c3e50',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          Emission Factors Reference
        </h2>
        <p style={{
          margin: 0,
          color: '#7f8c8d',
          fontSize: '14px'
        }}>
          Carbon emission factors and data sources for ESG reporting compliance
        </p>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse' as const,
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e9ecef'
            }}>
              <th style={{
                padding: '16px 12px',
                textAlign: 'left' as const,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '13px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Scope
              </th>
              <th style={{
                padding: '16px 12px',
                textAlign: 'left' as const,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '13px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Activity
              </th>
              <th style={{
                padding: '16px 12px',
                textAlign: 'center' as const,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '13px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Unit
              </th>
              <th style={{
                padding: '16px 12px',
                textAlign: 'right' as const,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '13px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Emission Factor<br/>
                <span style={{ fontSize: '11px', fontWeight: 'normal', textTransform: 'none' }}>
                  (tCO₂e per unit)
                </span>
              </th>
              <th style={{
                padding: '16px 12px',
                textAlign: 'left' as const,
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '13px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px'
              }}>
                Data Source
              </th>
            </tr>
          </thead>
          <tbody>
            {emissionFactorsData.map((row, index) => (
              <tr key={index} style={{
                borderBottom: '1px solid #f1f3f4',
                transition: 'background-color 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}>
                <td style={{
                  padding: '16px 12px',
                  verticalAlign: 'top' as const
                }}>
                  <span style={getScopeBadgeStyle(row.scope)}>
                    {row.scope}
                  </span>
                  <div style={{
                    fontSize: '11px',
                    color: '#7f8c8d',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    {row.category}
                  </div>
                </td>
                <td style={{
                  padding: '16px 12px',
                  verticalAlign: 'top' as const
                }}>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    marginBottom: '4px'
                  }}>
                    {row.activity}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    lineHeight: '1.4'
                  }}>
                    {row.description}
                  </div>
                </td>
                <td style={{
                  padding: '16px 12px',
                  textAlign: 'center' as const,
                  verticalAlign: 'middle' as const
                }}>
                  <span style={{
                    backgroundColor: '#e9ecef',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#495057'
                  }}>
                    {row.unit}
                  </span>
                </td>
                <td style={{
                  padding: '16px 12px',
                  textAlign: 'right' as const,
                  verticalAlign: 'middle' as const
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: getScopeColor(row.scope)
                  }}>
                    {row.emissionFactor.toFixed(3)}
                  </span>
                </td>
                <td style={{
                  padding: '16px 12px',
                  verticalAlign: 'top' as const
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#2c3e50',
                    fontWeight: '500',
                    lineHeight: '1.4'
                  }}>
                    {row.source}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Information */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #bbdefb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '16px'
          }}>ℹ️</span>
          <h4 style={{
            margin: 0,
            color: '#1565c0',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ESG Reporting Notes
          </h4>
        </div>
        <ul style={{
          margin: '0',
          paddingLeft: '20px',
          color: '#1976d2',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          <li><strong>Scope 1:</strong> Direct GHG emissions from sources owned or controlled by the organization</li>
          <li><strong>Scope 2:</strong> Indirect GHG emissions from consumption of purchased electricity, heat, or steam</li>
          <li><strong>tCO₂e:</strong> Tonnes of carbon dioxide equivalent - standardized unit for all greenhouse gases</li>
          <li><strong>Data Sources:</strong> All emission factors are from recognized ESG reporting standards and local regulatory bodies</li>
        </ul>
      </div>
    </div>
    </WidgetWrapper>
  );
};

export default ESGEmissionFactorsTable;