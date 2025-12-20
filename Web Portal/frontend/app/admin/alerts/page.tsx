"use client";

import Link from "next/link";
import { useState } from "react";

export default function Alerts() {
  const [filter, setFilter] = useState("all");

  const mockAlerts = [
    {
      id: 1,
      type: "high_anomaly",
      severity: "high",
      title: "High Anomaly Count Detected",
      message:
        "Project proj_002 has 2 critical anomalies requiring immediate attention",
      projectId: "proj_002",
      projectAddress: "5678 Boulevard Saint-Laurent",
      timestamp: "2024-03-14 14:23",
      status: "unread",
      action: "Review Project",
    },
    {
      id: 2,
      type: "source_change",
      severity: "medium",
      title: "Source Document Updated",
      message: "Changes detected in source document for proj_005",
      projectId: "proj_005",
      projectAddress: "1357 Rue Notre-Dame Ouest",
      timestamp: "2024-03-14 12:15",
      status: "unread",
      action: "View Changes",
    },
    {
      id: 3,
      type: "low_confidence",
      severity: "medium",
      title: "Low OCR Confidence",
      message: "OCR confidence below threshold (68%) for proj_006",
      projectId: "proj_006",
      projectAddress: "3456 Avenue Mont-Royal Est",
      timestamp: "2024-03-14 10:45",
      status: "read",
      action: "Manual Review",
    },
    {
      id: 4,
      type: "quality_drop",
      severity: "high",
      title: "Quality Score Drop",
      message: "Project quality score dropped from 95% to 72% after update",
      projectId: "proj_002",
      projectAddress: "5678 Boulevard Saint-Laurent",
      timestamp: "2024-03-14 09:30",
      status: "read",
      action: "Investigate",
    },
    {
      id: 5,
      type: "validation_needed",
      severity: "low",
      title: "Projects Awaiting Validation",
      message: "5 projects have been in 'Draft' status for over 7 days",
      timestamp: "2024-03-14 08:00",
      status: "read",
      action: "View Projects",
    },
    {
      id: 6,
      type: "ai_suggestion",
      severity: "low",
      title: "AI Recommendations Available",
      message: "New AI suggestions available for 3 projects",
      timestamp: "2024-03-13 16:20",
      status: "read",
      action: "View Suggestions",
    },
    {
      id: 7,
      type: "scraper_error",
      severity: "high",
      title: "Scraper Service Error",
      message: "Failed to fetch data from Montreal permits portal",
      timestamp: "2024-03-13 14:00",
      status: "read",
      action: "Check Logs",
    },
    {
      id: 8,
      type: "workflow_complete",
      severity: "info",
      title: "Automated Workflow Completed",
      message: "Batch processing of 12 projects completed successfully",
      timestamp: "2024-03-13 11:30",
      status: "read",
      action: "View Report",
    },
  ];

  const filteredAlerts =
    filter === "all"
      ? mockAlerts
      : filter === "unread"
        ? mockAlerts.filter((a) => a.status === "unread")
        : mockAlerts.filter((a) => a.severity === filter);

  const stats = {
    total: mockAlerts.length,
    unread: mockAlerts.filter((a) => a.status === "unread").length,
    high: mockAlerts.filter((a) => a.severity === "high").length,
    medium: mockAlerts.filter((a) => a.severity === "medium").length,
    low: mockAlerts.filter((a) => a.severity === "low").length,
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "high_anomaly":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "source_change":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "scraper_error":
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6"
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
        );
    }
  };

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
                Alerts & Notifications
              </h1>
              <p className="text-gray-200 text-lg">
                Monitor system alerts and project notifications
              </p>
            </div>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
            <p className="text-sm text-gray-300 mb-1">Total Alerts</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
            <p className="text-sm text-gray-300 mb-1">Unread</p>
            <p className="text-2xl font-bold text-blue-400">{stats.unread}</p>
          </div>
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
            <p className="text-sm text-gray-300 mb-1">High Priority</p>
            <p className="text-2xl font-bold text-red-400">{stats.high}</p>
          </div>
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
            <p className="text-sm text-gray-300 mb-1">Medium</p>
            <p className="text-2xl font-bold text-orange-400">{stats.medium}</p>
          </div>
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg">
            <p className="text-sm text-gray-300 mb-1">Low Priority</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.low}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-lg mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-300">
              Filter by:
            </span>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Unread ({stats.unread})
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "high"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              High Priority ({stats.high})
            </button>
            <button
              onClick={() => setFilter("medium")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "medium"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Medium ({stats.medium})
            </button>
            <button
              onClick={() => setFilter("low")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "low"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Low ({stats.low})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border-2 shadow-lg transition-all hover:shadow-xl ${
                alert.status === "unread"
                  ? "border-teal-500"
                  : "border-gray-700"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityStyles(
                    alert.severity
                  )}`}
                >
                  {getAlertIcon(alert.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white text-lg">
                          {alert.title}
                        </h3>
                        {alert.status === "unread" && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300">{alert.message}</p>
                      {alert.projectAddress && (
                        <p className="text-sm text-gray-400 mt-2">
                          Project: {alert.projectAddress}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        alert.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : alert.severity === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : alert.severity === "low"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {alert.severity === "info"
                        ? "Info"
                        : `${alert.severity} priority`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">{alert.timestamp}</p>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        Dismiss
                      </button>
                      {alert.projectId && (
                        <Link
                          href={`/admin/projects/${alert.projectId}`}
                          className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          {alert.action}
                        </Link>
                      )}
                      {!alert.projectId && (
                        <button className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                          {alert.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">
              No alerts found
            </h3>
            <p className="text-gray-300">
              You're all caught up! No alerts match your current filter.
            </p>
          </div>
        )}

        {/* Alert Settings */}
        <div className="mt-8 bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Alert Preferences
              </h3>
              <p className="text-gray-300">
                Configure which alerts and notifications you receive
              </p>
            </div>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
              Manage Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
