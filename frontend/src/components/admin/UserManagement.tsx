import React, { useState, useEffect } from 'react';

// Define the structure of a User
interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    roles: { name: string }[];
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form Data State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'patient' // Default role
    });

    // 1. Fetch Users from Backend
    const fetchUsers = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/users', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' // <--- CRITICAL FIX
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    // Load users when component opens
    useEffect(() => {
        fetchUsers();
    }, []);

    // 2. Handle Form Submit (Create New User)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json', // <--- PREVENTS THE "<!DOCTYPE" ERROR
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            // If the server returns a 200-299 status code (Success)
            if (response.ok) {
                alert('User created successfully!');
                setShowForm(false); 
                fetchUsers();       
                setFormData({
                    first_name: '', last_name: '', email: '', password: '', role: 'patient'
                });
            } else {
                // If validation failed, showing the actual error message from Laravel
                console.error("Server Error:", result);
                alert('Error: ' + (result.message || JSON.stringify(result)));
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert('Failed to connect to server. Check console for details.');
        }
    };

    // 3. Handle Delete User
    const handleDelete = async (id: number) => {
        if(!window.confirm("Are you sure you want to delete this user?")) return;

        const token = localStorage.getItem('authToken');
        try {
            await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' // <--- CRITICAL FIX
                }
            });
            fetchUsers(); 
        } catch (error) {
            alert("Failed to delete user");
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                >
                    {showForm ? 'Cancel' : '+ Add New User'}
                </button>
            </div>

            {/* --- ADD USER FORM --- */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 border rounded bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" className="p-2 border rounded" required 
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})} />
                    
                    <input type="text" placeholder="Last Name" className="p-2 border rounded" required 
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})} />
                    
                    <input type="email" placeholder="Email" className="p-2 border rounded" required 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})} />
                    
                    <input type="password" placeholder="Password" className="p-2 border rounded" required 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})} />
                    
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold mb-2">Assign Role:</label>
                        <select className="w-full p-2 border rounded" 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button type="submit" className="col-span-1 md:col-span-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition">
                        Create Account
                    </button>
                </form>
            )}

            {/* --- USER LIST TABLE --- */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-gray-100 text-gray-600 uppercase text-sm">
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-3 font-medium">{user.first_name} {user.last_name}</td>
                                <td className="p-3 text-gray-600">{user.email}</td>
                                <td className="p-3">
                                    <span className={`
                                        px-2 py-1 rounded text-xs font-bold uppercase
                                        ${user.roles[0]?.name === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                                        ${user.roles[0]?.name === 'doctor' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${user.roles[0]?.name === 'pharmacist' ? 'bg-orange-100 text-orange-800' : ''}
                                        ${user.roles[0]?.name === 'patient' ? 'bg-green-100 text-green-800' : ''}
                                    `}>
                                        {user.roles[0]?.name || 'No Role'}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {users.length === 0 && (
                    <div className="text-center p-6 text-gray-500">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;