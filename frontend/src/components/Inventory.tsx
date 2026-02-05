import React, { useEffect, useState } from "react";
import { InventoryItem } from "../types/inventory";
import { InventoryService } from "../services/inventory.service";



const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [form, setForm] = useState<Partial<InventoryItem>>({
    name: "",
    generic_name: "",
    brand_name: "",
    description: "",
    category: "",
    unit: "",
    quantity: 0,
    reorder_level: 0,
    unit_price: 0,
    selling_price: 0,
    expiry_date: "",
    batch_number: "",
    supplier_id: undefined,
    is_active: true,
  });

  // Load inventory items
  const loadInventory = async () => {
    const data = await InventoryService.getAll();
    setItems(data);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: ["quantity", "reorder_level", "unit_price", "selling_price", "supplier_id"].includes(name)
        ? Number(value)
        : value,
    });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await InventoryService.create(form);
      setForm({
        name: "",
        generic_name: "",
        brand_name: "",
        description: "",
        category: "",
        unit: "",
        quantity: 0,
        reorder_level: 0,
        unit_price: 0,
        selling_price: 0,
        expiry_date: "",
        batch_number: "",
        supplier_id: undefined,
        is_active: true,
      });
      await loadInventory();
      alert("Item added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding item!");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
          <input name="generic_name" value={form.generic_name || ""} onChange={handleChange} placeholder="Generic Name" className="border p-2 rounded" />
          <input name="brand_name" value={form.brand_name || ""} onChange={handleChange} placeholder="Brand Name" className="border p-2 rounded" />
          <input name="description" value={form.description || ""} onChange={handleChange} placeholder="Description" className="border p-2 rounded" />
          <input name="category" value={form.category || ""} onChange={handleChange} placeholder="Category" className="border p-2 rounded" required />
          <input name="unit" value={form.unit || ""} onChange={handleChange} placeholder="Unit" className="border p-2 rounded" required />
          <input type="number" name="quantity" value={form.quantity || 0} onChange={handleChange} placeholder="Quantity" className="border p-2 rounded" required />
          <input type="number" name="reorder_level" value={form.reorder_level || 0} onChange={handleChange} placeholder="Reorder Level" className="border p-2 rounded" />
          <input type="number" name="unit_price" value={form.unit_price || 0} onChange={handleChange} placeholder="Unit Price" className="border p-2 rounded" />
          <input type="number" name="selling_price" value={form.selling_price || 0} onChange={handleChange} placeholder="Selling Price" className="border p-2 rounded" />
          <input type="date" name="expiry_date" value={form.expiry_date || ""} onChange={handleChange} placeholder="Expiry Date" className="border p-2 rounded" />
          <input name="batch_number" value={form.batch_number || ""} onChange={handleChange} placeholder="Batch Number" className="border p-2 rounded" />
          <input type="number" name="supplier_id" value={form.supplier_id || ""} onChange={handleChange} placeholder="Supplier ID" className="border p-2 rounded" />
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Item</button>
      </form>

      {/* Inventory Table */}
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Generic</th>
            <th className="border p-2">Brand</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Reorder Level</th>
            <th className="border p-2">Unit Price</th>
            <th className="border p-2">Selling Price</th>
            <th className="border p-2">Expiry</th>
            <th className="border p-2">Batch</th>
            <th className="border p-2">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr
              key={item.id}
              className={`${item.is_low_stock ? "bg-red-100" : ""} ${item.is_expiring_soon ? "bg-yellow-100" : ""}`}
            >
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.generic_name || "-"}</td>
              <td className="border p-2">{item.brand_name || "-"}</td>
              <td className="border p-2">{item.quantity}</td>
              <td className="border p-2">{item.reorder_level}</td>
              <td className="border p-2">{item.unit_price ?? "-"}</td>
              <td className="border p-2">{item.selling_price ?? "-"}</td>
              <td className="border p-2">{item.expiry_date}</td>
              <td className="border p-2">{item.batch_number || "-"}</td>
              <td className="border p-2">{item.supplier?.name || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
