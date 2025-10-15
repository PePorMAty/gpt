import React from "react";

interface NodeMenuProps {
  nodeMenu: {
    id: string;
    top: number;
    left: number;
    label: string;
    description?: string;
    type: string;
    nodeType: "product" | "transformation";
  };
  onAddNewNode: (
    parentId: string,
    parentType: "product" | "transformation"
  ) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeMenu: React.FC<NodeMenuProps> = ({
  nodeMenu,
  onAddNewNode,
  onEditNode,
  onDeleteNode,
  onClose,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: nodeMenu.top,
        left: nodeMenu.left,
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        minWidth: "200px",
        maxWidth: "300px",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#333" }}>
          {nodeMenu.label}
        </h3>
        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#888" }}>
          Тип: {nodeMenu.type}
        </p>
        {nodeMenu.description && (
          <p
            style={{
              margin: "0",
              fontSize: "14px",
              color: "#666",
              lineHeight: "1.4",
            }}
          >
            {nodeMenu.description}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onAddNewNode(nodeMenu.id, nodeMenu.nodeType)}
          style={{
            background: "#28a745",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "white",
            fontSize: "14px",
          }}
        >
          Добавить связь{" "}
          {nodeMenu.nodeType === "product" ? "Преобразование" : "Продукт"}
        </button>
        <button
          onClick={() => onEditNode(nodeMenu.id)}
          style={{
            background: "#007bff",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "white",
            fontSize: "14px",
          }}
        >
          Редактировать
        </button>
        <button
          onClick={onClose}
          style={{
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Закрыть
        </button>
        <button
          onClick={() => onDeleteNode(nodeMenu.id)}
          style={{
            background: "#ff3b30",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "white",
            fontSize: "14px",
          }}
        >
          Удалить
        </button>
      </div>
    </div>
  );
};
