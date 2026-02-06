import { Video, LayoutTemplate, Mail, MonitorPlay, PenTool, Search } from 'lucide-react'

// Mock Data for Carousel
const products = [
    { title: "Mastering TikTok Ads", price: 150000, icon: Video, color: "from-pink-500 to-rose-600" },
    { title: "100+ Canva Templates", price: 200000, icon: LayoutTemplate, color: "from-blue-400 to-cyan-500" },
    { title: "Email Marketing Kit", price: 175000, icon: Mail, color: "from-yellow-400 to-orange-500" },
    { title: "Video Editing Preset", price: 125000, icon: MonitorPlay, color: "from-purple-500 to-indigo-600" },
    { title: "Copywriting Secrets", price: 190000, icon: PenTool, color: "from-green-400 to-emerald-600" },
    { title: "SEO for Beginners", price: 150000, icon: Search, color: "from-blue-600 to-indigo-700" },
]

// Duplicate for infinite loop
const items = [...products, ...products, ...products]

export default function ProductShowcase() {
    return (
        <section className="py-20 bg-slate-900 overflow-hidden">
            <div className="container mx-auto px-4 mb-12 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Gudang Digital Product</h2>
                <p className="text-slate-400">Dapatkan akses ke gudang aset premium secara <span className="text-yellow-400 font-bold">GRATIS</span> setelah jadi member.</p>
            </div>

            {/* Infinite Slider Container */}
            <div className="relative w-full flex overflow-hidden group">
                <div className="flex gap-6 animate-scroll whitespace-nowrap hover:pause-scroll">
                    {items.map((item, idx) => (
                        <div key={idx} className="w-64 flex-shrink-0 bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700 transform hover:scale-105 transition duration-300">
                            <div className={`h-80 bg-gradient-to-br ${item.color} relative flex items-center justify-center group-hover:saturate-150 transition-all`}>
                                <item.icon size={80} className="text-white opacity-80 drop-shadow-lg transform group-hover:scale-110 transition duration-500" />
                                <div className="absolute inset-0 bg-black/10"></div>
                                <div className="absolute top-2 right-2 bg-white/90 text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                                    PREMIUM
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="text-white font-bold truncate mb-1">{item.title}</h4>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm line-through">Rp {item.price.toLocaleString()}</span>
                                    <span className="text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">Free for Member</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Fade Edges */}
                <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
                <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-slate-900 to-transparent z-10"></div>
            </div>
        </section>
    )
}
