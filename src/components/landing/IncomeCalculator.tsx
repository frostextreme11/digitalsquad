import { useState, useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const Counter = ({ from, to }: { from: number, to: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const safeTo = isNaN(to) ? 0 : to;
    const safeFrom = isNaN(from) ? 0 : from;

    const controls = animate(safeFrom, safeTo, {
      duration: 1.5,
      onUpdate(value) {
        if (node) node.textContent = Math.floor(value).toLocaleString('id-ID');
      }
    });

    return () => controls.stop();
  }, [from, to]);

  return <span ref={nodeRef} />;
}

export default function IncomeCalculator() {
  const [invites, setInvites] = useState(10)
  const [sales, setSales] = useState(5)
  // Ensure we default to 'basic' if 'pro' is risky, 
  // but we initialize 'pro' because we provide default config.
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro'>('pro')

  const [tierConfig, setTierConfig] = useState<Record<string, any>>({
    basic: {
      name: 'Basic',
      inviteCommission: 25000,
      productCommission: 41666,
      registrationCost: 50000,
      color: 'slate',
      commissionRate: 0.5
    },
    pro: {
      name: 'Pro',
      inviteCommission: 35000,
      productCommission: 58333,
      registrationCost: 150000,
      color: 'blue',
      commissionRate: 0.7
    }
  })

  useEffect(() => {
    const fetchTiers = async () => {
      const { data, error } = await supabase
        .from('tiers')
        .select('*')
        .in('tier_key', ['basic', 'pro'])

      if (data && !error && data.length > 0) {
        setTierConfig(prevConfig => {
          const newConfig: Record<string, any> = { ...prevConfig }
          const avgProductPrice = 83333; // Derived from original logic

          data.forEach(t => {
            if (t.tier_key) {
              // Use hard fallback if DB returns 0 or null for registration_price
              const regCost = Number(t.registration_price) || 50000;
              const commissionRate = Number(t.commission_rate) || (t.tier_key === 'basic' ? 0.5 : 0.7);

              newConfig[t.tier_key] = {
                name: t.tier_key === 'basic' ? 'Basic' : 'Pro',
                inviteCommission: commissionRate * 50000,
                productCommission: commissionRate * avgProductPrice,
                registrationCost: regCost,
                color: t.tier_key === 'pro' ? 'blue' : 'slate',
                commissionRate: commissionRate
              }
            }
          })
          return newConfig
        })
      }
    }
    fetchTiers()
  }, [])

  // Safe fallback
  const config = tierConfig[selectedTier] || tierConfig.basic;

  const totalIncome = ((invites || 0) * (config.inviteCommission || 0)) + ((sales || 0) * (config.productCommission || 0))
  const netProfit = totalIncome - (config.registrationCost || 0)

  // Calculate comparison
  const basicConfig = tierConfig.basic || config; // fallback to current if basic missing (unlikely)
  const proConfig = tierConfig.pro || config; // fallback

  const basicIncome = ((invites || 0) * (basicConfig.inviteCommission || 0)) + ((sales || 0) * (basicConfig.productCommission || 0))
  const proIncome = ((invites || 0) * (proConfig.inviteCommission || 0)) + ((sales || 0) * (proConfig.productCommission || 0))
  const proDifference = proIncome - basicIncome

  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">
            Kalkulator Penghasilan
          </h2>
          <p className="text-slate-400">Hitung potensi cuan dan bandingkan keuntungan per tier.</p>
        </motion.div>

        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">

          {/* Tier Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800 p-1 rounded-xl inline-flex">
              <button
                onClick={() => setSelectedTier('basic')}
                className={`px-6 py-2 rounded-lg font-medium transition ${selectedTier === 'basic'
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Basic ({Math.round((tierConfig.basic?.commissionRate || 0.5) * 100)}%)
              </button>
              <button
                onClick={() => setSelectedTier('pro')}
                className={`px-6 py-2 rounded-lg font-medium transition ${selectedTier === 'pro'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Pro ({Math.round((tierConfig.pro?.commissionRate || 0.7) * 100)}%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Sliders */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <label className="flex justify-between text-white mb-2 font-medium">
                  <span>Teman yang Diundang</span>
                  <span className="text-blue-400 font-bold">{invites} Orang</span>
                </label>
                <input
                  type="range"
                  min="0" max="1000"
                  value={invites}
                  onChange={(e) => setInvites(parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Komisi: Rp {(config.inviteCommission || 0).toLocaleString('id-ID')} / invite ({Math.round((config.commissionRate || 0) * 100)}%)
                </p>
              </div>

              <div>
                <label className="flex justify-between text-white mb-2 font-medium">
                  <span>Produk Terjual</span>
                  <span className="text-purple-400 font-bold">{sales} Pcs</span>
                </label>
                <input
                  type="range"
                  min="0" max="1000"
                  value={sales}
                  onChange={(e) => setSales(parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Komisi: Rp {(config.productCommission || 0).toLocaleString('id-ID')} / produk
                </p>
              </div>

              {/* Tier Comparison */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h4 className="text-white font-medium mb-3 text-sm uppercase tracking-wide">Perbandingan Tier</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className={`p-3 rounded-lg ${selectedTier === 'basic' ? 'bg-slate-700 ring-2 ring-slate-500' : 'bg-slate-800'}`}>
                    <p className="text-slate-400 text-xs mb-1">Basic ({Math.round((basicConfig.commissionRate || 0) * 100)}%)</p>
                    <p className="text-white font-bold">Rp {basicIncome.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${selectedTier === 'pro' ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-800'}`}>
                    <p className="text-blue-400 text-xs mb-1">Pro ({Math.round((proConfig.commissionRate || 0) * 100)}%)</p>
                    <p className="text-white font-bold">Rp {proIncome.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                {proDifference > 0 && (
                  <p className="text-center mt-3 text-green-400 text-sm font-medium">
                    Pro untung Rp {proDifference.toLocaleString('id-ID')} lebih banyak! 🚀
                  </p>
                )}
              </div>
            </div>

            {/* Result Card */}
            <div className="text-center bg-slate-950/50 p-8 rounded-2xl border border-yellow-500/30">
              <p className="text-slate-300 mb-2 text-lg">Potensi Penghasilan</p>
              <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                Rp <Counter from={0} to={totalIncome} />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm mb-1">Modal Awal ({config.name})</p>
                <p className="text-white font-bold">- Rp {(config.registrationCost || 0).toLocaleString('id-ID')}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm mb-1">Net Profit</p>
                <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Rp {netProfit.toLocaleString('id-ID')}
                </p>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                {netProfit >= 0
                  ? `✅ Balik modal setelah ${Math.ceil((config.registrationCost || 1) / (config.inviteCommission || 1))} invite!`
                  : `Butuh ${Math.ceil(((config.registrationCost || 0) - totalIncome) / (config.inviteCommission || 1))} invite lagi untuk BEP`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
