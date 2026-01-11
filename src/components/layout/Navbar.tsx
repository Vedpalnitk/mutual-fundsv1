import Link from 'next/link';
import { useRouter } from 'next/router';
import { navLinks } from '@/utils/constants';

interface NavbarProps {
  mode?: 'admin' | 'user';
}

const Navbar = ({ mode = 'user' }: NavbarProps) => {
  const router = useRouter();

  const scopedLinks = mode === 'admin'
    ? [
        { label: 'Overview', href: '/dashboard?mode=admin' },
        { label: 'Personas', href: '/nests?mode=admin' },
        { label: 'Profiles', href: '/nests/create?mode=admin' }
      ]
    : navLinks;

  const isActiveLink = (href: string) => {
    const currentPath = router.asPath.split('?')[0];
    const linkPath = href.split('?')[0];
    return currentPath === linkPath;
  };

  return (
    <header className="sticky top-0 z-50 navbar-glass">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-2xl gradient-blue flex items-center justify-center text-white text-lg font-bold shadow-blue overflow-hidden">
            <span className="relative z-10">MF</span>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
          </div>
          <div>
            <p className="text-lg font-semibold text-primary brand-font group-hover:text-blue transition-colors">
              Mutual Funds
            </p>
            <p className="text-xs text-secondary">
              {mode === 'admin' ? 'Admin Studio' : 'Smart Portfolio Manager'}
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {scopedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link text-sm ${isActiveLink(link.href) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-ghost text-sm">
            Sign Out
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
