import { motion } from 'framer-motion'
import { UserPlus, CloudDownload, Wallet } from 'lucide-react'

const steps = [
    {
        icon: UserPlus,
        title: "Daftar & Upgrade",
        desc: "Isi form pendaftaran dan bayar 50rb sekali seumur hidup.",
        color: "from-blue-400 to-blue-600"
    },
    {
        icon: CloudDownload,
        title: "Akses Produk",
        desc: "Download ribuan aset digital premium gratis di member area.",
        color: "from-purple-400 to-purple-600"
    },
    {
        icon: Wallet,
        title: "Cuan Mengalir",
        desc: "Sebar link affiliate atau jual produk, dan tarik komisi kapanpun.",
        color: "from-green-400 to-green-600"
    }
]

export default function HowItWorks() {
    return (
        <section className="py-20 bg-slate-950 border-t border-slate-900 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">Cara Kerjanya?</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Simpel banget, gak pake ribet. Cuma 3 langkah buat mulai ngehasilin duit dari internet.</p>
                </motion.div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {/* Connecting Lines (Desktop Only) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-800 -z-0"></div>
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 -z-0 opacity-50 animate-pulse"></div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                            className="relative z-10 flex flex-col items-center text-center"
                        >
                            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 transform rotate-3 hover:rotate-6 transition duration-300`}>
                                <step.icon size={40} className="text-white drop-shadow-md" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
