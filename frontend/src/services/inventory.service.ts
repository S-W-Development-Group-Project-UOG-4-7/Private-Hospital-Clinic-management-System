import { InventoryItem } from "../types/inventory";
import axios from "../utils/axios";

export const InventoryService = {
  // Get all inventory items
  getAll: async (): Promise<InventoryItem[]> => {
    const res = await axios.get("/inventory");
    // Tell TypeScript that res.data is InventoryItem[]
    return res.data as InventoryItem[];
  },

  // Create a new inventory item
  create: async (data: Partial<InventoryItem>): Promise<InventoryItem> => {
    const res = await axios.post("/inventory", data);
    // Assuming Laravel returns { item: InventoryItem }
    return (res.data as { item: InventoryItem }).item;
  },
};
