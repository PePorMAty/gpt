import React from "react";
import { Panel } from "@xyflow/react";

interface FlowPanelProps {
  onLayout: (direction: "TB" | "LR") => void;
  nodesCount: number;
  edgesCount: number;
  hasApiData: boolean;
}

export const FlowPanel: React.FC<FlowPanelProps> = ({
  onLayout,
  nodesCount,
  edgesCount,
  hasApiData,
}) => {
  return (
    <Panel position="top-right">
      <button
        onClick={() => onLayout("TB")}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          margin: "4px",
        }}
      >
        Вертикальный layout
      </button>
      <button
        onClick={() => onLayout("LR")}
        style={{
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          margin: "4px",
        }}
      >
        Горизонтальный layout
      </button>
      <div
        style={{
          background: "white",
          padding: "8px",
          borderRadius: "4px",
          fontSize: "12px",
          float: "left",
        }}
      >
        <div>Узлы: {nodesCount}</div>
        <div>Связи: {edgesCount}</div>
        <div>API данные: {hasApiData ? "✓" : "✗"}</div>
      </div>
    </Panel>
  );
};
