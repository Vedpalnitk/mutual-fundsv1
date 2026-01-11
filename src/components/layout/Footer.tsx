const Footer = () => {
  return (
    <footer className="mt-16 liquid-glass border-t-0 rounded-none">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center text-white text-sm font-bold shadow-blue">
              MF
            </div>
            <p className="text-lg font-semibold text-primary brand-font">Mutual Funds</p>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            AI-powered portfolio management with goal-aligned mutual fund recommendations.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <p className="font-semibold text-primary mb-4">Product</p>
          <ul className="space-y-2 text-sm text-secondary">
            <li className="hover:text-blue transition-colors cursor-pointer">Dashboard</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Fund Universe</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Portfolio Builder</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Investor Profile</li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <p className="font-semibold text-primary mb-4">Resources</p>
          <ul className="space-y-2 text-sm text-secondary">
            <li className="hover:text-blue transition-colors cursor-pointer">Help Center</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Documentation</li>
            <li className="hover:text-blue transition-colors cursor-pointer">API Reference</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Contact Support</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <p className="font-semibold text-primary mb-4">Legal</p>
          <ul className="space-y-2 text-sm text-secondary">
            <li className="hover:text-blue transition-colors cursor-pointer">Privacy Policy</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Terms of Service</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Regulatory Disclosures</li>
            <li className="hover:text-blue transition-colors cursor-pointer">Risk Disclaimer</li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-separator/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-tertiary">
            2024 Mutual Funds. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="chip-blue text-xs">iOS 26 Liquid Glass</span>
            <span className="text-xs text-tertiary">Powered by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
