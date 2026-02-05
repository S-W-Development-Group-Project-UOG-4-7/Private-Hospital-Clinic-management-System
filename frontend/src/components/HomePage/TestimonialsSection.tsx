import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Patient',
    content: 'The care I received was exceptional. The doctors were knowledgeable and the staff was incredibly supportive throughout my treatment.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Patient',
    content: 'I\'m impressed by the professionalism and efficiency of this hospital. From diagnosis to recovery, everything was handled perfectly.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Patient',
    content: 'The emergency care team saved my life. Their quick response and expert care made all the difference in my recovery.',
    rating: 5,
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Patient',
    content: 'The telemedicine service was a game-changer for me. I could consult with my doctor from home, which was incredibly convenient.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    role: 'Patient',
    content: 'Outstanding service from start to finish. The medical team was compassionate, and the facilities are top-notch.',
    rating: 5,
  },
  {
    id: 6,
    name: 'James Wilson',
    role: 'Patient',
    content: 'I\'ve been a patient here for years, and I can confidently say this is the best healthcare facility I\'ve ever experienced.',
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-gray-800 mb-4"
          >
            What Our Patients Say
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            Read testimonials from our satisfied patients who have experienced our exceptional care.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-teal-500 mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

