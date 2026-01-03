import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Check, Info } from 'lucide-react'

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
    isProcessing?: boolean
    type?: 'danger' | 'warning' | 'info' | 'success'
}

export default function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isProcessing = false,
    type = 'warning'
}: ConfirmationModalProps) {

    const styles = {
        danger: {
            icon: <AlertCircle className="text-red-500" size={24} />,
            bgIcon: 'bg-red-500/10',
            button: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20'
        },
        warning: {
            icon: <AlertCircle className="text-yellow-500" size={24} />,
            bgIcon: 'bg-yellow-500/10',
            button: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 shadow-yellow-500/20'
        },
        info: {
            icon: <Info className="text-blue-500" size={24} />,
            bgIcon: 'bg-blue-500/10',
            button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20'
        },
        success: {
            icon: <Check className="text-green-500" size={24} />,
            bgIcon: 'bg-green-500/10',
            button: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-500/20'
        }
    }

    const currentStyle = styles[type]

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden z-10"
                    >
                        <div className="p-6 text-center space-y-4">
                            <div className={`mx-auto w-12 h-12 rounded-full ${currentStyle.bgIcon} flex items-center justify-center`}>
                                {currentStyle.icon}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">{title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={onCancel}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isProcessing}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${currentStyle.button}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
