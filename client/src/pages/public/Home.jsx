import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import AiFeatures from "../../components/landing/AiFeatures";
import Features from "../../components/landing/Features";
import HowItWorks from "../../components/landing/HowItWorks";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";
import "../../styles/landing.css";

export default function Home() {
  return (
    <div className="hp-landing">
      <a className="hp-skip" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="w-full max-w-full overflow-x-hidden">
        <Hero />
        <AiFeatures />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
