import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTools } from 'react-icons/fa';

const AssemblyBoardScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 font-sans selection:bg-black selection:text-white">
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 flex items-center gap-2 text-xs font-black text-slate-400 hover:text-black transition-colors uppercase tracking-[0.2em]"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-black text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl animate-bounce">
          <FaTools />
        </div>

        <h1 className="text-3xl font-black text-black tracking-tighter uppercase mb-4">
          Feature Under Construction
        </h1>

        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          We're building something premium for your assembly needs. Stay tuned for a world-class board management experience.
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-10 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default AssemblyBoardScreen;