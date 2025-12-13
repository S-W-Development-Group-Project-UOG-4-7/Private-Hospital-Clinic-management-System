import React from 'react';
import { Calendar, Video, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Calendar className="w-12 h-12 text-teal-500" />,
    title: 'Online Appointment Booking',
    description: 'Schedule your appointments anytime, anywhere with our easy-to-use online portal.',
  },
  {
    icon: <Video className="w-12 h-12 text-teal-500" />,
    title: 'Telemedicine Consultations',
    description: 'Consult with our expert doctors from the comfort of your home through secure video calls.',
  },
  {
    icon: <FileText className="w-12 h-12 text-teal-500" />,
    title: 'Electronic Health Records',
    description: 'Access your medical history, lab results, and prescriptions securely online.',
  },
  {
    icon: <User className="w-12 h-12 text-teal-500" />,
    title: '24/7 Patient Portal Access',
    description: 'Manage your health information, appointments, and payments through our dedicated patient portal.',
  },
];

const FeaturesGrid: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-800">Your Health, Simplified</h2>
          <p className="mt-4 text-lg text-gray-600">We leverage technology to make healthcare more accessible and convenient for you.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
