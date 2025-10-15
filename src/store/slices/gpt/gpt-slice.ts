import { configFile } from "./../../../utils/config";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";

import type { ApiResponse, InitialStateI, InputNode } from "../../../types";

const initialState: InitialStateI = {
  loading: false,
  data: null,
  error: false,
};

// Функция для генерации уникального ID
const generateNodeId = () =>
  `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const gptRequest = createAsyncThunk<ApiResponse, string>(
  "gptReducer/gptRequest",
  async (gptPromt, thunkAPI) => {
    try {
      console.log("Отправка запроса к API...");
      const response = await axios.post(
        configFile.API_URL,
        {
          model: "gpt-4.1",
          input: `${configFile.API_LAYOUT}, вот сам промт - ${gptPromt}`,
          tools: [{ type: "web_search_preview" }],
        },
        {
          headers: {
            Authorization: `Bearer ${configFile.API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Получен ответ от API:",
        response.status,
        response.statusText
      );
      const textResponse = response.data.output[0].content[0].text;
      console.log("Текст ответа:", textResponse.substring(0, 200) + "...");

      const extractAndParseJSON = (text: string) => {
        try {
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
          let jsonString = "";
          if (!jsonMatch || !jsonMatch[1]) {
            console.warn("Не найден JSON блок, пробую найти JSON в тексте...");
            // Пробуем найти JSON без markdown обертки
            const jsonRegex = /{[\s\S]*}/;
            const fallbackMatch = text.match(jsonRegex);
            if (fallbackMatch) {
              jsonString = fallbackMatch[0];
            } else {
              throw new Error("Не найден JSON блок в ответе");
            }
          } else {
            jsonString = jsonMatch[1];
          }

          console.log(
            "Извлеченный JSON:",
            jsonString.substring(0, 200) + "..."
          );

          // объявляем переменную
          if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
          }

          jsonString = jsonString
            .replace(/\/\/.*$/gm, "")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .trim();

          console.log("Очищенный JSON:", jsonString.substring(0, 200) + "...");

          const parsedData = JSON.parse(jsonString);
          console.log(
            "JSON успешно распарсен, структура:",
            Object.keys(parsedData)
          );

          // Проверяем структуру данных
          if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
            console.warn(
              "Некорректная структура данных, nodes не найден или не массив"
            );
            // Пробуем адаптировать данные
            if (Array.isArray(parsedData)) {
              return { nodes: parsedData };
            }
            throw new Error(
              "Некорректная структура JSON: отсутствует nodes array"
            );
          }

          return parsedData;
        } catch (error) {
          console.error("Ошибка при обработке JSON:", error);
          throw new Error(`Не удалось обработать JSON из ответа: ${error}`);
        }
      };

      const jsonData = extractAndParseJSON(textResponse);
      console.log("Данные подготовлены для стейта:", {
        nodesCount: jsonData.nodes.length,
        hasMore: jsonData.has_more,
      });

      return jsonData;
    } catch (error: any) {
      console.error("Ошибка в gptRequest:", error);
      console.error("Детали ошибки:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return thunkAPI.rejectWithValue(error.message || "Неизвестная ошибка");
    }
  }
);

const gptReducer = createSlice({
  name: "gpt",
  initialState,
  reducers: {
    // Обновление узла
    updateNode: (
      state,
      action: PayloadAction<{
        nodeId: string;
        updates: Partial<InputNode>;
      }>
    ) => {
      if (state.data?.nodes) {
        const nodeIndex = state.data.nodes.findIndex(
          (node) => node.id === action.payload.nodeId
        );

        if (nodeIndex !== -1) {
          state.data.nodes[nodeIndex] = {
            ...state.data.nodes[nodeIndex],
            ...action.payload.updates,
          };
        }
      }
    },

    // Добавление нового узла
    addNode: (
      state,
      action: PayloadAction<{
        nodeData: {
          type: "product" | "transformation";
          label: string;
          description?: string;
        };
        parentId?: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { nodeData, parentId } = action.payload;
        const newNodeId = generateNodeId();

        const russianType =
          nodeData.type === "product" ? "Продукт" : "Преобразование";

        // Создаем новый узел с описанием
        const newNode: InputNode = {
          id: newNodeId,
          type: russianType,
          name: nodeData.label,
          description: nodeData.description || "Описание отсутствует", // Добавляем описание
          inputs: [],
          outputs: [],
        };

        // Добавляем новый узел
        state.data.nodes.push(newNode);

        // Если указан родительский узел, создаем связь
        if (parentId) {
          const parentNode = state.data.nodes.find(
            (node) => node.id === parentId
          );

          if (parentNode) {
            // Определяем направление связи в зависимости от типов
            if (
              parentNode.type?.toLowerCase().includes("продукт") &&
              nodeData.type === "transformation"
            ) {
              // Продукт -> Преобразование
              if (!parentNode.outputs) parentNode.outputs = [];
              parentNode.outputs.push(newNodeId);

              if (!newNode.inputs) newNode.inputs = [];
              newNode.inputs.push(parentId);
            } else if (
              parentNode.type?.toLowerCase().includes("преобразование") &&
              nodeData.type === "product"
            ) {
              // Преобразование -> Продукт
              if (!parentNode.outputs) parentNode.outputs = [];
              parentNode.outputs.push(newNodeId);

              if (!newNode.inputs) newNode.inputs = [];
              newNode.inputs.push(parentId);
            }
          }
        }
      }
    },

    // Удаление узла
    deleteNode: (state, action: PayloadAction<string>) => {
      if (state.data?.nodes) {
        state.data.nodes = state.data.nodes.filter(
          (node) => node.id !== action.payload
        );

        // Удаляем все связи, связанные с этим узлом
        state.data.nodes.forEach((node) => {
          // Удаляем из inputs других узлов
          if (node.inputs && Array.isArray(node.inputs)) {
            node.inputs = node.inputs.filter(
              (inputId) => inputId !== action.payload
            );
          }
          // Удаляем из outputs других узлов
          if (node.outputs && Array.isArray(node.outputs)) {
            node.outputs = node.outputs.filter(
              (outputId) => outputId !== action.payload
            );
          }
        });
      }
    },

    // Добавление связи между узлами
    addConnection: (
      state,
      action: PayloadAction<{
        sourceId: string;
        targetId: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { sourceId, targetId } = action.payload;

        // Находим source узел (преобразование) и добавляем выход
        const sourceNode = state.data.nodes.find(
          (node) => node.id === sourceId
        );
        if (
          sourceNode &&
          sourceNode.type?.toLowerCase().includes("преобразование")
        ) {
          if (!sourceNode.outputs) {
            sourceNode.outputs = [];
          }
          if (!sourceNode.outputs.includes(targetId)) {
            sourceNode.outputs.push(targetId);
          }
        }

        // Находим target узел и добавляем вход
        const targetNode = state.data.nodes.find(
          (node) => node.id === targetId
        );
        if (targetNode) {
          if (!targetNode.inputs) {
            targetNode.inputs = [];
          }
          if (!targetNode.inputs.includes(sourceId)) {
            targetNode.inputs.push(sourceId);
          }
        }
      }
    },

    // Удаление связи между узлами
    removeConnection: (
      state,
      action: PayloadAction<{
        sourceId: string;
        targetId: string;
      }>
    ) => {
      if (state.data?.nodes) {
        const { sourceId, targetId } = action.payload;

        // Удаляем выход из source узла
        const sourceNode = state.data.nodes.find(
          (node) => node.id === sourceId
        );
        if (sourceNode && sourceNode.outputs) {
          sourceNode.outputs = sourceNode.outputs.filter(
            (id) => id !== targetId
          );
        }

        // Удаляем вход из target узла
        const targetNode = state.data.nodes.find(
          (node) => node.id === targetId
        );
        if (targetNode && targetNode.inputs) {
          targetNode.inputs = targetNode.inputs.filter((id) => id !== sourceId);
        }
      }
    },

    // Сброс к исходным данным
    resetToInitial: (state, action: PayloadAction<ApiResponse>) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(gptRequest.pending, (state) => {
      console.log("Запрос начат...");
      state.loading = true;
      state.error = false;
    });
    builder.addCase(gptRequest.fulfilled, (state, action) => {
      console.log("Запрос успешен, данные:", action.payload);
      state.data = action.payload;
      state.loading = false;
      state.error = false;
    });
    builder.addCase(gptRequest.rejected, (state, action) => {
      console.error("Запрос отклонен:", action.payload);
      state.loading = false;
      state.error = true;
      // Можно также сохранить сообщение об ошибке
      // state.errorMessage = action.payload as string;
    });
  },
});

export const {
  updateNode,
  addNode,
  deleteNode,
  addConnection,
  removeConnection,
  resetToInitial,
} = gptReducer.actions;

export default gptReducer.reducer;
