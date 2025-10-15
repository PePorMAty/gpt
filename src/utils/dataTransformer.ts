import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import {
  type CustomNode,
  type CustomEdge,
  type CustomNodeData,
  type ApiResponse,
} from "../types";

export function transformApiDataToFlow(apiData: ApiResponse): {
  nodes: CustomNode[];
  edges: CustomEdge[];
} {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  console.log(
    "Начало преобразования данных, всего элементов:",
    apiData.nodes.length
  );

  // Создаем узлы
  apiData.nodes.forEach((item, index) => {
    // Улучшенная логика определения типа узла
    let nodeType: "product" | "transformation";

    if (item.type.toLowerCase().includes("преобразование")) {
      nodeType = "transformation";
    } else if (item.type.toLowerCase().includes("продукт")) {
      nodeType = "product";
    } else {
      // Если тип не распознан, определяем по наличию inputs/outputs
      const hasInputs = item.inputs && item.inputs.length > 0;
      const hasOutputs = item.outputs && item.outputs.length > 0;

      if (hasInputs || hasOutputs) {
        nodeType = "transformation";
      } else {
        nodeType = "product";
      }

      console.warn(
        `Неизвестный тип узла: "${item.type}", определен как: ${nodeType}`
      );
    }

    const nodeData: CustomNodeData = {
      label: item.name,
      description: item.description || "Описание отсутствует", // Используем описание из API
      originalData: item,
    };

    const node: CustomNode = {
      id: item.id,
      type: nodeType,
      position: { x: 0, y: index * 100 },
      data: nodeData,
      draggable: true,
    };

    nodes.push(node);
  });

  // Создаем связи на основе inputs и outputs
  apiData.nodes.forEach((item) => {
    // Обрабатываем входы преобразования
    if (item.inputs && Array.isArray(item.inputs)) {
      item.inputs.forEach((inputId, index) => {
        const sourceNodeExists = nodes.some((node) => node.id === inputId);
        const targetNodeExists = nodes.some((node) => node.id === item.id);

        if (sourceNodeExists && targetNodeExists) {
          const edge: CustomEdge = {
            id: `${inputId}-${item.id}-input-${index}`,
            source: inputId,
            target: item.id,
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: {
              stroke: "#b1b1b7",
              strokeWidth: 2,
            },
          };
          edges.push(edge);
        }
      });
    }

    // Обрабатываем выходы преобразования
    if (item.outputs && Array.isArray(item.outputs)) {
      item.outputs.forEach((outputId, index) => {
        const sourceNodeExists = nodes.some((node) => node.id === item.id);
        const targetNodeExists = nodes.some((node) => node.id === outputId);

        if (sourceNodeExists && targetNodeExists) {
          const edge: CustomEdge = {
            id: `${item.id}-${outputId}-output-${index}`,
            source: item.id,
            target: outputId,
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: {
              stroke: "#b1b1b7",
              strokeWidth: 2,
            },
          };
          edges.push(edge);
        }
      });
    }
  });

  console.log(
    "Преобразование завершено. Узлы:",
    nodes.length,
    "Связи:",
    edges.length
  );

  return { nodes, edges };
}

export function applyLayoutToNodes(
  nodes: CustomNode[],
  edges: CustomEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: CustomNode[]; edges: CustomEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  const isHorizontal = direction === "LR";

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
