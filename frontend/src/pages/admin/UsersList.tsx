import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// Define the shape of a User
interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    roles: { name: string }[];
    department?: { name: string };
}

const UsersList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleDelete = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`http://localhost:8000/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Remove user from state
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get<User[]>('http://localhost:8000/api/admin/users', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Staff Data...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <Link 
                        to="/admin" 
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center"
                    >
                        ← Dashboard
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                        <p className="text-gray-600">View and manage all hospital users</p>
                    </div>
                </div>
                <Link to="/admin/users/create" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition">
                    + Add New Staff
                </Link>
            </div>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name / Username</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold uppercase">
                                            {user.first_name[0]}{user.last_name[0]}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-gray-900 font-medium">{user.first_name} {user.last_name}</p>
                                            <p className="text-gray-500 text-xs">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.roles[0]?.name === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                          user.roles[0]?.name === 'doctor' ? 'bg-green-100 text-green-800' : 
                                          'bg-gray-100 text-gray-800'}`}>
                                        {user.roles[0]?.name ? user.roles[0].name.toUpperCase() : "NO ROLE"}
                                    </span>
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm">
                                    {user.department ? (
                                        <span className="text-gray-700">{user.department.name}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">General</span>
                                    )}
                                </td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">{user.email}</td>
                                <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                    <button 
                                        onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                                        className="text-red-600 hover:text-red-900 font-medium"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersList;