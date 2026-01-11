import axios from "axios";
import {
  InventoryItem,
  InventoryStats,
} from "../../types/pharmacist";

/* Create axios instance */
const api = axios.create({
  baseURL: "http://localhost:8000/api", // change if needed
  withCredentials: true,
});

export const InventoryService = {
  getAll() {
    return api.get<{ data: InventoryItem[] }>("/pharmacist/inventory");
  },

  create(data: Partial<InventoryItem>) {
    return api.post<{ data: InventoryItem }>("/pharmacist/inventory", data);
  },

  update(id: number, data: Partial<InventoryItem>) {
    return api.put<{ data: InventoryItem }>(
      `/pharmacist/inventory/${id}`,
      data
    );
  },

  delete(id: number) {
    return api.delete(`/pharmacist/inventory/${id}`);
  },

  stats() {
    return api.get<{ data: InventoryStats }>(
      "/pharmacist/inventory/stats"
    );
  },
};
