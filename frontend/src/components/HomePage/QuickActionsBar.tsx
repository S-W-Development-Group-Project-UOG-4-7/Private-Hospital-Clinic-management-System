import React from 'react';
import { Phone, Stethoscope, ShieldCheck, FlaskConical } from 'lucide-react';

const actions = [
  { icon: <Phone className="w-8 h-8 mx-auto mb-2" />, label: 'Emergency Contact' },
  { icon: <Stethoscope className="w-8 h-8 mx-auto mb-2" />, label: 'Find a Doctor' },
  { icon: <ShieldCheck className="w-8 h-8 mx-auto mb-2" />, label: 'Check Insurance' },
  { icon: <FlaskConical className="w-8 h-8 mx-auto mb-2" />, label: 'View Lab Results' },
];

const QuickActionsBar: React.FC = () => {
  return (
    <section className="bg-blue-600 text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {actions.map((action, index) => (
            <button key={index} type="button" className="hover:bg-blue-700 p-4 rounded-lg transition-colors duration-300">
              {action.icon}
              <span className="font-semibold">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActionsBar;
