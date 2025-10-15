import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";

export const useFlowData = () => {
  const dispatch = useDispatch();
  const { data: apiData, loading } = useSelector(
    (state: RootState) => state.gpt
  );

  return {
    dispatch,
    apiData,
    loading,
  };
};

export const useNodeMenu = () => {
  const [nodeMenu, setNodeMenu] = useState<{
    id: string;
    top: number;
    left: number;
    label: string;
    description?: string;
    type: string;
    nodeType: "product" | "transformation";
  } | null>(null);

  return { nodeMenu, setNodeMenu };
};

export const useEdgeMenu = () => {
  const [edgeMenu, setEdgeMenu] = useState<{
    id: string;
    top: number;
    left: number;
    sourceId: string;
    targetId: string;
  } | null>(null);

  return { edgeMenu, setEdgeMenu };
};

export const useEditingNode = () => {
  const [editingNode, setEditingNode] = useState<{
    id: string;
    label: string;
    description: string;
    type: string;
  } | null>(null);

  return { editingNode, setEditingNode };
};

export const useNewNodeModal = () => {
  const [newNodeModal, setNewNodeModal] = useState<{
    parentId: string;
    parentType: "product" | "transformation";
    newNodeType: "product" | "transformation";
  } | null>(null);

  const [newNodeData, setNewNodeData] = useState({
    label: "",
    description: "",
  });

  return { newNodeModal, setNewNodeModal, newNodeData, setNewNodeData };
};
