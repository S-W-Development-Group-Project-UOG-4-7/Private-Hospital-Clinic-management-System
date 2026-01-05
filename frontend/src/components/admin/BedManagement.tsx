import React, { useState, useEffect } from 'react';

// Simple interface for our data
interface Bed {
    id: number;
    bed_number: string;
    is_occupied: boolean;
    ward_id: number;
    // We can add 'ward' name later if your API sends it
}

const BedManagement: React.FC = () => {
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch from your Laravel Backend
    const fetchBeds = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/beds');
            const data = await response.json();
            if (data.success) {
                setBeds(data.data);
            }
        } catch (error) {
            console.error("Error fetching beds:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBed = async (id: number) => {
        try {
            await fetch(`http://127.0.0.1:8000/api/beds/${id}/toggle`, { method: 'POST' });
            fetchBeds(); // Reload the list instantly
        } catch (error) {
            alert("Failed to update status");
        }
    };

    useEffect(() => {
        fetchBeds();
    }, []);

    if (loading) return <div>Loading Bed Data...</div>;

    return (
        <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Ward & Bed Management</h2>
            
            {/* The Grid of Beds */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {beds.map((bed) => (
                    <div 
                        key={bed.id}
                        onClick={() => toggleBed(bed.id)}
                        className={`
                            h-32 flex flex-col items-center justify-center rounded-lg border-2 cursor-pointer transition-all
                            ${bed.is_occupied 
                                ? 'bg-red-100 border-red-500 text-red-800' 
                                : 'bg-green-100 border-green-500 text-green-800'
                            }
                        `}
                    >
                        <span className="text-2xl font-bold">{bed.bed_number}</span>
                        <span className="text-sm font-semibold uppercase mt-2">
                            {bed.is_occupied ? 'Occupied' : 'Available'}
                        </span>
                    </div>
                ))}
            </div>

            {beds.length === 0 && (
                <div className="text-center p-10 text-gray-500">
                    No beds found. (Did you run the migration?)
                </div>
            )}
        </div>
    );
};

export default BedManagement;