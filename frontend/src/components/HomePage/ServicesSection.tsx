import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, Baby, Bone, Shield, Video } from 'lucide-react';

const services = [
  {
    icon: <Heart className="w-12 h-12" />,
    title: 'Cardiology',
    description: 'Comprehensive heart care with advanced diagnostic and treatment options.',
    image: '/images/cardiology.png',
  },
  {
    icon: <Brain className="w-12 h-12" />,
    title: 'Neurology',
    description: 'Expert neurological care for brain and nervous system disorders.',
    image: '/images/neurology.png',
  },
  {
    icon: <Baby className="w-12 h-12" />,
    title: 'Pediatrics',
    description: 'Specialized care for children from infancy through adolescence.',
    image: '/images/pediatrics.jpg',
  },
  {
    icon: <Bone className="w-12 h-12" />,
    title: 'Orthopedics',
    description: 'Treatment for bone, joint, and muscle conditions and injuries.',
    image: '/images/orthopedics.png',
  },
  {
    icon: <Shield className="w-12 h-12" />,
    title: 'Oncology',
    description: 'Comprehensive cancer care with cutting-edge treatment options.',
    image: '/images/oncology.png',
  },
  {
    icon: <Video className="w-12 h-12" />,
    title: 'Dermatology',
    description: 'Expert skin care and treatment for various dermatological conditions.',
    image: '/images/dermatology.jpg',
  },
];

const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-gray-800 mb-4"
          >
            Our Medical Services
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            We offer a wide range of specialized medical services to meet all your healthcare needs.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="text-green-600 mr-3">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{service.title}</h3>
                </div>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

