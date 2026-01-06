import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Users, TrendingUp, Calendar, Save, Eye, Plus, X, Loader2 } from 'lucide-react';
import { useCreateGame } from '@/hooks/useGames';
import { useAuth } from '@/context/AuthContext';

export function CreateGame() {
  const navigate = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { createGame, isCreating, error: createError } = useCreateGame();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    minPlayers: '',
    maxPlayers: '',
    skillLevel: '',
    intensity: '',
    indoor: '',
    allowWaitlist: true,
    requireCheckin: true,
    description: '',
    visibility: 'public',
  });

  const sports = [
    'Basketball',
    'Soccer',
    'Volleyball',
    'Tennis',
    'Ultimate Frisbee',
    'Badminton',
    'Baseball',
    'Hockey',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      navigate.push('/login');
      return;
    }

    try {
      // Combine date and time into ISO string
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = formData.endTime ? `${formData.date}T${formData.endTime}:00` : undefined;

      const game = await createGame({
        title: formData.title,
        description: formData.description || undefined,
        sportName: formData.sport,
        locationName: formData.location,
        city: 'Montreal', // Could be extracted from location search
        indoorOutdoor: formData.indoor,
        intensityBand: formData.intensity,
        skillBand: formData.skillLevel,
        minPlayers: parseInt(formData.minPlayers) || 2,
        maxPlayers: parseInt(formData.maxPlayers) || 20,
        allowWaitlist: formData.allowWaitlist,
        startTime: new Date(startDateTime).toISOString(),
        endTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      });

      navigate.push(`/games/${game.gameId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create game. Make sure the backend is running.');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Create a Game</h1>
          <p className="text-gray-600">Set up your pickup game and invite players</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <StepIndicator number={1} label="Basic Info" active={step === 1} completed={step > 1} />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div
                className={`h-full transition-all ${step > 1 ? 'bg-emerald-600' : 'bg-gray-200'}`}
                style={{ width: step > 1 ? '100%' : '0%' }}
              ></div>
            </div>
            <StepIndicator number={2} label="Details" active={step === 2} completed={step > 2} />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div
                className={`h-full transition-all ${step > 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}
                style={{ width: step > 2 ? '100%' : '0%' }}
              ></div>
            </div>
            <StepIndicator number={3} label="Settings" active={step === 3} completed={step > 3} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Error Display */}
          {(error || createError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error || createError}
            </div>
          )}

          {/* Auth Warning */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              You need to <a href="/login" className="font-medium underline">sign in</a> to create a game.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">Basic Information</h2>

                <div>
                  <label className="block text-gray-700 mb-2">Game Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., 5v5 Basketball Pickup"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Sport *</label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Search for a location..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Start typing to search for courts, fields, or venues
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Location Type *</label>
                    <select
                      value={formData.indoor}
                      onChange={(e) => setFormData({ ...formData, indoor: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Start Time *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">End Time *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">Game Details</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Minimum Players *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.minPlayers}
                        onChange={(e) => setFormData({ ...formData, minPlayers: e.target.value })}
                        placeholder="e.g., 6"
                        min="2"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Maximum Players *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.maxPlayers}
                        onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                        placeholder="e.g., 10"
                        min="2"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Skill Level *</label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Select skill level</option>
                      <option value="all">All Levels Welcome</option>
                      <option value="beginner">Beginner-Friendly</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Intensity *</label>
                    <select
                      value={formData.intensity}
                      onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Select intensity</option>
                      <option value="low">Low - Casual & Social</option>
                      <option value="medium">Medium - Competitive</option>
                      <option value="high">High - Very Competitive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add any additional details about the game..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  ></textarea>
                </div>

                {/* Team Balancing Options */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-emerald-900 mb-1">Smart Team Balancing</h4>
                      <p className="text-sm text-emerald-700 mb-3">
                        Automatically balance teams based on player skills and positions
                      </p>
                      <select className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                        <option>Random Assignment</option>
                        <option>Captain's Pick</option>
                        <option>Smart Balancing (Recommended)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">Game Settings</h2>

                <div>
                  <label className="block text-gray-700 mb-2">Game Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="public">Public - Anyone can see and join</option>
                    <option value="friends">Friends Only - Visible to friends</option>
                    <option value="invite">Invite Only - Only invited players</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowWaitlist}
                      onChange={(e) => setFormData({ ...formData, allowWaitlist: e.target.checked })}
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-gray-900">Enable Waitlist</div>
                      <div className="text-sm text-gray-600">
                        Allow players to join a waitlist when the game is full
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireCheckin}
                      onChange={(e) => setFormData({ ...formData, requireCheckin: e.target.checked })}
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-gray-900">Require Check-In</div>
                      <div className="text-sm text-gray-600">
                        Players must check in before the game starts
                      </div>
                    </div>
                  </label>
                </div>

                {/* Summary Preview */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg text-gray-900 mb-4">Game Summary</h3>
                  <div className="space-y-3">
                    <SummaryRow label="Title" value={formData.title || 'Not set'} />
                    <SummaryRow label="Sport" value={formData.sport || 'Not set'} />
                    <SummaryRow label="Location" value={formData.location || 'Not set'} />
                    <SummaryRow
                      label="Date & Time"
                      value={
                        formData.date && formData.startTime
                          ? `${formData.date} at ${formData.startTime}`
                          : 'Not set'
                      }
                    />
                    <SummaryRow
                      label="Players"
                      value={
                        formData.minPlayers && formData.maxPlayers
                          ? `${formData.minPlayers}-${formData.maxPlayers}`
                          : 'Not set'
                      }
                    />
                    <SummaryRow label="Skill Level" value={formData.skillLevel || 'Not set'} />
                    <SummaryRow label="Intensity" value={formData.intensity || 'Not set'} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-3">
              {step < 3 && (
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Draft</span>
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Create Game
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Templates */}
        {step === 1 && (
          <div className="mt-8">
            <h3 className="text-lg text-gray-900 mb-4">Or start from a template</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <TemplateCard
                title="Weekly Basketball"
                description="Your usual 5v5 game at Parc Jarry"
                icon="🏀"
              />
              <TemplateCard
                title="Soccer Pickup"
                description="11v11 at Claude-Robillard"
                icon="⚽"
              />
              <TemplateCard
                title="Beach Volleyball"
                description="Sunday fun at Jean-Doré Beach"
                icon="🏐"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${completed
          ? 'bg-emerald-600 text-white'
          : active
            ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-600'
            : 'bg-gray-200 text-gray-600'
          }`}
      >
        {completed ? '✓' : number}
      </div>
      <span
        className={`hidden sm:block ${active || completed ? 'text-gray-900' : 'text-gray-500'
          }`}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function TemplateCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <button className="p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all text-left">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  );
}
