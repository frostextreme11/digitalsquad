import { motion } from 'framer-motion'
import { Check, Crown, Star, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Static UI Configuration
const tierConfig: Record<string, any> = {
    basic: {
        subtitle: 'Tier Basic',
        features: [
            'Akses semua produk digital',
            'Link affiliate personal',
            // Commission will be injected dynamically
            // Min withdraw will be injected dynamically
            'Akses Agent Academy',
            'Support via grup'
        ],
        isBestSeller: false,
        gradient: 'from-slate-600 to-slate-700',
        borderColor: 'border-slate-700',
        icon: Star
    },
    pro: {
        subtitle: 'Tier Pro',
        features: [
            'Semua fitur Basic +',
            // Commission will be injected dynamically
            // Min withdraw will be injected dynamically
            'Akses materi eksklusif',
            'Priority support',
            'Badge Elite Member'
        ],
        isBestSeller: true,
        gradient: 'from-blue-600 to-purple-600',
        borderColor: 'border-blue-500',
        icon: Crown
    }
}

export default function TierPricing() {
    const [tiers, setTiers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const { data, error } = await supabase
                    .from('tiers')
                    .select('*')
                    .in('tier_key', ['basic', 'pro'])
                    .order('registration_price', { ascending: true })

                if (error) throw error

                if (data && data.length > 0) {
                    setTiers(data.map(t => ({
                        key: t.tier_key,
                        name: t.name,
                        price: Number(t.registration_price),
                        commission_rate: Number(t.commission_rate),
                        min_withdraw: Number(t.min_withdraw)
                    })))
                } else {
                    // Fallback defaults if no data found
                    setTiers([
                        {
                            key: 'basic',
                            name: 'SQUAD MEMBER',
                            price: 50000,
                            commission_rate: 0.50,
                            min_withdraw: 50000
                        },
                        {
                            key: 'pro',
                            name: 'SQUAD ELITE',
                            price: 150000,
                            commission_rate: 0.70,
                            min_withdraw: 20000
                        }
                    ])
                }
            } catch (e: any) {
                console.error("Error fetching tiers:", e)
                // Fallback on error to ensure UI shows something
                setTiers([
                    {
                        key: 'basic',
                        name: 'SQUAD MEMBER',
                        price: 50000,
                        commission_rate: 0.50,
                        min_withdraw: 50000
                    },
                    {
                        key: 'pro',
                        name: 'SQUAD ELITE',
                        price: 150000,
                        commission_rate: 0.70,
                        min_withdraw: 20000
                    }
                ])
            } finally {
                setIsLoading(false)
            }
        }
        fetchTiers()
    }, [])

    const scrollToRegister = (tierKey: string) => {
        const registerSection = document.getElementById('register')
        if (registerSection) {
            sessionStorage.setItem('selectedTier', tierKey)
            // Dispatch custom event for already mounted components
            window.dispatchEvent(new CustomEvent('tierSelected', { detail: tierKey }))
            registerSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    if (isLoading && tiers.length === 0) {
        return <div className="py-20 bg-slate-950 text-center text-slate-500">Loading pricing...</div>
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
                    {tiers.map((tier, index) => {
                        // Safe fallback
                        const style = tierConfig[tier.key || 'basic'] || tierConfig.basic;
                        // Extra safety for safety's sake
                        if (!style) return null;

                        const commissionPercent = tier.commission_rate ? Math.round(tier.commission_rate * 100) : 0;
                        const exampleSalePrice = 50000;
                        const estimatedCommission = tier.commission_rate ? exampleSalePrice * tier.commission_rate : 0;

                        return (
                            <motion.div
                                key={tier.key || index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={style.isBestSeller ? { scale: 1.02 } : {}}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.15 }}
                                className={`relative rounded-3xl p-8 ${style.isBestSeller
                                    ? 'bg-slate-900/90 border-transparent shadow-[0_0_60px_rgba(37,99,235,0.3)] overflow-visible z-10' // Increased shadow, overflow-visible for aura, z-10
                                    : 'bg-slate-900/80 backdrop-blur-md border-2 ' + style.borderColor
                                    }`}
                            >
                                {/* Strong Ambient Aura for Best Seller */}
                                {style.isBestSeller && (
                                    <div className="absolute inset-0 bg-blue-600/20 blur-[60px] rounded-3xl -z-10 animate-pulse-slow"></div>
                                )}

                                {/* Moving Gradient Border for Best Seller */}
                                {style.isBestSeller && (
                                    <div className="overflow-hidden absolute inset-0 rounded-3xl pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/30 to-purple-500/30 animate-spin-slow opacity-70 z-0 rounded-3xl" style={{ margin: '-2px' }} />
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 z-0" />
                                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                                        <div className="absolute inset-y-0 -left-px w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent" />
                                        <div className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-purple-400 to-transparent" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    {/* Best Seller Badge with Animation */}
                                    {style.isBestSeller && (
                                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 z-20">
                                            <motion.div
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                                className="relative"
                                            >
                                                <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse"></div>
                                                <div className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-[length:200%_auto] animate-gradient text-slate-900 font-black text-sm px-6 py-2 rounded-full flex items-center gap-1.5 shadow-[0_4px_20px_rgba(245,158,11,0.4)] border border-yellow-200/50">
                                                    <Zap size={16} className="fill-slate-900 animate-pulse" />
                                                    <span className="tracking-wide">BEST SELLER</span>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Tier Icon & Name */}
                                    <div className="text-center mb-6">
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg relative group`}>
                                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            {style.icon && <style.icon size={32} className="text-white relative z-10" />}
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
                                        <p className="text-slate-400 text-sm">{style.subtitle}</p>
                                    </div>

                                    {/* Price */}
                                    <div className={`text-center mb-6 py-4 rounded-2xl ${style.isBestSeller ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50' : 'bg-slate-800/50'}`}>
                                        <div className="text-4xl font-black text-white mb-1 tracking-tight">
                                            Rp {(tier.price || 0).toLocaleString('id-ID')}
                                        </div>
                                        <p className="text-slate-400 text-sm">sekali bayar, seumur hidup</p>
                                        {tier.key === 'pro' && (
                                            <p className="text-xs text-blue-300/80 mt-2 font-medium bg-blue-900/20 inline-block px-3 py-1 rounded-full border border-blue-500/20">
                                                ★ Investasi terbaik jangka panjang
                                            </p>
                                        )}
                                    </div>

                                    {/* Commission Highlight */}
                                    <div className={`text-center mb-6 py-3 rounded-xl bg-gradient-to-r shadow-lg relative overflow-hidden group ${style.gradient}`}>
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                        <div className="relative z-10">
                                            <div className="text-white font-bold text-lg flex items-center justify-center gap-2">
                                                Komisi {commissionPercent}% <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/90">INSTANT</span>
                                            </div>
                                            <div className="text-white/80 text-sm mt-0.5">
                                                ~ Rp {estimatedCommission.toLocaleString('id-ID')} / penjualan
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${style.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="flex-1">Komisi <span className="text-white font-bold">{commissionPercent}%</span> per penjualan</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${style.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="flex-1">Min withdraw <span className="text-white font-medium">Rp {(tier.min_withdraw || 0).toLocaleString('id-ID')}</span></span>
                                        </li>
                                        {style.features?.map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-slate-300">
                                                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${style.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                    <Check size={12} className="text-white" />
                                                </div>
                                                <span className="flex-1">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => scrollToRegister(tier.key)}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden group ${style.isBestSeller
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02]'
                                            : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                                            }`}
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative z-10">{style.isBestSeller ? 'Pilih Pro - Paling Untung!' : 'Pilih Basic'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
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
