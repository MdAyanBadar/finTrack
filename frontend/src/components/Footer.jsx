import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-slate-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FinTrack
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Empowering your financial journey with AI-driven insights and 
              bank-level security. Take control of your future today.
            </p>
            <div className="flex gap-4">
              <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition">🐦</span>
              <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition">📸</span>
              <span className="text-xl grayscale hover:grayscale-0 cursor-pointer transition">💼</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Product</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Smart Analytics</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Security</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6">Resources</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Documentation</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Help Center</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Financial Guide</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Trust Badge Section */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-white font-semibold mb-2">Secure & Encrypted</h3>
            <p className="text-xs text-gray-400 mb-4">
              Your data is protected by AES-256 encryption.
            </p>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
              <span className="text-lg">🔒</span>
              ISO 27001 Certified
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 FinTrack Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-gray-500">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;