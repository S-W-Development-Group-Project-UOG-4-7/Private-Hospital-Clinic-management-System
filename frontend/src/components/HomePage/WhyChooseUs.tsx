import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Stethoscope, Zap, HeartHandshake, Users } from 'lucide-react';

const stats = [
  { number: 25000, label: 'Patients Served', suffix: '+' },
  { number: 150, label: 'Expert Doctors', suffix: '+' },
  { number: 98, label: 'Success Rate', suffix: '%' },
];

const advantages = [
    { icon: <Zap className="w-10 h-10 text-white" />, title: 'Advanced Technology', description: 'We use the latest medical technology for accurate diagnoses and effective treatments.' },
    { icon: <Stethoscope className="w-10 h-10 text-white" />, title: 'Experienced Medical Team', description: 'Our team of specialists brings years of experience and dedication to patient care.' },
    { icon: <Users className="w-10 h-10 text-white" />, title: 'Comprehensive Care', description: 'From prevention to treatment, we offer a full spectrum of healthcare services.' },
    { icon: <HeartHandshake className="w-10 h-10 text-white" />, title: 'Patient-Centered Approach', description: 'Your health and comfort are our top priorities. We listen and cater to your needs.' },
];

const WhyChooseUs: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-800">Why Choose Our Clinic?</h2>
          <p className="mt-4 text-lg text-gray-600">Dedicated to providing the best healthcare experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {advantages.map((advantage, index) => (
                <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="bg-teal-500 text-white p-8 rounded-lg shadow-lg text-center"
                >
                    <div className="flex justify-center mb-4">{advantage.icon}</div>
                    <h3 className="text-xl font-bold mb-3">{advantage.title}</h3>
                    <p className="opacity-90">{advantage.description}</p>
                </motion.div>
            ))}
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.3 }}
                viewport={{ once: true }}
                className="bg-gray-100 p-8 rounded-lg shadow-md"
            >
              <h3 className="text-5xl font-extrabold text-teal-500">
                {inView && <CountUp end={stat.number} duration={3} suffix={stat.suffix} />}
              </h3>
              <p className="text-lg text-gray-600 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
