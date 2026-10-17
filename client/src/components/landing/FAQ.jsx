import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "How does the AI ATS Score actually work?",
      a: "Our AI evaluates the candidate's experience, skills, and context against your specific job description. It doesn't just look for keywords; it understands semantic meaning to assess true competency."
    },
    {
      q: "Will AI introduce bias into our hiring?",
      a: "Unlike humans, our models are intentionally trained to ignore demographic markers (name, age, location) and focus strictly on experience and skillset, actively reducing top-of-funnel bias."
    },
    {
      q: "Can I integrate HirePilot with my existing HR tools?",
      a: "Yes. We offer native integrations with Workday, BambooHR, Gusto, Slack, and Google Workspace. For custom setups, our REST API is fully documented."
    },
    {
      q: "Is candidate data secure?",
      a: "Absolutely. Data is encrypted at rest and in transit. We are SOC2 Type II certified and fully compliant with GDPR and CCPA regulations."
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-gray-800 bg-[#0a0a0a] rounded-lg overflow-hidden transition-colors hover:border-gray-700"
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
              >
                <span className="font-medium text-white">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
              </button>
              
              {openIdx === idx && (
                <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}