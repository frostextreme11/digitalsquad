import { Trash2, TrendingUp, Coffee, AlertTriangle, ShieldCheck, BookOpen, GraduationCap, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ValueComparison() {


    return (
        <section className="py-24 relative bg-slate-950 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2" />
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent mb-4 tracking-tight"
                    >
                        THE 50K CHALLENGE
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400"
                    >
                        Ke Mana Perginya Uang 50 Ribu Anda Hari Ini?
                    </motion.p>
                </div>

                {/* Main Comparison Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20 items-stretch">

                    {/* Left Card (The Consumer) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative p-8 rounded-3xl border border-red-900/30 bg-slate-900/80 transition-all duration-500 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)]"
                    >
                        {/* Red glow effect - pulsating */}
                        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent rounded-3xl animate-pulse" />

                        <div className="flex justify-center mb-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-red-900/20 flex items-center justify-center border border-red-500/20 shadow-inner shadow-red-500/10">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-red-200 text-center mb-8 relative z-10">Rp 50.000 untuk Gaya Hidup</h3>

                        <ul className="space-y-4 text-slate-400 relative z-10">
                            <li className="flex items-start gap-3">
                                <Coffee className="w-5 h-5 mt-1 shrink-0 opacity-70 text-red-300" />
                                <span>2 Cup Kopi Kekinian (Habis dalam 30 menit)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 mt-1 flex items-center justify-center text-lg leading-none shrink-0 grayscale-[0.5]">🍔</div>
                                <span>1 Paket Burger (Kenyang sesaat)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 mt-1 flex items-center justify-center shrink-0 grayscale-[0.5]">📉</div>
                                <span>ROI: 0% (Uang hilang selamanya)</span>
                            </li>
                            <li className="flex gap-3 text-red-400 font-bold bg-red-950/30 p-2 rounded-lg border border-red-900/30">
                                <AlertTriangle className="w-5 h-5 mt-1 shrink-0 animate-bounce" />
                                <span>Risiko: Gula darah naik, uang habis.</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Right Card (The Creator - Highlighted) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05 }}
                        className="relative p-8 rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20 shadow-lg shadow-emerald-500/10"
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                            RECOMMENDED CHOICE
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-white text-center mb-8">Rp 50.000 di Digital Squad</h3>

                        <ul className="space-y-5">
                            <li className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 mt-1 text-emerald-400 shrink-0" />
                                <span className="text-slate-200">Akses Gudang Ebook Premium & Aset Digital <span className="text-emerald-400 font-semibold">(Senilai Jutaan Rupiah)</span></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 mt-1 text-emerald-400 shrink-0" />
                                <span className="text-slate-200">Hak Bisnis & Lisensi Resell <span className="text-emerald-400 font-semibold">(Rahasia Sebar Link Dapet Cuan)</span></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <GraduationCap className="w-5 h-5 mt-1 text-emerald-400 shrink-0" />
                                <span className="text-slate-200">Akses Digital Squad Academy</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-5 h-5 mt-1 flex items-center justify-center shrink-0">🚀</div>
                                <span className="text-slate-200 font-semibold">ROI: Penghasilan Unlimited <span className="text-slate-400 font-normal">(Potensi income tak terbatas)</span></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 mt-1 text-yellow-400 shrink-0" />
                                <span className="bg-yellow-500/10 text-yellow-300 px-2 py-0.5 rounded -ml-2">Risiko: NOL (Ikuti dan Praktekan Academy Digital Squad Maka Anda Akan Profit!).</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Logical Explanation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center bg-slate-900/50 rounded-3xl p-8 border border-slate-800 backdrop-blur-sm mb-16"
                >
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
                        Mari Berhitung Secara Logis (Matematika Anak SD)
                    </h3>
                    <div className="space-y-4 text-slate-300 text-lg leading-relaxed text-left">
                        <p>Banyak orang ragu mengeluarkan Rp 50.000 untuk bisnis. Padahal:</p>
                        <ol className="list-decimal list-outside pl-5 space-y-2">
                            <li>Harga 1 Produk Digital di pasaran rata-rata <strong className="text-white">Rp 50.000 - Rp 100.000</strong>. Itu hanya untuk satu judul. Mirip harga 2 cup kopi kekinian.</li>
                            <li>Di Digital Squad, dengan Rp 50.000 Anda dapat <strong className="text-emerald-400">Akses Ke Platform Digital Squad</strong> (Gudang Produk Digital!).</li>
                            <li>PLUS: Produk Digital ini bisa Anda <strong className="text-amber-400">jual lagi</strong>! Beli akses gudang seharga 2 cup kopi, jual isinya berkali-kali.</li>
                            <li><strong className="text-amber-400">Jual ke 2 orang = Balik Modal.</strong><br></br><strong className="text-emerald-400">Jual ke-3 = Profit 100%</strong>.</li>
                            <li>Ribuan member Digital Squad balik modal hanya dalam 1 hari kurang <strong className="text-emerald-400">bahkan beberapa jam setelah mengikuti Academy nya!</strong></li>
                            <li><strong className="text-amber-400">Cuman Sebar Link Bisa Langsung Dapet Cuan!</strong></li>
                        </ol>
                    </div>
                </motion.div>

                {/* CTA */}
                {/* <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <button
                        onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-950 transition-all duration-200 bg-emerald-500 rounded-full hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                    >
                        <span>Saya Mau Untung Hari Ini!</span>
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                    </button>
                </motion.div> */}

            </div>
        </section>
    )
}
