import React from 'react';
import { motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "HirePilot cut our time-to-hire by 60%. The AI resume parsing is frighteningly accurate, catching details human recruiters missed.",
      author: "Sarah Jenkins",
      role: "VP of People, TechFlow",
      initials: "SJ"
    },
    {
      quote: "We used to drown in 500+ applications per role. Now, I log in and look at the top 15 candidates ranked by ATS score. It's magic.",
      author: "David Chen",
      role: "Founder, NovaHQ",
      initials: "DC"
    },
    {
      quote: "The automated outreach features alone justify the cost. Candidates constantly compliment our 'highly personalized' recruitment emails.",
      author: "Elena Rodriguez",
      role: "Lead Technical Recruiter",
      initials: "ER"
    }
  ];

  return (
    <section className="py-24 bg-[#050505] border-y border-gray-900 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-[#4F46E5]/5 rounded-full blur-[100px]"></div>
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Loved by recruiting teams</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-8 rounded-2xl bg-[#0a0a0a] border border-gray-800 flex flex-col justify-between"
            >
              <div className="mb-8 text-gray-300 italic">
                "{t.quote}"
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#06B6D4] flex items-center justify-center text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{t.author}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}