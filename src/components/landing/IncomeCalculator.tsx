import { useState, useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'

const Counter = ({ from, to }: { from: number, to: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration: 1.5,
      onUpdate(value) {
        node.textContent = Math.floor(value).toLocaleString('id-ID');
      }
    });

    return () => controls.stop();
  }, [from, to]);

  return <span ref={nodeRef} />;
}

export default function IncomeCalculator() {
  const [invites, setInvites] = useState(10)
  const [sales, setSales] = useState(5)
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro'>('pro')

  // Tier-based commission rates
  const tierConfig = {
    basic: {
      name: 'Basic',
      inviteCommission: 15000, // 30% of 50000
      productCommission: 25000, // 30% (approx)
      registrationCost: 50000,
      color: 'slate'
    },
    pro: {
      name: 'Pro',
      inviteCommission: 25000, // 50% of 50000
      productCommission: 41667, // 50% (approx)
      registrationCost: 150000,
      color: 'blue'
    }
  }

  const config = tierConfig[selectedTier]
  const totalIncome = (invites * config.inviteCommission) + (sales * config.productCommission)
  const netProfit = totalIncome - config.registrationCost

  // Calculate comparison
  const basicIncome = (invites * tierConfig.basic.inviteCommission) + (sales * tierConfig.basic.productCommission)
  const proIncome = (invites * tierConfig.pro.inviteCommission) + (sales * tierConfig.pro.productCommission)
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
                Basic (30%)
              </button>
              <button
                onClick={() => setSelectedTier('pro')}
                className={`px-6 py-2 rounded-lg font-medium transition ${selectedTier === 'pro'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Pro (50%)
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
                  min="0" max="100"
                  value={invites}
                  onChange={(e) => setInvites(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Komisi: Rp {config.inviteCommission.toLocaleString('id-ID')} / invite ({selectedTier === 'pro' ? '50%' : '30%'})
                </p>
              </div>

              <div>
                <label className="flex justify-between text-white mb-2 font-medium">
                  <span>Produk Terjual</span>
                  <span className="text-purple-400 font-bold">{sales} Pcs</span>
                </label>
                <input
                  type="range"
                  min="0" max="100"
                  value={sales}
                  onChange={(e) => setSales(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Komisi: Rp {config.productCommission.toLocaleString('id-ID')} / produk
                </p>
              </div>

              {/* Tier Comparison */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h4 className="text-white font-medium mb-3 text-sm uppercase tracking-wide">Perbandingan Tier</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className={`p-3 rounded-lg ${selectedTier === 'basic' ? 'bg-slate-700 ring-2 ring-slate-500' : 'bg-slate-800'}`}>
                    <p className="text-slate-400 text-xs mb-1">Basic (30%)</p>
                    <p className="text-white font-bold">Rp {basicIncome.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${selectedTier === 'pro' ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-800'}`}>
                    <p className="text-blue-400 text-xs mb-1">Pro (50%)</p>
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
                <p className="text-slate-400 text-sm mb-1">Modal Awal ({selectedTier === 'pro' ? 'Pro' : 'Basic'})</p>
                <p className="text-white font-bold">- Rp {config.registrationCost.toLocaleString('id-ID')}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm mb-1">Net Profit</p>
                <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Rp {netProfit.toLocaleString('id-ID')}
                </p>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                {netProfit >= 0
                  ? `✅ Balik modal setelah ${Math.ceil(config.registrationCost / config.inviteCommission)} invite!`
                  : `Butuh ${Math.ceil((config.registrationCost - totalIncome) / config.inviteCommission)} invite lagi untuk BEP`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
