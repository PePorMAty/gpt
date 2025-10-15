// Flow.tsx
import React, { useCallback, useEffect } from "react";
import {
  Background,
  ReactFlow,
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  ConnectionMode,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  applyLayoutToNodes,
  transformApiDataToFlow,
} from "./utils/dataTransformer";
import type { CustomNode, CustomEdge, CustomNodeData } from "./types";
import { ProductNode } from "./components/product-node";
import { TransformationNode } from "./components/transformation-node";

// Hooks
import {
  useFlowData,
  useNodeMenu,
  useEdgeMenu,
  useEditingNode,
  useNewNodeModal,
} from "./hooks/useFlowData";
import { useFlowHandlers } from "./hooks/useFlowHandler";
import { addConnection, removeConnection } from "./store/slices/gpt/gpt-slice";
import {
  EdgeMenu,
  EditNodeModal,
  FlowPanel,
  NewNodeModal,
  NodeMenu,
} from "./components";

const nodeTypes: NodeTypes = {
  product: ProductNode,
  transformation: TransformationNode,
};

const edgeStyles = {
  stroke: "#b1b1b7",
  strokeWidth: 2,
};

export const Flow: React.FC = () => {
  const { apiData, loading, dispatch } = useFlowData();
  const { nodeMenu, setNodeMenu } = useNodeMenu();
  const { edgeMenu, setEdgeMenu } = useEdgeMenu();
  const { editingNode, setEditingNode } = useEditingNode();
  const { newNodeModal, setNewNodeModal, newNodeData, setNewNodeData } =
    useNewNodeModal();

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const { getNode, fitView } = useReactFlow();

  const {
    isValidConnection,
    getAvailableNodeType,
    handleSaveNewNode,
    handleSaveNode,
    handleDeleteNode,
    handleDeleteEdge,
  } = useFlowHandlers();

  // Загрузка и преобразование данных из store
  useEffect(() => {
    if (apiData && apiData.nodes && apiData.nodes.length > 0) {
      console.log("Обнаружены данные в store, начинаю преобразование...");

      try {
        const { nodes: flowNodes, edges: flowEdges } =
          transformApiDataToFlow(apiData);

        const improvedEdges = flowEdges.map((edge) => ({
          ...edge,
          label: undefined,
          style: edgeStyles,
          type: "smoothstep",
          animated: false,
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } =
          applyLayoutToNodes(flowNodes, improvedEdges, "TB");

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        setTimeout(() => fitView(), 100);

        console.log("Данные из store успешно загружены в React Flow:", {
          nodes: layoutedNodes.length,
          edges: layoutedEdges.length,
        });
      } catch (error) {
        console.error("Ошибка преобразования данных из store:", error);
      }
    }
  }, [apiData, setNodes, setEdges, fitView]);

  // Функция для открытия модалки добавления нового узла
  const handleAddNewNode = useCallback(
    (parentId: string, parentType: "product" | "transformation") => {
      const newNodeType = getAvailableNodeType(parentType);
      setNewNodeModal({
        parentId,
        parentType,
        newNodeType,
      });
      setNewNodeData({
        label: "",
        description: "",
      });
      setNodeMenu(null);
    },
    [getAvailableNodeType]
  );

  // Функция для отмены создания нового узла
  const handleCancelNewNode = useCallback(() => {
    setNewNodeModal(null);
    setNewNodeData({ label: "", description: "" });
  }, []);

  // Функция для начала редактирования узла
  const handleEditNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (node) {
        const nodeData = node.data as CustomNodeData;
        const originalNode = apiData?.nodes.find((n) => n.id === node.id);

        setEditingNode({
          id: nodeId,
          label: nodeData.label,
          description: nodeData.description || "",
          type: originalNode?.type || "",
        });
        setNodeMenu(null);
      }
    },
    [getNode, apiData]
  );

  // Функция для отмены редактирования
  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
  }, []);

  // Обработчик создания связей
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) {
        console.log("Недопустимая связь");
        return;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: edgeStyles,
            label: undefined,
          },
          eds
        )
      );

      if (params.source && params.target) {
        dispatch(
          addConnection({
            sourceId: params.source,
            targetId: params.target,
          })
        );
      }
    },
    [setEdges, dispatch, isValidConnection]
  );

  // Обработчик клика по связи
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setEdgeMenu({
      id: edge.id,
      top: event.clientY + 10,
      left: event.clientX + 10,
      sourceId: edge.source,
      targetId: edge.target,
    });
    setNodeMenu(null);
  }, []);

  // Обработчик удаления связей через изменения
  const onEdgesChangeCustom = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === "remove") {
          const edge = edges.find((e) => e.id === change.id);
          if (edge) {
            dispatch(
              removeConnection({
                sourceId: edge.source,
                targetId: edge.target,
              })
            );
          }
        }
      });

      onEdgesChange(changes);
    },
    [edges, onEdgesChange, dispatch]
  );

  const onLayout = useCallback(
    (direction: "TB" | "LR") => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayoutToNodes(
        nodes,
        edges,
        direction
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      setTimeout(() => fitView(), 100);
    },
    [nodes, edges, setNodes, setEdges, fitView]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as CustomNodeData;
      const originalNode = apiData?.nodes.find((n) => n.id === node.id);

      setNodeMenu({
        id: node.id,
        top: event.clientY + 10,
        left: event.clientX + 10,
        label: nodeData.label,
        description: nodeData.description,
        type: originalNode?.type || "",
        nodeType: node.type as "product" | "transformation",
      });
      setEdgeMenu(null);
    },
    [apiData]
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div>Загрузка данных из GPT...</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
        onEdgesChange={onEdgesChangeCustom as (changes: EdgeChange[]) => void}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => {
          setNodeMenu(null);
          setEdgeMenu(null);
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodesDraggable={true}
        nodeTypes={nodeTypes}
        fitView
        maxZoom={10}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: edgeStyles,
          animated: false,
          label: undefined,
        }}
        elevateEdgesOnSelect={true}
        elevateNodesOnSelect={true}
        selectNodesOnDrag={false}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        isValidConnection={isValidConnection}
      >
        <FlowPanel
          onLayout={onLayout}
          nodesCount={nodes.length}
          edgesCount={edges.length}
          hasApiData={!!apiData}
        />
        <Background />

        {/* Меню узла */}
        {nodeMenu && (
          <NodeMenu
            nodeMenu={nodeMenu}
            onAddNewNode={handleAddNewNode}
            onEditNode={handleEditNode}
            onDeleteNode={(nodeId) =>
              handleDeleteNode(nodeId, edges, setNodeMenu)
            }
            onClose={() => setNodeMenu(null)}
          />
        )}

        {/* Меню связи */}
        {edgeMenu && (
          <EdgeMenu
            edgeMenu={edgeMenu}
            onDeleteEdge={(edgeId) =>
              handleDeleteEdge(edgeId, edges, setEdges, setEdgeMenu)
            }
            onClose={() => setEdgeMenu(null)}
          />
        )}

        {/* Модальное окно добавления нового узла */}
        {newNodeModal && (
          <NewNodeModal
            newNodeModal={newNodeModal}
            newNodeData={newNodeData}
            onSave={() =>
              handleSaveNewNode(
                newNodeModal,
                newNodeData,
                setNewNodeModal,
                setNewNodeData
              )
            }
            onCancel={handleCancelNewNode}
            onDataChange={setNewNodeData}
          />
        )}

        {/* Модальное окно редактирования */}
        {editingNode && (
          <EditNodeModal
            editingNode={editingNode}
            onSave={() => handleSaveNode(editingNode, setEditingNode)}
            onCancel={handleCancelEdit}
            onDataChange={(data) =>
              setEditingNode((prev) => (prev ? { ...prev, ...data } : null))
            }
          />
        )}
      </ReactFlow>
    </div>
  );
};
