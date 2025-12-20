"use client";

import Link from "next/link";
import { useState } from "react";
import adminProjects from "@/data/admin-projects.json";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30days");

  // Calculate analytics
  const stats = {
    totalProjects: adminProjects.length,
    avgQuality: adminProjects.length > 0 
      ? Math.round(
          adminProjects.reduce((acc, p) => acc + p.qualityScore, 0) /
            adminProjects.length
        )
      : 0,
    avgOCR: adminProjects.length > 0
      ? Math.round(
          adminProjects.reduce((acc, p) => acc + p.ocrConfidence, 0) /
            adminProjects.length
        )
      : 0,
    anomalyRate: adminProjects.length > 0
      ? Math.round(
          (adminProjects.filter((p) => p.anomalies.length > 0).length /
            adminProjects.length) *
            100
        )
      : 0,
    published: adminProjects.filter((p) => p.status === "Published").length,
    inReview: adminProjects.filter((p) => p.status === "In Review").length,
    draft: adminProjects.filter((p) => p.status === "Draft").length,
    verified: adminProjects.filter((p) => p.status === "Verified").length,
  };

  const qualityDistribution = [
    {
      range: "90-100%",
      count: adminProjects.filter((p) => p.qualityScore >= 90).length,
      color: "bg-green-500",
    },
    {
      range: "75-89%",
      count: adminProjects.filter(
        (p) => p.qualityScore >= 75 && p.qualityScore < 90
      ).length,
      color: "bg-blue-500",
    },
    {
      range: "60-74%",
      count: adminProjects.filter(
        (p) => p.qualityScore >= 60 && p.qualityScore < 75
      ).length,
      color: "bg-yellow-500",
    },
    {
      range: "<60%",
      count: adminProjects.filter((p) => p.qualityScore < 60).length,
      color: "bg-orange-500",
    },
  ];

  const topAnomalies = [
    { type: "Missing architect details", count: 1, severity: "medium" },
    { type: "Incomplete address", count: 1, severity: "high" },
    { type: "Floor count mismatch", count: 1, severity: "high" },
    { type: "Low OCR confidence", count: 1, severity: "medium" },
    { type: "Missing building type", count: 1, severity: "low" },
  ];

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Analytics & Reports
              </h1>
              <p className="text-gray-200 text-lg">
                Data quality insights and performance metrics
              </p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
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
            <p className="text-3xl font-bold text-white">
              {stats.totalProjects}
            </p>
            <p className="text-sm text-green-400 mt-2">+12% from last month</p>
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
            <p className="text-sm text-green-400 mt-2">+5% from last month</p>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Avg OCR Confidence
              </h3>
              <svg
                className="w-5 h-5 text-teal-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgOCR}%</p>
            <p className="text-sm text-green-400 mt-2">+2% from last month</p>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Anomaly Rate
              </h3>
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
            <p className="text-3xl font-bold text-white">
              {stats.anomalyRate}%
            </p>
            <p className="text-sm text-red-400 mt-2">-8% from last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">
              Project Status Distribution
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Published</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.published} (
                    {Math.round((stats.published / stats.totalProjects) * 100)}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(stats.published / stats.totalProjects) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Verified</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.verified} (
                    {Math.round((stats.verified / stats.totalProjects) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-teal-500 h-3 rounded-full"
                    style={{
                      width: `${(stats.verified / stats.totalProjects) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">In Review</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.inReview} (
                    {Math.round((stats.inReview / stats.totalProjects) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${(stats.inReview / stats.totalProjects) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Draft</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.draft} (
                    {Math.round((stats.draft / stats.totalProjects) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{
                      width: `${(stats.draft / stats.totalProjects) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Score Distribution */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">
              Quality Score Distribution
            </h2>
            <div className="space-y-4">
              {qualityDistribution.map((dist) => (
                <div key={dist.range}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">{dist.range}</span>
                    <span className="text-sm font-semibold text-white">
                      {dist.count} projects
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className={`${dist.color} h-3 rounded-full`}
                      style={{
                        width: `${(dist.count / stats.totalProjects) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Anomalies */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Top Data Anomalies
          </h2>
          <div className="space-y-3">
            {topAnomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{anomaly.type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          anomaly.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : anomaly.severity === "medium"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {anomaly.severity} severity
                      </span>
                      <span className="text-sm text-gray-400">
                        {anomaly.count} occurrence(s)
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="font-bold text-white mb-4">Processing Speed</h3>
            <p className="text-3xl font-bold text-white mb-2">2.4 min</p>
            <p className="text-sm text-gray-400">Avg time per project</p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-green-400">
                15% faster than last month
              </p>
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="font-bold text-white mb-4">Validation Rate</h3>
            <p className="text-3xl font-bold text-white mb-2">87%</p>
            <p className="text-sm text-gray-400">First-pass validation</p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-green-400">+3% from last month</p>
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="font-bold text-white mb-4">AI Accuracy</h3>
            <p className="text-3xl font-bold text-white mb-2">94%</p>
            <p className="text-sm text-gray-400">AI suggestion accuracy</p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-green-400">+7% from last month</p>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Export Analytics Report
              </h3>
              <p className="text-gray-300">
                Generate a comprehensive report of all metrics and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 font-medium">
                Export CSV
              </button>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                Export PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
