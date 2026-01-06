'use client';

import Link from 'next/link';
import { MapPin, Users, Trophy, Calendar, BarChart3, Share2, Shield, Zap, Heart, MessageCircle, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function LandingPage() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && user !== null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-emerald-600" />
              <span className="text-xl text-white">PlayLocal</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/discover" className="text-white hover:text-emerald-200 transition-colors">
                Discover Games
              </Link>
              <Link
                href={isAuthenticated ? "/discover" : "/register"}
                className="px-6 py-2.5 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                {isAuthenticated ? "My Games" : "Get Started"}
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative h-[600px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500">
          <div className="absolute inset-0 bg-black/20"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1715313055891-af120687e23b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBwbGF5aW5nJTIwc3BvcnRzfGVufDF8fHx8MTc2NjI2Nzc4M3ww&ixlib=rb-4.1.0&q=80&w=1080)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl text-white mb-6">
                Find Your Game. <br />
                <span className="text-emerald-200">Play Local.</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Connect with local sports enthusiasts, organize pickup games, and build lasting friendships through fair team balancing and real-time coordination.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/discover"
                  className="px-8 py-4 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span>Browse Games</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/games/create"
                  className="px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all hover:scale-105"
                >
                  Create a Game
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex gap-8">
                <div>
                  <div className="text-3xl text-white">1,200+</div>
                  <div className="text-emerald-200">Active Players</div>
                </div>
                <div>
                  <div className="text-3xl text-white">500+</div>
                  <div className="text-emerald-200">Games Played</div>
                </div>
                <div>
                  <div className="text-3xl text-white">15+</div>
                  <div className="text-emerald-200">Sports</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-gray-900 mb-4">Why PlayLocal?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to organize, play, and track your pickup games in one seamless platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-8 h-8 text-emerald-600" />}
              title="Smart Matchmaking"
              description="Fair team balancing based on skill levels, positions, and play styles. No more lopsided games."
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8 text-emerald-600" />}
              title="Location-Based Discovery"
              description="Find games near you with weather updates, map directions, and distance filters."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-emerald-600" />}
              title="Real-Time Coordination"
              description="Live rosters, waitlists, chat rooms, and check-ins keep everyone in sync."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-emerald-600" />}
              title="Match Records & Stats"
              description="Track every game with detailed stats, skill evolution, and performance insights."
            />
            <FeatureCard
              icon={<Share2 className="w-8 h-8 text-emerald-600" />}
              title="Shareable Highlights"
              description="Create game recaps with photos, stats, and highlights to share with friends."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-emerald-600" />}
              title="Safety & Trust"
              description="Verified organizers, credibility scores, and reporting tools ensure safe play."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get playing in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Create Your Profile"
              description="Set up your multi-sport profile with skills, positions, availability, and play style preferences."
              icon={<User className="w-12 h-12 text-emerald-600" />}
            />
            <StepCard
              number="2"
              title="Find or Host a Game"
              description="Browse nearby games or create your own with custom settings, skill bands, and team balancing."
              icon={<Search className="w-12 h-12 text-emerald-600" />}
            />
            <StepCard
              number="3"
              title="Play & Track"
              description="Check in, play with balanced teams, and get post-game stats and shareable recaps."
              icon={<Trophy className="w-12 h-12 text-emerald-600" />}
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-500">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-white mb-4">What Players Say</h2>
            <p className="text-xl text-emerald-100">Join thousands of active sports enthusiasts</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="PlayLocal transformed how I find pickup basketball games. The team balancing is incredible!"
              author="Minh H."
              role="Basketball Player"
              rating={5}
            />
            <TestimonialCard
              quote="Finally, a platform that makes organizing soccer games easy. The chat and live updates are game-changers."
              author="Omar E."
              role="Soccer Organizer"
              rating={5}
            />
            <TestimonialCard
              quote="I've met so many amazing people through PlayLocal. The community features are top-notch."
              author="Melissa R."
              role="Volleyball Player"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl text-white mb-6">
            Ready to Play?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {isAuthenticated
              ? "Find your next game and get playing!"
              : "Join your local sports community today. It's free and takes less than a minute."}
          </p>
          <Link
            href={isAuthenticated ? "/discover" : "/register"}
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all hover:scale-105"
          >
            <span>{isAuthenticated ? "Browse Games" : "Get Started Now"}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-emerald-600" />
                <span className="text-white">PlayLocal</span>
              </div>
              <p className="text-gray-400">
                Building healthier communities through sports.
              </p>
            </div>
            <div>
              <h3 className="text-white mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/discover" className="hover:text-emerald-400 transition-colors">Discover Games</Link></li>
                <li><Link href="/games/create" className="hover:text-emerald-400 transition-colors">Create Game</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Code of Conduct</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 PlayLocal. Built by the Cappin Team.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full text-2xl mb-4">
        {number}
      </div>
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role, rating }: { quote: string; author: string; role: string; rating: number }) {
  return (
    <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-white mb-4">"{quote}"</p>
      <div>
        <div className="text-emerald-200">{author}</div>
        <div className="text-emerald-300 text-sm">{role}</div>
      </div>
    </div>
  );
}

function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
