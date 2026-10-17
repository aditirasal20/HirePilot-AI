import React from 'react';

export default function TrustedCompanies() {
  const companies = [
    "ACME Corp", "GlobalTech", "Nexus Industries", "Vanguard AI", "Stark Solutions", "Wayne Enterprises"
  ];

  return (
    <section className="py-10 border-y border-gray-900/50 bg-[#050505]">
      <div className="container mx-auto px-6 max-w-7xl text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-8">
          Trusted by innovative teams worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {companies.map((company, index) => (
            <div key={index} className="text-xl font-bold text-gray-400 font-serif">
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}