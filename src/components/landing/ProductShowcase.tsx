// Mock Data for Carousel
const products = [
    { title: "Mastering TikTok Ads", price: 150000, image: "https://placehold.co/300x400/1e293b/ffffff?text=Ebook+TikTok" },
    { title: "100+ Canva Templates", price: 200000, image: "https://placehold.co/300x400/1e293b/ffffff?text=Canva+Templates" },
    { title: "Email Marketing Kit", price: 175000, image: "https://placehold.co/300x400/1e293b/ffffff?text=Email+Kit" },
    { title: "Video Editing Preset", price: 125000, image: "https://placehold.co/300x400/1e293b/ffffff?text=Presets" },
    { title: "Copywriting Secrets", price: 190000, image: "https://placehold.co/300x400/1e293b/ffffff?text=Copywriting" },
    { title: "SEO for Beginners", price: 150000, image: "https://placehold.co/300x400/1e293b/ffffff?text=SEO+Guide" },
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
                            <div className="h-80 bg-slate-700 relative">
                                <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" />
                                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
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
