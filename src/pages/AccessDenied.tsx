import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, Lock } from 'lucide-react';

const AccessDenied: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative inline-block mb-6"
                >
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                    <ShieldAlert className="w-24 h-24 text-red-500 relative z-10" />
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-0 right-0"
                    >
                        <Lock className="w-8 h-8 text-white/50" />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <h1 className="text-6xl font-bold mb-2 text-white tracking-tight">
                        403
                    </h1>
                    <h2 className="text-2xl font-medium text-red-400 mb-6">Access Denied</h2>

                    <p className="text-slate-400 text-lg mb-8">
                        You don't have permission to access this area. If you believe this is an error, please contact support.
                    </p>

                    <Link
                        to="/"
                        className="group inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-semibold transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20"
                    >
                        <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                        <span>Return Home</span>
                    </Link>
                </motion.div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        </div>
    );
};

export default AccessDenied;
