import { useEffect, useState } from "react";
import { InventoryItem } from "../../types/pharmacist";
import { InventoryService } from "../../services/pharmacist/inventory.service";

const InventoryManagement = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "",
    quantity: 0,
    reorder_level: 0,
    expiry_date: "",
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await InventoryService.getAll();
      setItems(res.data.data);
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await InventoryService.create(form);
    setForm({
      name: "",
      category: "",
      unit: "",
      quantity: 0,
      reorder_level: 0,
      expiry_date: "",
    });
    loadInventory();
  };

  const handleDelete = async (id: number) => {
    await InventoryService.delete(id);
    loadInventory();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

      {/* ADD INVENTORY */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 grid grid-cols-3 gap-4"
      >
        <input
          className="border p-2"
          placeholder="Drug Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border p-2"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <input
          className="border p-2"
          placeholder="Unit (tablet/ml)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
        />
        <input
          type="number"
          className="border p-2"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: Number(e.target.value) })
          }
          required
        />
        <input
          type="number"
          className="border p-2"
          placeholder="Reorder Level"
          value={form.reorder_level}
          onChange={(e) =>
            setForm({ ...form, reorder_level: Number(e.target.value) })
          }
          required
        />
        <input
          type="date"
          className="border p-2"
          value={form.expiry_date}
          onChange={(e) =>
            setForm({ ...form, expiry_date: e.target.value })
          }
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded col-span-3"
        >
          Add Inventory Item
        </button>
      </form>

      {/* INVENTORY TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Expiry</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">{item.expiry_date}</td>
                <td className="border p-2">
                  {item.is_low_stock && (
                    <span className="text-red-600 font-semibold">
                      Low Stock
                    </span>
                  )}
                  {item.is_expiring_soon && (
                    <span className="text-yellow-600 font-semibold ml-2">
                      Expiring Soon
                    </span>
                  )}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InventoryManagement;
