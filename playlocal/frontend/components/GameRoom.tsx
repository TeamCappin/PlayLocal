/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Share2,
  Calendar,
  ExternalLink,
  CheckCircle,
  TrendingUp,
  Star,
  AlertCircle,
  Sun,
  Loader2,
  UserMinus,
  LogIn,
  Flag,
  Edit,
  Medal,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { useGame } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import { gamesApi, UpdateGameRequest, GameResponse, endorsementsApi, RosterResponse } from "@/lib/api";
import { ReportModal } from "./ReportModal";
import { JoinConfirmationModal } from "./JoinConfirmationModal";
import { OrganizerQualityBadge } from "./OrganizerQualityBadge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Helper to get image by sport (US 2.2)
function getSportImage(sport: string) {
  const images: Record<string, string> = {
    Basketball:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1080",
    Soccer:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1080",
    Tennis:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1080",
    Volleyball:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1080",
    Badminton:
      "https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?auto=format&fit=crop&q=80&w=1080",
    Baseball: "/images/sports/baseball.jpg",
    Hockey:
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&q=80&w=1080",
    "Ultimate Frisbee": "/images/sports/ultimate-frisbee.jpg",
    "Flag Football":
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1080",
    Softball:
      "https://images.unsplash.com/photo-1578432014316-48b448d79d57?auto=format&fit=crop&q=80&w=1080",
    Pickleball:
      "https://images.unsplash.com/photo-1526888935184-a82d2a4b7e67?auto=format&fit=crop&q=80&w=1080",
  };
  return (
    images[sport] ||
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1080"
  );
}

// Mock data for fallback when backend unavailable
const mockGame = {
  gameId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  title: "5v5 Basketball Pickup",
  sportName: "Basketball",
  location: { name: "Parc Jarry Courts", addressLine: "201 Rue Gary-Carter, Montréal, QC H2R 2W1", city: "Montreal", latitude: 45.5312, longitude: -73.6205 },
  hasExactLocationAccess: true,
  approximateLocation: "Montreal, QC",
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  confirmedCount: 8,
  maxPlayers: 10,
  minPlayers: 6,
  skillBand: "Intermediate",
  intensityBand: "High",
  indoorOutdoor: "outdoor",
  description: "Looking for some competitive basketball!",
  organizer: { userId: "b2c3d4e5-f6a7-8901-bcde-f12345678901", displayName: "Minh H.", reliabilityScore: 98 },
  status: "SCHEDULED",
  minReliabilityRequired: undefined as number | undefined,
};

const mockRoster = {
  confirmed: [],
  waitlisted: [],
  maxPlayers: 10,
  spotsAvailable: 10,
};

export function GameRoom() {
  const params = useParams();
  const id = params?.id as string;
  const navigate = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    game: apiGame,
    roster: apiRoster,
    isLoading,
    error,
    joinGame,
    leaveGame,
    cancelGame,
    refetch,
  } = useGame(id);

  const [activeTab, setActiveTab] = useState<"details" | "chat" | "lineup">(
    "details",
  );
  const [message, setMessage] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    minReliabilityRequired: "",
  });
  const [showJoinConfirmationModal, setShowJoinConfirmationModal] =
    useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // CRITICAL: Check loading state FIRST before accessing any data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-gray-600">Loading game...</span>
        </div>
      </div>
    );
  }

  // BUG-2.2 fix: Show error state if game not found (after loading completes)
  if (!apiGame || !apiRoster) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl text-gray-900 mb-2">Game Not Found</h1>
          <p className="text-gray-600 mb-6">This game may have been removed or doesn't exist.</p>
          <a
            href="/discover"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Browse Games
          </a>
        </div>
      </div>
    );
  }

  // Now it's safe to access game and roster
  const game = apiGame;
  const roster = apiRoster;

  const handleEndorse = async (userId: string) => {
    try {
      await endorsementsApi.create({ endorsedUserId: userId, gameId: id });
      setActionSuccess("Player endorsed successfully!");
      refetch();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      // If validation says duplicate, refresh to show the endorsement
      if (
        err.message &&
        (err.message.toLowerCase().includes("duplicate") ||
          err.message.toLowerCase().includes("exists"))
      ) {
        refetch();
        return;
      }
      setActionError(err.message || "Failed to endorse player");
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Check if current user is in the game
  const currentUserParticipation =
    roster.confirmed.find((p) => p.userId === user?.userId) ||
    roster.waitlisted.find((p) => p.userId === user?.userId);
  const isOrganizer = game.organizer?.userId === user?.userId;
  const isParticipant = !!currentUserParticipation;
  const isWaitlisted = currentUserParticipation?.joinStatus === "WAITLISTED";

  // Format date/time
  const startDate = new Date(game.startTime);
  const endDate = game.endTime ? new Date(game.endTime) : null;
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const formattedEndTime = endDate?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const duration = endDate
    ? `${Math.round((endDate.getTime() - startDate.getTime()) / 3600000)} hours`
    : "2 hours";

  const canEdit = isOrganizer && game.status === "SCHEDULED" && startDate > new Date();
  const handleOpenEditModal = () => {
    setEditFormData({
      minReliabilityRequired: game.minReliabilityRequired != null ? String(game.minReliabilityRequired) : "",
    });
    setShowEditModal(true);
  };
  const handleUpdateGame = async () => {
    if (!id) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      const updateData: UpdateGameRequest = {
        minReliabilityRequired: editFormData.minReliabilityRequired
          ? Number.parseFloat(editFormData.minReliabilityRequired)
          : undefined,
      };
      await gamesApi.update(id, updateData);
      setActionSuccess("Game settings updated successfully!");
      setShowEditModal(false);
      await refetch();
    } catch (err: any) {
      setActionError(err.message || "Failed to update game settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate.push("/login");
      return;
    }
    const meetsReliabilityRequirement =
      game.minReliabilityRequired == null ||
      !user ||
      user.reliabilityScore >= game.minReliabilityRequired;
    if (!meetsReliabilityRequirement) {
      setActionError(
        `Minimum reliability score required: ${game.minReliabilityRequired}%. Your score: ${user?.reliabilityScore ?? 0}%`,
      );
      return;
    }

    // Check if there are restricted tags or age requirements
    const restrictedTags =
      game.tags?.filter((tag: any) => tag.isRestricted) || [];
    const hasAgeRequirements = game.minAge || game.maxAge;

    // Show confirmation modal if there are restricted tags or age requirements
    if (restrictedTags.length > 0 || hasAgeRequirements) {
      setShowJoinConfirmationModal(true);
      return;
    }

    // Join directly if no restrictions
    await performJoin();
  };

  const performJoin = async (confirmedTagIds?: string[]) => {
    setActionError(null);
    setIsJoining(true);
    try {
      const result = await joinGame(confirmedTagIds);
      if (result.joinStatus === "WAITLISTED") {
        setActionSuccess(
          `You're on the waitlist (#${result.waitlistPosition})`,
        );
      } else {
        setActionSuccess("Successfully joined the game!");
      }
      setShowJoinConfirmationModal(false);
    } catch (err: any) {
      setActionError(err.message || "Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setActionError(null);
    setIsLeaving(true);
    try {
      await leaveGame();
      setActionSuccess("Successfully left the game");
    } catch (err: any) {
      setActionError(err.message || "Failed to leave game");
    } finally {
      setIsLeaving(false);
    }
  };

  // US-2.4: Organizer cancel game
  const handleCancel = async () => {
    setActionError(null);
    setIsCancelling(true);
    try {
      await cancelGame();
      setActionSuccess('Game has been cancelled');
      setShowCancelConfirm(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel game');
    } finally {
      setIsCancelling(false);
    }
  };

  // US-2.4: Share game link
  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const chatMessages = [
    {
      id: "1",
      user: "Minh H.",
      avatar: "MH",
      message: "Hey everyone! Looking forward to the game!",
      time: "2:30 PM",
      isHost: true,
    },
    {
      id: "2",
      user: "Omar E.",
      avatar: "OE",
      message: "Should we bring our own ball or will there be one?",
      time: "2:45 PM",
    },
    {
      id: "3",
      user: "Minh H.",
      avatar: "MH",
      message: "I'll bring one, but backup is always good!",
      time: "2:47 PM",
      isHost: true,
    },
    {
      id: "4",
      user: "Asif A.",
      avatar: "AA",
      message: "Is there parking nearby?",
      time: "3:15 PM",
    },
    {
      id: "5",
      user: "Melissa R.",
      avatar: "MR",
      message:
        "Yes, street parking on Gary-Carter. Usually easy to find a spot.",
      time: "3:18 PM",
    },
  ];

  const spotsAvailable = game.maxPlayers - roster.confirmed.length;
  const isOutdoor = game.indoorOutdoor === "outdoor";

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-br from-gray-900 to-gray-700">
        <img
          src={getSportImage(game.sportName)}
          alt={game.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
                {game.sportName}
              </span>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
                {game.skillBand || "All Levels"}
              </span>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-sm">
                {game.intensityBand || "Medium"} Intensity
              </span>
              {game.minReliabilityRequired != null && (
                <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                  Min {game.minReliabilityRequired}% Reliability
                </span>
              )}
              {game.tags &&
                game.tags.length > 0 &&
                game.tags.map((tag: any) => (
                  <span
                    key={tag.tagId}
                    className={`px-3 py-1 rounded-full text-sm capitalize ${tag.isRestricted
                        ? "bg-amber-500 text-white"
                        : "bg-blue-500/90 text-white"
                      }`}
                  >
                    {tag.isRestricted && "⚠️ "}
                    {tag.name.replace("-", " ")}
                  </span>
                ))}
              {(game.minAge || game.maxAge) && (
                <span className="px-3 py-1 bg-purple-500/90 text-white rounded-full text-sm">
                  Ages {game.minAge || "13"}–{game.maxAge || "120"}
                </span>
              )}
            </div>
            <h1 className="text-4xl text-white mb-2">{game.title}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>
                  {formattedDate} at {formattedTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {game.location?.name ||
                    game.approximateLocation ||
                    "Location Hidden"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Messages */}
            {actionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {actionError}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === "details"
                        ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("lineup")}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === "lineup"
                        ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    Lineup ({roster.confirmed.length}/{game.maxPlayers})
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 px-6 py-4 text-center transition-colors ${activeTab === "chat"
                        ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Chat</span>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col min-w-0">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">
                        About this game
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {game.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <InfoCard
                        icon={<Clock />}
                        label="Duration"
                        value={duration}
                      />
                      <InfoCard
                        icon={<Users />}
                        label="Players"
                        value={`${roster.confirmed.length}/${game.maxPlayers}`}
                      />
                      <InfoCard
                        icon={<MapPin />}
                        label="Location Type"
                        value={isOutdoor ? "Outdoor" : "Indoor"}
                      />
                      <InfoCard
                        icon={<Sun />}
                        label="Weather"
                        value={isOutdoor ? "Check forecast" : "N/A"}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">Location</h3>
                      <div className="p-4 bg-gray-100 rounded-lg">
                        {game.hasExactLocationAccess && game.location ? (
                          <>
                            <p className="text-gray-900 mb-1">
                              {game.location.name}
                            </p>
                            <p className="text-gray-600 text-sm mb-3">
                              {game.location.addressLine || game.location.city}
                            </p>
                            <a
                              href={
                                game.location.latitude &&
                                  game.location.longitude
                                  ? `https://www.google.com/maps/search/?api=1&query=${game.location.latitude},${game.location.longitude}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.location.addressLine || game.location.name || game.location.city || "")}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Open in Google Maps</span>
                            </a>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <p className="text-gray-900 font-medium">
                                {game.approximateLocation || "Location hidden"}
                              </p>
                            </div>
                            <p className="text-gray-500 text-sm italic">
                              {isAuthenticated
                                ? "Join this game to view the exact location."
                                : "Sign in and join to view location."}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Community Tags & Age Requirements */}
                    {((game.tags && game.tags.length > 0) ||
                      game.minAge ||
                      game.maxAge) && (
                        <div>
                          <h3 className="text-lg text-gray-900 mb-3">
                            Community Requirements
                          </h3>
                          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                            {game.tags && game.tags.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-600 mb-2">
                                  This game is tagged for specific communities:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {game.tags.map((tag: any) => (
                                    <span
                                      key={tag.tagId}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${tag.isRestricted
                                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                                          : "bg-blue-100 text-blue-800 border border-blue-200"
                                        }`}
                                    >
                                      {tag.isRestricted && "⚠️ "}
                                      {tag.name.replace("-", " ")}
                                    </span>
                                  ))}
                                </div>
                                {game.tags.some(
                                  (tag: any) => tag.isRestricted,
                                ) && (
                                    <p className="text-sm text-amber-700 mt-2 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <span>
                                        Tags marked with ⚠️ require confirmation
                                        when joining
                                      </span>
                                    </p>
                                  )}
                              </div>
                            )}
                            {(game.minAge || game.maxAge) && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">
                                  Age Requirement:
                                </p>
                                <p className="text-gray-900 font-medium">
                                  {game.minAge && game.maxAge
                                    ? `${game.minAge}–${game.maxAge} years old`
                                    : game.minAge
                                      ? `${game.minAge}+ years old`
                                      : `Up to ${game.maxAge} years old`}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">
                        Game Rules & Requirements
                      </h3>
                      {game.minReliabilityRequired != null && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-amber-900 font-semibold mb-1">Reputation-Gated Game</h4>
                              <p className="text-sm text-amber-700">
                                This game requires a minimum reliability score of <span className="font-semibold">{game.minReliabilityRequired}%</span> to join.
                                {user && user.reliabilityScore < game.minReliabilityRequired && (
                                  <span className="block mt-1 text-amber-800">
                                    Your score: {user.reliabilityScore}% - You need {game.minReliabilityRequired}% to join.
                                  </span>
                                )}
                                {user && user.reliabilityScore >= game.minReliabilityRequired && (
                                  <span className="block mt-1 text-emerald-700">
                                    ✓ Your score: {user.reliabilityScore}% - You meet the requirement!
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Players must check in 15 minutes before start time
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Teams will be balanced based on skill ratings
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>Bring your own water and towel</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>
                            Respectful play - follow the code of conduct
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "lineup" && (
                  <div className="space-y-6">
                    {/* Team Balancing Info */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-emerald-900 mb-1">
                            Smart Team Balancing Active
                          </h4>
                          <p className="text-sm text-emerald-700">
                            Teams are automatically balanced based on skill
                            levels and positions for fair play.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confirmed Players */}
                    <div>
                      <h3 className="text-lg text-gray-900 mb-3">
                        Confirmed ({roster.confirmed.length})
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {roster.confirmed.map((player) => (
                          <div
                            key={player.participationId}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                              {player.displayName?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profile/${player.displayName?.toLowerCase().replace(/\s+/g, "-") || player.userId}`}
                                  className="text-gray-900 truncate hover:text-emerald-600 transition-colors"
                                >
                                  {player.displayName}
                                </Link>
                                {player.role === "ORGANIZER" && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                                    Host
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">
                                  Reliability: {Math.round(player.reliabilityScore)}%
                                </span>
                              </div>
                            </div>

                            {/* Endorsement UI - US 3.3 Organizer Endorsements */}
                            {isOrganizer &&
                              player.attendanceStatus === "ATTENDED" &&
                              player.userId !== user?.userId &&
                              (player.isEndorsedByOrganizer ? (
                                <div
                                  className="p-2 text-yellow-500"
                                  title="Organizer's Pick (Endorsed)"
                                >
                                  <Medal className="w-5 h-5 fill-current" />
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEndorse(player.userId)}
                                  className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                                  title="Endorse as Organizer's Pick"
                                >
                                  <Medal className="w-5 h-5" />
                                </button>
                              ))}

                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Waitlist */}
                    {roster.waitlisted.length > 0 && (
                      <div>
                        <h3 className="text-lg text-gray-900 mb-3">
                          Waitlist ({roster.waitlisted.length})
                        </h3>
                        <div className="space-y-2">
                          {roster.waitlisted.map((player) => (
                            <div
                              key={player.participationId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white">
                                  {player.displayName?.[0] || "?"}
                                </div>
                                <div>
                                  <Link
                                    href={`/profile/${player.displayName?.toLowerCase().replace(/\s+/g, "-") || player.userId}`}
                                    className="text-gray-900 hover:text-emerald-600 transition-colors"
                                  >
                                    {player.displayName}
                                  </Link>
                                  <div className="text-sm text-gray-600">
                                    Reliability: {Math.round(player.reliabilityScore)}%
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                #{player.waitlistPosition}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "chat" && (
                  <div className="w-full min-w-0">
                    {/* forces ChatPanel to take full width and stack vertically */}
                    <div className="w-full min-w-0 flex flex-col">
                      <ChatPanel
                        gameId={id}
                        me={{
                          id: user?.userId || "anonymous",
                          name: user?.displayName || "Unknown",
                        }}
                        hostUserId={game.organizer?.userId}
                        canChat={Boolean(
                          isOrganizer ||
                          currentUserParticipation?.joinStatus === "CONFIRMED",
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Spots Available</span>
                  <span className="text-emerald-600">
                    {spotsAvailable > 0 ? `${spotsAvailable} left` : "Full"}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${(roster.confirmed.length / game.maxPlayers) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {isParticipant ? (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      <span>
                        {isWaitlisted
                          ? `You're on the waitlist (#${(currentUserParticipation as any)?.waitlistPosition || "?"})`
                          : "You're in this game!"}
                      </span>
                    </div>
                  </div>
                  {!isOrganizer && (
                    <button
                      onClick={handleLeave}
                      disabled={isLeaving}
                      className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLeaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserMinus className="w-5 h-5" />
                      )}
                      <span>Leave Game</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!isAuthenticated ? (
                    <button
                      onClick={() => navigate.push("/login")}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mb-3 flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login to Join</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mb-3 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : null}
                      <span>
                        {spotsAvailable > 0 ? "Join Game" : "Join Waitlist"}
                      </span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleShare}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                {shareSuccess ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
                <span>{shareSuccess ? 'Link Copied!' : 'Share Game'}</span>
              </button>

              {/* US-2.4: Organizer Cancel Game Control */}
              {isOrganizer && game.status === 'SCHEDULED' && (
                <>
                  {!showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Cancel Game</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                      <p className="text-red-700 text-sm">Are you sure you want to cancel this game? This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          No, Keep
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={isCancelling}
                          className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                          {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Show cancelled badge if game is cancelled */}
              {game.status === 'CANCELLED' && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center">
                  <XCircle className="w-5 h-5 inline mr-2" />
                  This game has been cancelled
                </div>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Flag className="w-5 h-5" />
                  <span>Report Game</span>
                </button>
              )}
            </div>

            {/* Host Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900">Hosted by</h3>
                {canEdit && (
                  <button
                    onClick={handleOpenEditModal}
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit game settings"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white">
                  {game.organizer?.displayName?.[0] || "H"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/profile/${game.organizer?.displayName?.toLowerCase().replace(/\s+/g, "-") || "host"}`}
                      className="text-gray-900 hover:text-emerald-600 transition-colors"
                    >
                      {game.organizer?.displayName || "Host"}
                    </Link>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      Reliability: {Math.round(game.organizer?.reliabilityScore ?? 100)}%
                    </span>
                  </div>
                  <Link
                    href={`/profile/${game.organizer?.displayName?.toLowerCase().replace(/\s+/g, "-") || "host"}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
              
              {/* US-6.1: Organizer Quality Score */}
              {game.organizer?.userId && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <OrganizerQualityBadge 
                    userId={game.organizer.userId}
                    variant="compact"
                    showInfoCard={true}
                  />
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Check-in opens</span>
                  <span className="text-gray-900">15 min before</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Game starts</span>
                  <span className="text-gray-900">{formattedTime}</span>
                </div>
                {formattedEndTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Estimated end</span>
                    <span className="text-gray-900">{formattedEndTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weather Alert */}
            {isOutdoor && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-900 mb-1">Outdoor Game</h4>
                    <p className="text-sm text-amber-700">
                      Check the weather forecast before the game.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameId={game.gameId}
        targetName={game.title}
        reportType="game"
      />

      {/* Edit Game Settings Modal - US-4.1 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Game Settings</DialogTitle>
            <DialogDescription>
              Update game settings before it starts. Changes apply immediately to new join attempts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="min-reliability-edit" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Reliability Score (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="min-reliability-edit"
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.minReliabilityRequired}
                  onChange={(e) => setEditFormData({ ...editFormData, minReliabilityRequired: e.target.value })}
                  placeholder="e.g., 85"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-gray-600">%</span>
                {editFormData.minReliabilityRequired && (
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, minReliabilityRequired: "" })}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Players with a score below this threshold cannot join. Leave empty to allow all players.
              </p>
              {user && (
                <p className="text-xs text-emerald-700 mt-1">
                  Your reliability score: <span className="font-semibold">{user.reliabilityScore}%</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateGame}
              disabled={isUpdating}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Join Confirmation Modal */}
      <JoinConfirmationModal
        isOpen={showJoinConfirmationModal}
        onClose={() => setShowJoinConfirmationModal(false)}
        onConfirm={performJoin}
        restrictedTags={game.tags?.filter((tag: any) => tag.isRestricted) || []}
        minAge={game.minAge}
        maxAge={game.maxAge}
        isJoining={isJoining}
      />
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-emerald-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );
}
