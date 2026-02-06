import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Copy, Share2, Wallet, Instagram, Twitter, MessageCircle, Music2 } from 'lucide-react'

export default function SneakPeek() {
    const [animationStep, setAnimationStep] = useState(-1)
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { amount: 0.3, once: false })

    useEffect(() => {
        if (!isInView) {
            setAnimationStep(-1)
            return
        }

        let timeout: any

        const runSequence = async () => {
            // Step 0: Copy (2s duration)
            setAnimationStep(0)
            timeout = setTimeout(() => {
                // Step 1: Share (2s duration)
                setAnimationStep(1)
                timeout = setTimeout(() => {
                    // Step 2: Profit (5s duration)
                    setAnimationStep(2)
                    timeout = setTimeout(() => {
                        // Loop back
                        runSequence()
                    }, 5000)
                }, 2000)
            }, 2000)
        }

        runSequence()

        return () => clearTimeout(timeout)
    }, [isInView])

    const commissions = [
        { amount: 105000, type: "Komisi Pro", time: "Baru saja", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
        { amount: 35000, type: "Komisi Basic", time: "1 menit lalu", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
        { amount: 75000, type: "Komisi Basic", time: "5 menit lalu", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
        { amount: 50000, type: "Komisi Produk", time: "12 menit lalu", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
        { amount: 105000, type: "Komisi Pro", time: "20 menit lalu", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" }
    ]

    return (
        <section ref={containerRef} className="py-20 bg-slate-950 relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Semudah Apa Kerjanya?
                    </h2>
                    <p className="text-slate-400">
                        Gak perlu jago jualan. Sistem kami yang bekerja untuk Anda.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Visual Mockup Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Mobile Phone Frame Mockup */}
                        <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl shadow-blue-900/40">
                            {/* Buttons and Sensors */}
                            <div className="w-[32px] h-[32px] absolute -left-[17px] top-[72px] rounded-l-lg bg-gray-800 shadow-md"></div>
                            <div className="w-[32px] h-[32px] absolute -left-[17px] top-[124px] rounded-l-lg bg-gray-800 shadow-md"></div>
                            <div className="w-[32px] h-[32px] absolute -right-[17px] top-[142px] rounded-r-lg bg-gray-800 shadow-md"></div>

                            {/* Screen Container */}
                            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-950 border-4 border-slate-700/50 relative flex flex-col">
                                {/* Dynamic Island / Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 flex items-center justify-center">
                                    <div className="w-16 h-4 bg-gray-900/50 rounded-full blur-[1px]"></div>
                                </div>

                                {/* Mockup Header (Status Bar) */}
                                <div className="bg-slate-900/80 backdrop-blur-md p-4 pt-10 flex items-center justify-between border-b border-slate-700/50 z-10 sticky top-0">
                                    <div className="flex flex-col">
                                        <div className="text-[10px] text-slate-400">Total Saldo</div>
                                        <div className="text-xl font-bold text-white leading-none">Rp 2.820.000</div>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30">DS</div>
                                </div>

                                {/* Mockup Content Area */}
                                <div className="p-4 flex-1 overflow-visible relative flex flex-col justify-center">
                                    {/* Background Grid */}
                                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                                    <AnimatePresence mode="wait">

                                        {/* STEP 1: COPY LINK */}
                                        {animationStep === 0 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.4 }}
                                                className="w-full"
                                            >
                                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl text-center">
                                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Copy className="text-blue-400" size={24} />
                                                    </div>
                                                    <h3 className="text-white font-bold mb-2">Ambil Link Affiliate</h3>
                                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-600 mb-4 flex items-center justify-between gap-2">
                                                        <span className="text-xs text-slate-300 truncate">digitalsquad.id/ref=namakamu</span>
                                                    </div>
                                                    <motion.button
                                                        animate={{ scale: [1, 0.95, 1] }}
                                                        transition={{ delay: 1, duration: 0.2 }}
                                                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/30"
                                                    >
                                                        Salin Link
                                                    </motion.button>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 1.2 }}
                                                        className="text-green-400 text-xs mt-2 font-medium"
                                                    >
                                                        Link Tersalin!
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* STEP 2: SHARE SOCIAL */}
                                        {animationStep === 1 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.4 }}
                                                className="w-full"
                                            >
                                                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl text-center">
                                                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Share2 className="text-purple-400" size={24} />
                                                    </div>
                                                    <h3 className="text-white font-bold mb-6">Sebar ke Sosmed</h3>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {[
                                                            { name: "WhatsApp", icon: MessageCircle, color: "bg-green-500", delay: 0 },
                                                            { name: "Instagram", icon: Instagram, color: "bg-pink-600", delay: 0.2 },
                                                            { name: "Twitter", icon: Twitter, color: "bg-sky-500", delay: 0.4 },
                                                            { name: "TikTok", icon: Music2, color: "bg-black", delay: 0.6 }
                                                        ].map((social, i) => (
                                                            <motion.div
                                                                key={i}
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ delay: 0.5 + social.delay, type: "spring" }}
                                                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-600 bg-slate-700/50`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full ${social.color} flex items-center justify-center text-white shadow-lg`}>
                                                                    <social.icon size={16} />
                                                                </div>
                                                                <span className="text-[10px] text-slate-300">{social.name}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* STEP 3: PROFIT STREAM */}
                                        {animationStep === 2 && (
                                            <motion.div
                                                key="step3"
                                                variants={{
                                                    hidden: { opacity: 0 },
                                                    show: {
                                                        opacity: 1,
                                                        transition: {
                                                            staggerChildren: 0.4,
                                                            delayChildren: 0.2
                                                        }
                                                    },
                                                    exit: { opacity: 0 }
                                                }}
                                                initial="hidden"
                                                animate="show"
                                                exit="exit"
                                                className="w-full absolute top-0 left-0 p-4 pt-2 h-full overflow-hidden flex flex-col"
                                            >
                                                <motion.div
                                                    variants={{
                                                        hidden: { opacity: 0, y: -20 },
                                                        show: { opacity: 1, y: 0 }
                                                    }}
                                                    className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-4 text-center"
                                                >
                                                    Incoming Commissions
                                                </motion.div>

                                                <div className="space-y-3">
                                                    {commissions.map((item, i) => (
                                                        <motion.div
                                                            key={i}
                                                            variants={{
                                                                hidden: { opacity: 0, x: -50, scale: 0.8 },
                                                                show: { opacity: 1, x: 0, scale: 1 }
                                                            }}
                                                            className={`relative p-3 rounded-2xl border ${item.border} ${item.bg} backdrop-blur-sm shadow-lg`}
                                                        >
                                                            <div className="flex justify-between items-center relative z-10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full ${item.bg} border ${item.border} flex items-center justify-center`}>
                                                                        <Wallet size={18} className={item.color} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-slate-300 font-medium">{item.type}</div>
                                                                        <div className="text-xs text-slate-500">{item.time}</div>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-sm font-bold ${item.color}`}>
                                                                    Rp {item.amount.toLocaleString('id-ID')}
                                                                </div>
                                                            </div>
                                                            <div className={`absolute inset-0 rounded-2xl ${item.bg} blur-md -z-10 opacity-50`}></div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </div>

                                {/* Bottom Nav */}
                                <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-around items-center absolute bottom-0 w-full z-20">
                                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Decoration Blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -z-10"></div>
                    </motion.div>

                    {/* Text Steps Side */}
                    <div className="space-y-8">
                        {[
                            {
                                icon: Copy,
                                title: "1. Ambil Link Khusus Anda",
                                desc: "Login ke dashboard yang sudah disiapkan. Pilih produk yang mau dijual (sudah tersedia ribuan), lalu klik 'Copy Link'.",
                                color: "text-blue-400",
                                bg: "bg-blue-500/10",
                                active: animationStep === 0
                            },
                            {
                                icon: Share2,
                                title: "2. Sebar di Sosmed / WA",
                                desc: "Paste link tersebut di Story WA, Facebook, atau grup keluarga. Kami sediakan materi promosi (kata-kata & gambar) tinggal copas.",
                                color: "text-purple-400",
                                bg: "bg-purple-500/10",
                                active: animationStep === 1
                            },
                            {
                                icon: Wallet,
                                title: "3. Terima Komisi Otomatis",
                                desc: "Saat ada yang klik dan daftar, sistem mencatat itu referensi Anda. Komisi otomatis masuk ke dompet Digital Squad Anda.",
                                color: "text-green-400",
                                bg: "bg-green-500/10",
                                active: animationStep === 2
                            }
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className={`flex gap-4 group rounded-xl p-4 transition-all duration-500 ${step.active ? 'bg-white/5 border border-white/10' : 'border border-transparent'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center shrink-0 border border-slate-700 group-hover:scale-110 transition-transform`}>
                                    <step.icon className={`w-6 h-6 ${step.color}`} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold text-white mb-2 group-hover:${step.color} transition-colors`}>{step.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm md:text-base">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}

                        {/* <div className="pt-6">
                            <button
                                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-2 text-white font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-3 rounded-full transition-all group"
                            >
                                <span>Saya Mau Coba Sekarang</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div> */}
                    </div>
                </div>
            </div>
        </section>
    )
}
