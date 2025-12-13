import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';

interface Service {
  id: number;
  name: string;
  description: string;
  image: string;
}

const ServicesCards: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SERVICES);
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-12">Our Medical Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <div className="py-20 bg-gray-100 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <section id="services" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-800">Our Medical Services</h2>
          <p className="mt-4 text-lg text-gray-600">Comprehensive care across a wide range of specialties.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300"
            >
              <img src={`${service.image}?t=${new Date().getTime()}`} alt={service.name} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <a href="#" className="text-teal-500 hover:text-teal-600 font-semibold">Learn More &rarr;</a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesCards;
