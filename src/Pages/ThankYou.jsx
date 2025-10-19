import React from "react";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0a0a]">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-[#e11d48]" /> {/* primary red */}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#e11d48] to-[#f87171]">
          Thank You!
        </h1>
        <p className="text-[#cbd5e1] text-lg mb-8">
          Your message has been received. I'll get back to you as soon as possible.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#e11d48] to-[#f87171] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#e11d48]/30 active:scale-[0.98]"
        >
          Back to Home
        </Link>
      </div>
    </div>

  );
};

export default ThankYouPage;