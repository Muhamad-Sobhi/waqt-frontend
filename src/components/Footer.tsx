import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold tracking-wider" style={{ color: '#D4A853' }}>
                WAQT
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Timeless elegance on your wrist. We curate the finest collection of watches 
              from world-renowned brands, delivered to your doorstep with care and precision.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#D4A853] transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-[#D4A853] transition-colors text-sm">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-400 hover:text-[#D4A853] transition-colors text-sm">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <span>📱</span> WhatsApp Support
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <span>📦</span> Cash on Delivery
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <span>🔒</span> Secure Shopping
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">
              Follow Us
            </h3>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1DNkUbSCwp/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#E60023] hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.603 0 12.017 0z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#FF0000] hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 00-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.013 2.014c-5.503 0-9.972 4.467-9.974 9.972-.001 1.761.46 3.481 1.336 4.996L1.933 22.25l5.395-1.415a9.914 9.914 0 004.685 1.168h.004c5.503 0 9.972-4.468 9.974-9.973a9.932 9.932 0 00-2.92-7.054 9.934 9.934 0 00-7.058-2.962zm0 1.677c2.259 0 4.382.88 5.979 2.478 1.597 1.596 2.476 3.722 2.475 5.981-.001 4.654-3.787 8.441-8.443 8.442h-.003c-1.488 0-2.946-.388-4.225-1.124l-.303-.18-3.14.823.84-3.064-.197-.314A8.256 8.256 0 013.714 11.99c.002-4.655 3.788-8.442 8.443-8.443h.001zm-4.148 4.6c-.156-.44-.321-.448-.468-.456-.12-.007-.258-.007-.396-.007-.138 0-.361.052-.55.258-.188.207-.723.706-.723 1.722s.741 1.997.844 2.135c.103.138 1.455 2.22 3.523 3.111 2.068.891 2.068.593 2.446.559.379-.035 1.222-.5 1.394-.981.172-.482.172-.895.12-1-.039-.082-.128-.124-.265-.192-.138-.07-1.222-.603-1.411-.672-.189-.07-.327-.104-.465.104-.138.207-.533.671-.653.81-.12.137-.24.155-.378.085-.138-.069-.871-.322-1.659-1.026-.613-.548-1.027-1.225-1.147-1.363-.12-.138-.013-.212.056-.282.062-.062.138-.155.206-.233.07-.078.093-.138.139-.232.046-.094.023-.172-.012-.24-.034-.07-.464-1.121-.636-1.534z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://m.me/" target="_blank" rel="noopener noreferrer" aria-label="Messenger" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#00B2FF] hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.35 2 2 6.13 2 11.75c0 3.01 1.36 5.68 3.5 7.45v3.45c0 .54.6.86 1.04.56l3.14-2.14c.73.19 1.5.3 2.32.3 5.65 0 10-4.13 10-9.75S17.65 2 12 2zm1 12l-2.5-2.5L6 14l4.5-5 2.5 2.5L18 9l-5 5z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@waqt.watches2?_r=1&_t=ZS-987REM2Ij2L" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.18 1.85-5.18 2.68-7.98 2.06-2.82-.6-5.26-2.55-6.3-5.22-1.07-2.67-.73-5.74 1.03-7.99 1.73-2.18 4.46-3.41 7.23-3.32v4.06c-1.4.02-2.82.52-3.8 1.52-.98.98-1.52 2.4-1.39 3.8.12 1.39.87 2.67 2.03 3.42 1.15.74 2.62 1.03 3.98.63 1.35-.41 2.46-1.41 3-2.68.53-1.25.68-2.67.66-4.04-.03-5.59-.01-11.17-.01-16.76h.8z"/></svg>
              </a>
              <a href="https://www.instagram.com/waqtwatch2?igsh=ZDB1cXF4M3Q1NDVt" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Waqt Store. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Made with ❤️ for watch enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
