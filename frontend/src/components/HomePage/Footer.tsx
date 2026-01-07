import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">PCMS</h3>
            <p className="text-gray-400">Providing world-class healthcare with a compassionate touch. Our commitment is to your well-being.</p>
            <div className="mt-6 flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white"><Facebook /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-white"><Twitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white"><Instagram /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white"><Linkedin /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-white">About Us</a></li>
              <li><a href="/services" className="hover:text-white">Services</a></li>
              <li><a href="/find-doctor" className="hover:text-white">Find a Doctor</a></li>
              <li><a href="/patient-portal" className="hover:text-white">Patient Portal</a></li>
              <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>123 Health St, Wellness City, 12345</li>
              <li>Email: contact@pcms.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Emergency: (123) 456-7899</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">Stay updated with our latest news and health tips.</p>
            <form>
              <div className="flex">
                <input type="email" placeholder="Your Email" className="w-full px-4 py-2 rounded-l-md text-gray-800" />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-r-md">Subscribe</button>
              </div>
            </form>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Private Clinic Management System. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <p className="text-sm text-gray-500">HIPAA Compliant</p>
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-xs">CERT</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
