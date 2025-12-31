import React, { useState, useEffect } from 'react';

// Define the shape of a Bed
interface Bed {
    id: number;
    bed_number: string;
    is_available: number | boolean; // Handles 0/1 (database) or true/false (frontend)
}

// Define the shape of a Ward
interface Ward {
    id: number;
    name: string;
    type: string;
    beds: Bed[];
}

const BedManagement: React.FC = () => {
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch Wards & Beds from Backend
    const fetchBeds = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/beds', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setWards(data.data);
            }
        } catch (error) {
            console.error("Error fetching beds", error);
        } finally {
            setLoading(false);
        }
    };

    // Load data when component opens
    useEffect(() => {
        fetchBeds();
    }, []);

    // 2. Toggle Bed Status (Free <-> Occupied)
    const toggleBed = async (bedId: number) => {
        const token = localStorage.getItem('authToken');
        
        // Optimistic UI update (Instant color change before server replies)
        setWards(wards.map(w => ({
            ...w,
            beds: w.beds.map(b => b.id === bedId ? { ...b, is_available: !b.is_available } : b)
        })));

        try {
            await fetch(`http://127.0.0.1:8000/api/beds/${bedId}/toggle`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            // Background refresh to ensure data is synced
            fetchBeds(); 
        } catch (error) {
            alert("Failed to update bed status");
            fetchBeds(); // Revert changes if error
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading hospital layout...</div>;

    return (
        <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Hospital Ward Management</h2>

            {wards.length === 0 && (
                <p className="text-gray-500">No wards found. The system will create default wards shortly...</p>
            )}

            {wards.map(ward => (
                <div key={ward.id} className="mb-8 border rounded-lg overflow-hidden shadow-sm">
                    {/* Ward Header */}
                    <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-700">{ward.name}</h3>
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider bg-white px-2 py-1 rounded border">
                                {ward.type}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Available: <span className="font-bold text-green-600">
                                {ward.beds.filter(b => b.is_available).length}
                            </span> / {ward.beds.length}
                        </div>
                    </div>

                    {/* Bed Grid */}
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-gray-50">
                        {ward.beds.map(bed => (
                            <button
                                key={bed.id}
                                onClick={() => toggleBed(bed.id)}
                                className={`
                                    p-4 rounded-lg shadow-sm border-2 transition-all duration-200 flex flex-col items-center transform hover:scale-105
                                    ${bed.is_available 
                                        ? 'border-green-200 bg-green-100 hover:bg-green-200 text-green-800' 
                                        : 'border-red-200 bg-red-100 hover:bg-red-200 text-red-800'}
                                `}
                            >
                                <span className="text-2xl mb-2">{bed.is_available ? '🛏️' : '🏥'}</span>
                                <span className="font-bold">{bed.bed_number}</span>
                                <span className="text-xs uppercase font-bold mt-1">
                                    {bed.is_available ? 'Available' : 'Occupied'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BedManagement;