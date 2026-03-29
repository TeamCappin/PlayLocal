import Link from 'next/link';
import { MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-emerald-600" />
              <span className="text-white">PlayLocal</span>
            </div>
            <p className="text-gray-400">Building healthier communities through sports.</p>
          </div>
          <div>
            <h3 className="text-white mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/discover?view=map" className="hover:text-emerald-400 transition-colors">
                  Discover Games
                </Link>
              </li>
              <li>
                <Link href="/games/create" className="hover:text-emerald-400 transition-colors">
                  Create Game
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="https://github.com/TeamCappin/PlayLocal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/TeamCappin/PlayLocal/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© 2026 PlayLocal. Built by the Cappin Team.</p>
        </div>
      </div>
    </footer>
  );
}