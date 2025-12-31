import React, { useState, useEffect } from 'react';

// Interfaces for our data types
interface User {
    id: number;
    first_name: string;
    last_name: string;
    roles: { name: string }[];
}

interface Appointment {
    id: number;
    patient: User;
    doctor: User;
    appointment_date: string;
    status: string;
    notes: string;
}

const AppointmentManagement: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<User[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        notes: ''
    });

    // 1. Fetch Data (Appointments + Users for the dropdowns)
    const fetchData = async () => {
        const token = localStorage.getItem('authToken');
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };

        try {
            // A. Get Appointments
            const appResponse = await fetch('http://127.0.0.1:8000/api/appointments', { headers });
            const appData = await appResponse.json();
            if (appData.success) setAppointments(appData.data);

            // B. Get Users (to populate dropdowns)
            const userResponse = await fetch('http://127.0.0.1:8000/api/users', { headers });
            const userData = await userResponse.json();
            
            if (userData.success) {
                // Filter users into lists
                const allUsers: User[] = userData.data;
                setPatients(allUsers.filter(u => u.roles.some(r => r.name === 'patient')));
                setDoctors(allUsers.filter(u => u.roles.some(r => r.name === 'doctor')));
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Handle Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Appointment Scheduled!');
                setShowForm(false);
                fetchData(); // Refresh list
                setFormData({ patient_id: '', doctor_id: '', appointment_date: '', notes: '' });
            } else {
                alert('Error: ' + JSON.stringify(result.message));
            }
        } catch (error) {
            alert('Connection Failed');
        }
    };

    // 3. Handle Cancel
    const handleCancel = async (id: number) => {
        if (!window.confirm("Cancel this appointment?")) return;
        
        const token = localStorage.getItem('authToken');
        await fetch(`http://127.0.0.1:8000/api/appointments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchData();
    };

    return (
        <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Appointment Schedule</h2>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                >
                    {showForm ? 'Close Form' : '+ Book Appointment'}
                </button>
            </div>

            {/* --- BOOKING FORM --- */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 border-l-4 border-purple-500 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                    <div>
                        <label className="block text-sm font-bold mb-1">Select Patient</label>
                        <select className="w-full p-2 border rounded" required
                            value={formData.patient_id}
                            onChange={e => setFormData({...formData, patient_id: e.target.value})}>
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Select Doctor</label>
                        <select className="w-full p-2 border rounded" required
                            value={formData.doctor_id}
                            onChange={e => setFormData({...formData, doctor_id: e.target.value})}>
                            <option value="">-- Choose Doctor --</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Date & Time</label>
                        <input type="datetime-local" className="w-full p-2 border rounded" required
                            value={formData.appointment_date}
                            onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Notes (Optional)</label>
                        <input type="text" className="w-full p-2 border rounded" placeholder="Reason for visit..."
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="col-span-1 md:col-span-2 bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 transition">
                        Confirm Booking
                    </button>
                </form>
            )}

            {/* --- APPOINTMENTS TABLE --- */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-gray-100 text-gray-600 uppercase text-sm">
                            <th className="p-3">Date</th>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Doctor</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(app => (
                            <tr key={app.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{new Date(app.appointment_date).toLocaleString()}</td>
                                <td className="p-3 font-medium">{app.patient?.first_name} {app.patient?.last_name}</td>
                                <td className="p-3 text-blue-600">Dr. {app.doctor?.first_name} {app.doctor?.last_name}</td>
                                <td className="p-3">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                        {app.status}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleCancel(app.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">
                                        Cancel
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {appointments.length === 0 && <div className="text-center p-6 text-gray-500">No appointments scheduled.</div>}
            </div>
        </div>
    );
};

export default AppointmentManagement;