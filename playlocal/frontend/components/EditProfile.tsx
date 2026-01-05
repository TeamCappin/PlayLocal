import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, CheckCircle, Info, Flame, Smile, Zap, Calendar, Clock, Sun, Sunrise, Sunset, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/lib/api';

const INTENSITY_OPTIONS = [
    { id: 'beginner', label: 'Beginner', description: 'Learning & casual', icon: Zap },
    { id: 'casual', label: 'Casual', description: 'Fun & relaxed', icon: Smile },
    { id: 'competitive', label: 'Competitive', description: 'Serious play', icon: Flame },
];

const AVAILABILITY_OPTIONS = [
    { id: 'weekdays', label: 'Weekdays', icon: Calendar },
    { id: 'weekends', label: 'Weekends', icon: Sunrise },
    { id: 'flexible', label: 'Flexible', icon: Clock },
    { id: 'mornings', label: 'Mornings', icon: Sunrise },
    { id: 'evenings', label: 'Evenings', icon: Sunset },
    { id: 'afternoons', label: 'Afternoons', icon: Sun },
];

export function EditProfile() {
    const navigate = useRouter();
    const { user, isAuthenticated, refreshUser } = useAuth();

    const [displayName, setDisplayName] = useState('');
    const [intensity, setIntensity] = useState('');
    const [availability, setAvailability] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setIntensity(user.defaultIntensity || '');
            setAvailability(user.availability ? user.availability.split(',') : []);
            setBio(user.bio || '');
            setLocation(user.location || '');
        }
    }, [user]);

    const toggleAvailability = (id: string) => {
        setAvailability(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setIsSaving(true);

        try {
            await usersApi.updateProfile({
                displayName,
                defaultIntensity: intensity,
                availability: availability.join(','),
                bio,
                location,
            });

            // Refresh user data in context
            if (refreshUser) {
                await refreshUser();
            }

            navigate.push(`/profile/${displayName?.toLowerCase().replace(/\s+/g, '-') || 'me'}`);
        } catch (err: any) {
            setSaveError(err.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated) {
        return null; // ProtectedRoute will handle redirect
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Back button */}
                <Link
                    href={`/profile/${user?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'me'}`}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Profile</h1>

                    {saveError && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                            {saveError}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Your display name"
                            />
                            <p className="text-sm text-gray-500 mt-2">This is the name other players will see</p>
                        </div>

                        {/* Intensity Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Self-Rated Intensity <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {INTENSITY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setIntensity(option.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${intensity === option.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className={`w-8 h-8 mx-auto mb-2 ${intensity === option.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            <div className={`font-medium ${intensity === option.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">This helps other players know what to expect when playing with you</p>
                        </div>

                        {/* Availability Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Availability <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {AVAILABILITY_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => toggleAvailability(option.id)}
                                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${availability.includes(option.id)
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 ${availability.includes(option.id) ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            <span className={`font-medium ${availability.includes(option.id) ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">This helps other players know when you are available to play</p>
                        </div>

                        {/* Reliability Score (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Reliability Score
                            </label>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-emerald-600">
                                            {user?.reliabilityScore || 100}%
                                        </span>
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <button type="button" className="text-gray-400 hover:text-gray-600">
                                        <Info className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Based on your attendance and participation history</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">This score is calculated automatically and cannot be edited</p>
                        </div>

                        {/* Preview Profile Button */}
                        <div className="border border-gray-200 rounded-xl">
                            <button
                                type="button"
                                onClick={() => navigate.push(`/profile/${user?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'me'}`)}
                                className="w-full p-4 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-xl"
                            >
                                <Eye className="w-5 h-5" />
                                Preview Public Profile
                            </button>
                            <p className="text-center text-sm text-gray-500 pb-4">See how other players will see your profile</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate.back()}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
