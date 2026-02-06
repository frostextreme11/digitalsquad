import { motion } from 'framer-motion'
import { Gift, Zap } from 'lucide-react'

const bonuses = [
    {
        title: "Rahasia Gelap Jualan Apapun Susah Di Tolak",
        value: "Rp 10.000.000",
        desc: "Teknik copywriting terlarang yang memanipulasi psikologi pembeli agar transfer seketika.",
        gradient: "from-red-600 to-rose-900",
        icon: "🔥"
    },
    {
        title: "Cara Ternak Akun & Buat Mesin Cuan Otomatis",
        value: "Rp 7.000.000",
        desc: "Bikin 1000 pasukan akun sosmed yang bekerja 24 jam mencari uang untuk Anda.",
        gradient: "from-purple-600 to-indigo-900",
        icon: "🤖"
    },
    {
        title: "Rahasia Jual Produk Digital 1 Milyar Pertama Mu",
        value: "Rp 9.000.000",
        desc: "Blueprint rahasia 'Dapur' Digital Squad mencetak omzet miliaran dalam setahun.",
        gradient: "from-amber-500 to-orange-800",
        icon: "💎"
    },
    {
        title: "Gajian Dollar Hanya Dari Email",
        value: "Rp 6.000.000",
        desc: "Cara orang malas dapet gaji dollar cuma modal ngetik email marketing.",
        gradient: "from-emerald-500 to-green-900",
        icon: "💵"
    },
    {
        title: "Akses Landing Page Premium",
        value: "Rp 11.000.000",
        desc: "Landing page yang bikin kamu makin cuan kalo udah join. Siap pakai, konversi tinggi!",
        gradient: "from-cyan-500 to-blue-900",
        icon: "🚀"
    },
    {
        title: "Akses Dashboard Bisnis Digital",
        value: "Rp 15.000.000",
        desc: "Pantau omzet, traffic, dan komisi secara real-time. Kelola bisnis semudah main game.",
        gradient: "from-violet-600 to-indigo-900",
        icon: "💻"
    }
]

export default function BonusProducts() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block bg-red-600 text-white font-bold px-6 py-2 rounded-full mb-6 border border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse"
                    >
                        🚨 SPESIAL BONUS MEMBER BARU
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Bongkar <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Rahasia Senilai 58 Juta</span> Secara GRATIS!
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl">
                        Materi kelas "Dewa" ini biasanya kami jual mahal. Tapi khusus member hari ini, <span className="text-green-400 font-bold underline decoration-wavy">GRATIS 100%</span>.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                    {bonuses.map((bonus, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, type: "spring" }}
                            whileHover={{ y: -10, rotate: -2 }}
                            className="relative group"
                        >
                            {/* Card Container */}
                            <div className="h-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300">

                                {/* Image Placeholder / Gradient Cover */}
                                <div className={`h-48 w-full bg-gradient-to-br ${bonus.gradient} relative flex flex-col items-center justify-center p-6 text-center overflow-hidden`}>
                                    {/* Glass Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative z-10 transform group-hover:scale-110 transition duration-300">
                                        <div className="text-6xl mb-2 filter drop-shadow-xl">{bonus.icon}</div>
                                        <div className="font-bold text-white/20 uppercase tracking-widest text-xs border border-white/20 px-2 py-1 rounded">Private Module</div>
                                    </div>

                                    {/* Lock Icon Overlay - Unlocks on Hover */}
                                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md rounded-full p-2 border border-white/10">
                                        <Gift size={16} className="text-yellow-400 animate-bounce" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-white mb-3 leading-snug min-h-[56px]">
                                        {bonus.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-red-400 font-bold line-through text-sm">{bonus.value}</span>
                                        <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30">
                                            FREE
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {bonus.desc}
                                    </p>
                                </div>

                                {/* Bottom Glow */}
                                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${bonus.gradient}`}></div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-slate-500 italic mb-4">
                        *Hanya tersedia untuk 5 pendaftar hari ini. Besok hangus.
                    </p>
                    <div className="flex justify-center gap-2 animate-pulse">
                        <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 font-bold">Buruan Ambil Sebelum Slot Habis!</span>
                        <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
