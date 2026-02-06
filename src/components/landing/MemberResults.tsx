import { motion } from 'framer-motion'

const memberResults = [
    "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/pamer_saldo_1.jpg",
    "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/pamer_saldo_2.jpg",
    "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/pamer_saldo_3.jpg",
    "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/pamer_saldo_4.jpg",
    "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/pamer_saldo_5.jpg"
]

export default function MemberResults() {
    return (
        <section className="py-20 bg-slate-900 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl md:text-5xl font-extrabold text-white mb-4"
                    >
                        Mereka Yang Sudah <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Membuktikan</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Bukan janji manis, tapi hasil nyata. Ribuan member Digital Squad sudah merasakan manisnya cuan dari rumah. Giliran Anda kapan?
                    </motion.p>
                </div>

                {/* Gallery Grid/Scroll */}
                <div className="relative w-full overflow-hidden">
                    {/* Gradient Fade for scroll indicators on mobile */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 md:hidden pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 md:hidden pointer-events-none"></div>

                    {/* Mobile: Infinite Carousel Track */}
                    <motion.div
                        className="flex md:hidden gap-4 w-max"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 20 // Adjust duration for speed
                        }}
                    >
                        {/* Duplicate list for seamless loop */}
                        {[...memberResults, ...memberResults].map((img, idx) => (
                            <div key={idx} className="min-w-[200px] relative">
                                <div className="group relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl">
                                    <div className="aspect-[9/16] relative overflow-hidden">
                                        <img
                                            src={img}
                                            alt={`Member Result ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg px-2 py-1 text-center">
                                                <span className="text-green-400 text-[10px] font-bold tracking-wider">VERIFIED INCOME</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Desktop: Grid Layout */}
                    <div className="hidden md:grid md:grid-cols-5 md:gap-6">
                        {memberResults.map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, type: "spring" }}
                            >
                                <div className="group relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl hover:border-green-500/50 transition-all duration-300">
                                    <div className="aspect-[9/16] relative overflow-hidden">
                                        <img
                                            src={img}
                                            alt={`Member Result ${idx + 1}`}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg px-3 py-1.5 text-center">
                                                <span className="text-green-400 text-xs font-bold tracking-wider">VERIFIED INCOME</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-slate-500 text-sm italic">
                        *Hasil setiap member bisa berbeda-beda tergantung usaha dan konsistensi.
                    </p>
                </div>
            </div>
        </section>
    )
}
