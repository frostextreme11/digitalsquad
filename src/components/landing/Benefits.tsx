import { motion } from 'framer-motion'
import { TrendingUp, Users, ShieldCheck, Wallet } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: "Potensi Penghasilan Tinggi",
    description: "Dapatkan komisi besar dari setiap penjualan. Balik modal super cepat!"
  },
  {
    icon: Users,
    title: "Komunitas Solid",
    description: "Belajar bareng member lain. Support system yang gokil abis."
  },
  {
    icon: Wallet,
    title: "Withdraw Cepat",
    description: "Gak pake lama. Tarik saldo kapan aja setelah mencapai minimum."
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terpercaya",
    description: "Sistem transparan, no tipu-tipu. Data member dijamin aman."
  }
]

export default function Benefits() {
  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          Kenapa Harus Join?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition duration-300 hover:-translate-y-2 group"
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors duration-300">
                <benefit.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
