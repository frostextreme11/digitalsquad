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
  
  const inviteCommission = 25000
  const productCommission = 50000
  
  const totalIncome = (invites * inviteCommission) + (sales * productCommission)

  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600"
        >
          Simulasi Keuntungan
        </motion.h2>

        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
               <div className="space-y-8">
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
                       <p className="text-xs text-slate-400 mt-1">Komisi: Rp 25.000 / invite</p>
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
                       <p className="text-xs text-slate-400 mt-1">Komisi: Rp 50.000 / produk</p>
                   </div>
               </div>

               <div className="text-center bg-slate-950/50 p-8 rounded-2xl border border-yellow-500/30">
                   <p className="text-slate-300 mb-2 text-lg">Potensi Penghasilan Kamu</p>
                   <div className="text-4xl md:text-5xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                       Rp <Counter from={0} to={totalIncome} />
                   </div>
                   <p className="text-sm text-slate-400 mt-4">
                       Hanya dengan modal <span className="text-green-400 font-bold">50rb</span>, potensi penghasilanmu tidak terbatas!
                   </p>
               </div>
           </div>
        </div>
      </div>
    </section>
  )
}
