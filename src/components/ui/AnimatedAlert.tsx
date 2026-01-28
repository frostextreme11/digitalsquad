import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

interface AnimatedAlertProps {
    message: string
    type: 'success' | 'error'
    isVisible: boolean
    onClose: () => void
}

export default function AnimatedAlert({ message, type, isVisible, onClose }: AnimatedAlertProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose])

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`
              relative pointer-events-auto overflow-hidden
              backdrop-blur-xl border flex items-center gap-4 p-4 rounded-2xl shadow-2xl
              ${type === 'success'
                                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-100 shadow-emerald-500/10'
                                : 'bg-slate-900/90 border-red-500/30 text-red-100 shadow-red-500/10'
                            }
            `}
                    >
                        {/* Ambient Glow */}
                        <div className={`absolute inset-0 opacity-20 bg-gradient-to-r ${type === 'success'
                            ? 'from-emerald-500/0 via-emerald-500/50 to-emerald-500/0'
                            : 'from-red-500/0 via-red-500/50 to-red-500/0'
                            }`} />

                        {/* Glowing Border Animation */}
                        <div className="absolute inset-0 rounded-2xl animate-pulse-slow overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-r ${type === 'success'
                                ? 'from-transparent via-emerald-500/10 to-transparent'
                                : 'from-transparent via-red-500/10 to-transparent'
                                } translate-x-[-100%] animate-[shimmer_2s_infinite]`} />
                        </div>

                        {/* Icon Wrapper */}
                        <div className={`
              relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}
            `}>
                            <div className={`
                absolute inset-0 rounded-full animate-ping opacity-20
                ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}
              `} />
                            {type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold mb-0.5 ${type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {type === 'success' ? 'Berhasil' : 'Gagal Masuk'}
                            </h4>
                            <p className="text-sm opacity-90 truncate">{message}</p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`
                p-1.5 rounded-full transition-colors
                ${type === 'success'
                                    ? 'hover:bg-emerald-500/20 text-emerald-400/70 hover:text-emerald-400'
                                    : 'hover:bg-red-500/20 text-red-400/70 hover:text-red-400'
                                }
              `}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
