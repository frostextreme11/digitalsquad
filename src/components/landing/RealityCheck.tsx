import { motion } from 'framer-motion'
import { AlertCircle, XCircle } from 'lucide-react'

export default function RealityCheck() {
    const problems = [
        "Capek ngelamar kerja tapi ditolak terus?",
        "Gaji numpang lewat doang buat bayar cicilan?",
        "Pengen jualan online tapi gak punya modal jutaan?",
        "Gaptek dan takut ketipu bisnis online bodong?",
    ]

    return (
        <section id="reality-check" className="py-20 bg-slate-950 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                            <AlertCircle size={16} />
                            <span className="text-sm font-bold uppercase tracking-wider">Jujur-jujuran aja...</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Apakah Anda Sedang Mengalami <br />
                            <span className="text-red-500">Masalah Ini?</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {problems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-red-500/30 transition-colors"
                            >
                                <XCircle className="w-8 h-8 text-red-500 shrink-0 mt-1" />
                                <p className="text-lg text-slate-300 font-medium">{item}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-center bg-gradient-to-b from-slate-900 to-slate-900/50 p-8 rounded-3xl border border-indigo-500/30 relative"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950 rounded-full border border-indigo-500/30 flex items-center justify-center text-2xl">
                            💡
                        </div>
                        <h3 className="text-xl md:text-2xl text-white font-semibold mb-4 pt-4">
                            Kami Paham Rasanya.
                        </h3>
                        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                            Karena itu <span className="text-white font-bold">Digital Squad</span> lahir.
                            Kami menciptakan sistem dimana Anda bisa mulai belajar bisnis digital sambil menghasilkan uang
                            <span className="text-indigo-400 font-bold"> tanpa skill khusus</span>,
                            <span className="text-indigo-400 font-bold"> tanpa produk sendiri</span>,
                            dan dengan modal <span className="text-green-400 font-bold">minim.</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-500 text-sm">
                            <span>Platform #1 Untuk Pemula</span>
                            <span className="hidden sm:inline">•</span>
                            <span>100% Bisnis Digital Halal</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
