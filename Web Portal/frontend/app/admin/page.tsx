"use client";

import Link from "next/link";
import { useState } from "react";
import adminProjects from "@/data/admin-projects.json";

export default function AdminDashboard() {
  const [projects] = useState(adminProjects);

  // Calculate statistics
  const stats = {
    total: projects.length,
    draft: projects.filter((p) => p.status === "Draft").length,
    inReview: projects.filter((p) => p.status === "In Review").length,
    verified: projects.filter((p) => p.status === "Verified").length,
    published: projects.filter((p) => p.status === "Published").length,
    avgQuality: Math.round(
      projects.reduce((acc, p) => acc + p.qualityScore, 0) / projects.length
    ),
    anomalies: projects.filter((p) => p.anomalies.length > 0).length,
    changesDetected: projects.filter((p) => p.changesDetected).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Project Management System
          </h1>
          <p className="text-gray-200 text-lg">
            Admin dashboard for validating and managing scraped municipal
            projects
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Total Projects
              </h3>
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Avg Quality Score
              </h3>
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgQuality}%</p>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">Anomalies</h3>
              <svg
                className="w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.anomalies}</p>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Changes Detected
              </h3>
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.changesDetected}
            </p>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Project Pipeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/admin/projects?status=draft"
              className="group p-4 rounded-lg border-2 border-gray-700 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300 group-hover:text-yellow-400">
                  Draft
                </span>
                <span className="text-2xl font-bold text-white">
                  {stats.draft}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(stats.draft / stats.total) * 100}%`,
                  }}
                ></div>
              </div>
            </Link>

            <Link
              href="/admin/projects?status=in-review"
              className="group p-4 rounded-lg border-2 border-gray-700 hover:border-blue-400 hover:bg-blue-500/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400">
                  In Review
                </span>
                <span className="text-2xl font-bold text-white">
                  {stats.inReview}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{
                    width: `${(stats.inReview / stats.total) * 100}%`,
                  }}
                ></div>
              </div>
            </Link>

            <Link
              href="/admin/projects?status=verified"
              className="group p-4 rounded-lg border-2 border-gray-700 hover:border-teal-400 hover:bg-teal-500/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300 group-hover:text-teal-400">
                  Verified
                </span>
                <span className="text-2xl font-bold text-white">
                  {stats.verified}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-teal-400 h-2 rounded-full"
                  style={{
                    width: `${(stats.verified / stats.total) * 100}%`,
                  }}
                ></div>
              </div>
            </Link>

            <Link
              href="/admin/projects?status=published"
              className="group p-4 rounded-lg border-2 border-gray-700 hover:border-green-400 hover:bg-green-500/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300 group-hover:text-green-400">
                  Published
                </span>
                <span className="text-2xl font-bold text-white">
                  {stats.published}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full"
                  style={{
                    width: `${(stats.published / stats.total) * 100}%`,
                  }}
                ></div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/projects"
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Manage Projects
                </h3>
                <p className="text-sm text-gray-400">
                  Review and validate projects
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Analytics & Reports
                </h3>
                <p className="text-sm text-gray-400">View quality metrics</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/alerts"
            className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  Alerts & Notifications
                </h3>
                <p className="text-sm text-gray-400">Monitor system alerts</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Projects</h2>
            <Link
              href="/admin/projects"
              className="text-teal-400 hover:text-teal-300 text-sm font-medium inline-flex items-center gap-1"
            >
              View All
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="block p-4 rounded-lg border border-gray-700 hover:border-teal-400 hover:bg-gray-700/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {project.address}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {project.district} • {project.type}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                      <span className="text-xs text-slate-500">
                        Quality: {project.qualityScore}%
                      </span>
                      {project.anomalies.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                          {project.anomalies.length} anomalies
                        </span>
                      )}
                      {project.changesDetected && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          Changes detected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {project.lastUpdate}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
