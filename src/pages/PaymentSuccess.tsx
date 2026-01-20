import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(4);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger content animation after mount
    const showTimer = setTimeout(() => setShowContent(true), 100);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 4 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/dashboard');
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Aurora Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-teal-500/20 blur-[120px] animate-pulse-glow" />

        {/* Secondary Glow */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-green-400/30 to-emerald-600/30 blur-[80px] animate-float-slow" />

        {/* Tertiary Glow */}
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-teal-400/25 to-cyan-500/25 blur-[100px] animate-float-reverse" />

        {/* Particle Effects */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content Card */}
      <div
        className={`relative z-10 transition-all duration-1000 ease-out ${showContent
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-10 scale-95'
          }`}
      >
        {/* Glass Card */}
        <div className="relative bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-950/80 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-12 max-w-lg mx-4 overflow-hidden shadow-2xl shadow-emerald-500/10">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 rounded-3xl" />

          {/* Animated Border Glow */}
          <div className="absolute inset-0 rounded-3xl border border-emerald-400/20 animate-border-glow" />

          {/* Success Icon Container */}
          <div className="relative flex justify-center mb-8">
            {/* Outer Ring Glow */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40 blur-xl animate-pulse-ring" />

            {/* Middle Ring */}
            <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/30 animate-spin-slow" style={{ top: '8px', left: 'calc(50% - 56px)' }} />

            {/* Success Circle */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-success-pop">
              {/* Inner Glow */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

              {/* Checkmark */}
              <svg
                className={`w-12 h-12 text-white transform transition-all duration-700 delay-300 ${showContent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  className="animate-draw-check"
                />
              </svg>
            </div>
          </div>

          {/* Success Text */}
          <div className="relative text-center space-y-4">
            <h1
              className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-400 to-teal-300 transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            >
              Payment Successful!
            </h1>

            <p
              className={`text-slate-300 text-lg transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            >
              Your transaction has been completed successfully.
            </p>

            <p
              className={`text-slate-400 text-sm transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            >
              Thank you for your purchase! 🎉
            </p>
          </div>

          {/* Animated Glowing Button */}
          <div
            className={`relative mt-10 transition-all duration-700 delay-600 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            {/* Button Outer Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-xl blur-lg opacity-50 animate-button-glow" />

            {/* Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="relative w-full py-4 px-8 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-xl text-white font-semibold text-lg shadow-lg shadow-emerald-500/30 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Button Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

              {/* Button Pulse Ring */}
              <div className="absolute inset-0 rounded-xl animate-button-pulse-ring" />

              <span className="relative flex items-center justify-center gap-3">
                <span>Go to Dashboard</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>
          </div>

          {/* Countdown Indicator */}
          <div
            className={`mt-6 text-center transition-all duration-700 delay-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span>Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-48 h-1 mx-auto bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-progress-bar" />
            </div>
          </div>

          {/* Confetti-like decorations */}
          <div className="absolute -top-4 -left-4 w-3 h-3 bg-emerald-400 rounded-full animate-confetti-1" />
          <div className="absolute -top-2 left-1/4 w-2 h-2 bg-teal-400 rounded-full animate-confetti-2" />
          <div className="absolute -top-6 right-1/4 w-2.5 h-2.5 bg-green-400 rounded-full animate-confetti-3" />
          <div className="absolute -top-3 -right-4 w-2 h-2 bg-cyan-400 rounded-full animate-confetti-4" />
        </div>
      </div>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(-25px) translateX(15px); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(15px) translateX(-10px); }
          50% { transform: translateY(5px) translateX(10px); }
          75% { transform: translateY(20px) translateX(-5px); }
        }
        
        @keyframes particle {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          25% { opacity: 1; transform: translateY(-30px) scale(1); }
          75% { opacity: 0.5; transform: translateY(-80px) scale(0.5); }
          100% { opacity: 0; transform: translateY(-120px) scale(0); }
        }
        
        @keyframes border-glow {
          0%, 100% { box-shadow: inset 0 0 20px rgba(52, 211, 153, 0.1); }
          50% { box-shadow: inset 0 0 40px rgba(52, 211, 153, 0.2); }
        }
        
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes success-pop {
          0% { transform: scale(0) rotate(-45deg); }
          50% { transform: scale(1.2) rotate(5deg); }
          75% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        @keyframes draw-check {
          0% { stroke-dasharray: 30; stroke-dashoffset: 30; }
          100% { stroke-dasharray: 30; stroke-dashoffset: 0; }
        }
        
        @keyframes button-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        
        @keyframes button-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-progress-bar {
          animation: progress-bar 4s ease-out forwards;
        }
        
        @keyframes confetti-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
        }
        
        @keyframes confetti-2 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(-90deg) scale(1.2); opacity: 1; }
        }
        
        @keyframes confetti-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-25px) rotate(120deg); opacity: 1; }
        }
        
        @keyframes confetti-4 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.5; }
          50% { transform: translateY(-18px) rotate(-180deg) scale(1.1); opacity: 1; }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 4s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 8s infinite ease-in-out;
        }
        
        .animate-float-reverse {
          animation: float-reverse 7s infinite ease-in-out;
        }
        
        .animate-particle {
          animation: particle 4s infinite ease-out;
        }
        
        .animate-border-glow {
          animation: border-glow 3s infinite ease-in-out;
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 2s infinite ease-in-out;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s infinite linear;
        }
        
        .animate-success-pop {
          animation: success-pop 0.8s ease-out forwards;
        }
        
        .animate-draw-check {
          animation: draw-check 0.6s ease-out 0.4s forwards;
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
        }
        
        .animate-button-glow {
          animation: button-glow 2s infinite ease-in-out;
        }
        
        .animate-button-pulse-ring {
          animation: button-pulse-ring 2s infinite;
        }
        

        
        .animate-confetti-1 {
          animation: confetti-1 2s infinite ease-in-out;
        }
        
        .animate-confetti-2 {
          animation: confetti-2 2.5s infinite ease-in-out;
        }
        
        .animate-confetti-3 {
          animation: confetti-3 3s infinite ease-in-out;
        }
        
        .animate-confetti-4 {
          animation: confetti-4 2.3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
