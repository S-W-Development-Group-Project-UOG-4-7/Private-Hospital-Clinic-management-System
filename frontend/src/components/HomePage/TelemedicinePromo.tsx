import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const TelemedicinePromo: React.FC = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="md:w-1/2 mb-10 md:mb-0"
          >
            <div className="bg-white p-4 rounded-lg shadow-2xl">
              <img src="/images/telemedicine.jpg" alt="Telemedicine Consultation" className="rounded-lg" />
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="md:w-1/2 md:pl-16"
          >
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6">Quality Care, From Anywhere</h2>
            <p className="text-lg text-gray-600 mb-8">Our telemedicine platform brings expert medical care to you, wherever you are. Get professional advice, diagnoses, and prescriptions without leaving your home.</p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-gray-700">Convenient and time-saving consultations.</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-gray-700">Access to specialists from across the country.</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-gray-700">Secure and confidential video calls.</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <span className="text-gray-700">Prescriptions sent directly to your pharmacy.</span>
              </li>
            </ul>
            <button className="mt-10 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-full transition duration-300">Learn More About Telemedicine</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TelemedicinePromo;
