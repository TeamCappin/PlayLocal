"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import adminProjects from "@/data/admin-projects.json";

export default function AdminProjectsList() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");
  const [sortBy, setSortBy] = useState("lastUpdate");

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...adminProjects];

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (p) => p.status.toLowerCase().replace(/\s+/g, "-") === selectedStatus
      );
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.architect.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort projects
    filtered.sort((a, b) => {
      if (sortBy === "lastUpdate") {
        return (
          new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
        );
      } else if (sortBy === "quality") {
        return b.qualityScore - a.qualityScore;
      } else if (sortBy === "address") {
        return a.address.localeCompare(b.address);
      }
      return 0;
    });

    return filtered;
  }, [searchQuery, selectedStatus, sortBy]);

  const stats = filteredProjects.reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === "Draft") acc.draft++;
      else if (p.status === "In Review") acc.inReview++;
      else if (p.status === "Verified") acc.verified++;
      else if (p.status === "Published") acc.published++;
      return acc;
    },
    { total: 0, draft: 0, inReview: 0, verified: 0, published: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-200 hover:text-white mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Project Management
          </h1>
          <p className="text-gray-200 text-lg">
            Review, validate, and manage all scraped projects
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by address, district, architect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft ({stats.draft})</option>
                <option value="in-review">In Review ({stats.inReview})</option>
                <option value="verified">Verified ({stats.verified})</option>
                <option value="published">Published ({stats.published})</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="lastUpdate">Last Updated</option>
                <option value="quality">Quality Score</option>
                <option value="address">Address</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {stats.draft}
              </p>
              <p className="text-sm text-gray-400">Draft</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.inReview}
              </p>
              <p className="text-sm text-gray-400">In Review</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">
                {stats.verified}
              </p>
              <p className="text-sm text-gray-400">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {stats.published}
              </p>
              <p className="text-sm text-gray-400">Published</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800/90 border border-gray-700 rounded-lg hover:bg-gray-700/90 transition-colors">
              Select All
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Bulk Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Bulk Assign
            </button>
          </div>
          <p className="text-sm text-gray-200">
            Showing {filteredProjects.length} projects
          </p>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
                />

                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="text-xl font-bold text-white hover:text-teal-400 transition-colors"
                      >
                        {project.address}
                      </Link>
                      <p className="text-sm text-gray-400 mt-1">
                        {project.district} • {project.type} •{" "}
                        {project.architect}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        project.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : project.status === "Verified"
                            ? "bg-teal-100 text-teal-700"
                            : project.status === "In Review"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Quality Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              project.qualityScore >= 90
                                ? "bg-green-500"
                                : project.qualityScore >= 75
                                  ? "bg-blue-500"
                                  : "bg-orange-500"
                            }`}
                            style={{ width: `${project.qualityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {project.qualityScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">OCR Confidence</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {project.ocrConfidence}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Documents</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {project.documentsCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Update</p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {project.lastUpdate}
                      </p>
                    </div>
                  </div>

                  {/* Badges and Alerts */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.anomalies.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {project.anomalies.length} anomalies
                      </span>
                    )}
                    {project.changesDetected && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Changes detected
                      </span>
                    )}
                    {project.aiSuggestions.length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {project.aiSuggestions.length} AI suggestions
                      </span>
                    )}
                    {project.assignedTo && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        Assigned to {project.assignedTo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-center"
                  >
                    Review
                  </Link>
                  <button className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-12 border border-gray-700 text-center">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">
              No projects found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
