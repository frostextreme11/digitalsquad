import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock } from 'lucide-react';

const Maintenance: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] animate-pulse-slow" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex mb-8 p-6 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                        <Wrench className="w-12 h-12 text-amber-500" />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                        Under Maintenance
                    </h1>

                    <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
                        We're currently updating our system to bring you a better experience. We'll be back shortly.
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Estimated return: Soon</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Maintenance;
