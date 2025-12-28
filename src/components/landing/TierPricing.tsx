import { motion } from 'framer-motion'
import { Check, Crown, Star, Zap } from 'lucide-react'

const tiers = [
    {
        key: 'basic',
        name: 'SQUAD MEMBER',
        subtitle: 'Tier Pemula',
        price: 50000,
        totalPrice: 50000,
        commission: '30%',
        commissionAmount: 15000,
        minWithdraw: 50000,
        features: [
            'Akses semua produk digital',
            'Link affiliate personal',
            'Komisi 30% per penjualan',
            'Min withdraw Rp 50.000',
            'Akses Agent Academy',
            'Support via grup'
        ],
        isBestSeller: false,
        gradient: 'from-slate-600 to-slate-700',
        borderColor: 'border-slate-700',
        icon: Star
    },
    {
        key: 'pro',
        name: 'SQUAD ELITE',
        subtitle: 'Tier Pro',
        price: 100000,
        totalPrice: 150000,
        commission: '50%',
        commissionAmount: 25000,
        minWithdraw: 20000,
        features: [
            'Semua fitur Basic +',
            'Komisi 50% per penjualan',
            'Min withdraw Rp 20.000',
            'Akses materi eksklusif',
            'Priority support',
            'Badge Elite Member'
        ],
        isBestSeller: true,
        gradient: 'from-blue-600 to-purple-600',
        borderColor: 'border-blue-500',
        icon: Crown
    }
]

export default function TierPricing() {
    const scrollToRegister = (tierKey: string) => {
        const registerSection = document.getElementById('register')
        if (registerSection) {
            // Store selected tier in sessionStorage for registration form
            sessionStorage.setItem('selectedTier', tierKey)
            registerSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <section id="pricing" className="py-20 bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Pilih Tier Keanggotaanmu
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Mulai dari Basic atau langsung ke Pro untuk komisi lebih besar!
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={tier.key}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.15 }}
                            className={`relative bg-slate-900/80 backdrop-blur-md rounded-3xl border-2 ${tier.borderColor} p-8 ${tier.isBestSeller ? 'ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20' : ''}`}
                        >
                            {/* Best Seller Badge */}
                            {tier.isBestSeller && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-sm px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                                        <Zap size={14} />
                                        BEST SELLER
                                    </div>
                                </div>
                            )}

                            {/* Tier Icon & Name */}
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg`}>
                                    <tier.icon size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                                <p className="text-slate-400 text-sm">{tier.subtitle}</p>
                            </div>

                            {/* Price */}
                            <div className="text-center mb-6 py-4 bg-slate-800/50 rounded-2xl">
                                <div className="text-4xl font-black text-white mb-1">
                                    Rp {tier.totalPrice.toLocaleString('id-ID')}
                                </div>
                                <p className="text-slate-400 text-sm">sekali bayar, seumur hidup</p>
                                {tier.key === 'pro' && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        (Rp 50.000 daftar + Rp 100.000 upgrade)
                                    </p>
                                )}
                            </div>

                            {/* Commission Highlight */}
                            <div className={`text-center mb-6 py-3 rounded-xl bg-gradient-to-r ${tier.gradient}`}>
                                <div className="text-white font-bold text-lg">
                                    Komisi {tier.commission} = Rp {tier.commissionAmount.toLocaleString('id-ID')}/penjualan
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${tier.gradient} flex items-center justify-center flex-shrink-0`}>
                                            <Check size={12} className="text-white" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => scrollToRegister(tier.key)}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition duration-300 ${tier.isBestSeller
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-blue-600/30'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                                    }`}
                            >
                                {tier.isBestSeller ? 'Pilih Pro - Paling Untung!' : 'Pilih Basic'}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* VIP Teaser */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="mt-12 text-center"
                >
                    <div className="inline-block bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-yellow-600/30 rounded-2xl px-8 py-4">
                        <div className="flex items-center gap-3 text-yellow-500">
                            <Crown size={24} />
                            <span className="font-bold">SQUAD COMMANDER (VIP)</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-2">
                            Tier eksklusif dengan komisi 60% + bonus 5% dari penjualan downline.
                            <br />
                            <span className="text-yellow-500/80">Otomatis unlock setelah mencapai 100 penjualan!</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
