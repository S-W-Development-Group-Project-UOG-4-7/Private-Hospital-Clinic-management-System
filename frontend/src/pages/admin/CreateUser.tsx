import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Define Types
interface Department {
    id: number;
    name: string;
}

const CreateUser: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [errors, setErrors] = useState<any>({});
    
    // Form State
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "doctor", // Default selection
        department_id: "",
    });

    // 1. Fetch Departments (for the dropdown)
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const token = localStorage.getItem('authToken');
                
                // TypeScript Fix: Added <Department[]> to define response type
                const response = await axios.get<Department[]>('http://localhost:8000/api/admin/departments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setDepartments(response.data);
            } catch (error) {
                console.error("Failed to load departments", error);
            }
        };
        fetchDepartments();
    }, []);

    // 2. Handle Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Submit Form (UPDATED TO FIX SERVER ERROR)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); // Reset errors

        // Create a copy of the data
        const payload = { ...formData };

        // Logic: If the role is NOT doctor, ensure department is cleared
        if (payload.role !== 'doctor') {
            payload.department_id = ""; 
        }

        // Logic: Convert empty string "" to null for the backend
        // Laravel databases usually expect NULL for optional foreign keys, not empty strings.
        const submissionData = {
            ...payload,
            department_id: payload.department_id === "" ? null : payload.department_id
        };

        try {
            const token = localStorage.getItem('authToken');
            await axios.post("http://localhost:8000/api/admin/users", submissionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert("User created successfully!");
            navigate("/admin/users"); // Redirect back to list
        } catch (error: any) {
            console.error("Submission Error:", error);
            
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors); // Show validation errors
            } else {
                // Show the specific error message from the server if possible
                const serverMessage = error.response?.data?.message || "Unknown Server Error";
                alert(`Something went wrong: ${serverMessage}`);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4 mb-6">
                    <button 
                        onClick={() => navigate('/admin')} 
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center"
                    >
                        ← Dashboard
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Add New Staff Member</h2>
                        <p className="text-gray-600">Create a new staff account for the hospital</p>
                    </div>
                </div>
                
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" name="first_name" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" name="last_name" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                    </div>
                </div>

                {/* Account Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input type="email" name="email" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                    </div>
                </div>

                {/* Role & Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
                            <option value="admin">Admin</option>
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="pharmacist">Pharmacist</option>
                            <option value="patient">Patient</option>
                        </select>
                    </div>

                    {/* Show Department ONLY if Role is Doctor */}
                    {formData.role === 'doctor' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <select name="department_id" onChange={handleChange} 
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
                                <option value="">Select Department...</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                            {errors.department_id && <p className="text-red-500 text-xs mt-1">{errors.department_id[0]}</p>}
                        </div>
                    )}
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input type="password" name="password_confirmation" onChange={handleChange} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={() => navigate('/admin/users')} 
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button type="submit" 
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition">
                        Create Member
                    </button>
                </div>

            </form>
        </div>
    </div>
</div>
    );
};

export default CreateUser;