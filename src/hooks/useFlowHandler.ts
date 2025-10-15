import { useCallback } from "react";
import {
  useReactFlow,
  type Connection,
  type Edge,
  getConnectedEdges,
} from "@xyflow/react";
import { useDispatch } from "react-redux";
import {
  removeConnection,
  addNode,
  updateNode,
  deleteNode,
} from "../store/slices/gpt/gpt-slice";

export const useFlowHandlers = () => {
  const dispatch = useDispatch();
  const { getNode, deleteElements } = useReactFlow();

  const isValidConnection = useCallback(
    (edge: Connection | Edge) => {
      const connection = edge as Connection;

      if (!connection.source || !connection.target) return false;

      const sourceNode = getNode(connection.source);
      const targetNode = getNode(connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      return (
        (sourceType === "product" && targetType === "transformation") ||
        (sourceType === "transformation" && targetType === "product")
      );
    },
    [getNode]
  );

  const getAvailableNodeType = useCallback(
    (nodeType: "product" | "transformation"): "product" | "transformation" => {
      return nodeType === "product" ? "transformation" : "product";
    },
    []
  );

  const handleSaveNewNode = useCallback(
    (
      newNodeModal: {
        parentId: string;
        parentType: "product" | "transformation";
        newNodeType: "product" | "transformation";
      } | null,
      newNodeData: { label: string; description: string },
      setNewNodeModal: (value: null) => void,
      setNewNodeData: (value: { label: string; description: string }) => void
    ) => {
      if (newNodeModal && newNodeData.label.trim()) {
        dispatch(
          addNode({
            nodeData: {
              type: newNodeModal.newNodeType,
              label: newNodeData.label,
              description: newNodeData.description,
            },
            parentId: newNodeModal.parentId,
          })
        );
        setNewNodeModal(null);
        setNewNodeData({ label: "", description: "" });
      }
    },
    [dispatch]
  );

  const handleSaveNode = useCallback(
    (
      editingNode: {
        id: string;
        label: string;
        description: string;
        type: string;
      } | null,
      setEditingNode: (value: null) => void
    ) => {
      if (editingNode) {
        dispatch(
          updateNode({
            nodeId: editingNode.id,
            updates: {
              name: editingNode.label, // Изменено с "Название" на "name"
              description: editingNode.description, // Изменено с "Описание" на "description"
            },
          })
        );
        setEditingNode(null);
      }
    },
    [dispatch]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string, edges: Edge[], setNodeMenu: (value: null) => void) => {
      const nodeToDelete = getNode(nodeId);
      if (!nodeToDelete) return;

      const connectedEdges = getConnectedEdges([nodeToDelete], edges);
      const edgeIdsToDelete = connectedEdges.map((edge: Edge) => edge.id);

      dispatch(deleteNode(nodeId));

      deleteElements({
        nodes: [{ id: nodeId }],
        edges: edgeIdsToDelete.map((id: string) => ({ id })),
      });

      setNodeMenu(null);
    },
    [getNode, deleteElements, dispatch]
  );

  const handleDeleteEdge = useCallback(
    (
      edgeId: string,
      edges: Edge[],
      setEdges: (edges: (eds: Edge[]) => Edge[]) => void,
      setEdgeMenu: (value: null) => void
    ) => {
      const edge = edges.find((e: Edge) => e.id === edgeId);
      if (edge) {
        dispatch(
          removeConnection({
            sourceId: edge.source,
            targetId: edge.target,
          })
        );

        setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.id !== edgeId));
      }
      setEdgeMenu(null);
    },
    [dispatch]
  );

  return {
    isValidConnection,
    getAvailableNodeType,
    handleSaveNewNode,
    handleSaveNode,
    handleDeleteNode,
    handleDeleteEdge,
  };
};
