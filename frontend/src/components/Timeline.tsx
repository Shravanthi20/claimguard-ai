import React from "react";
import { ClaimEvent } from "../types";

interface TimelineProps {
  events: ClaimEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return <p className="text-xs text-slate-500 italic">No timeline events recorded yet.</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-800 ml-3 space-y-6 py-2">
      {events.map((event) => (
        <div key={event.id} className="relative pl-6 group">
          {/* Node Icon */}
          <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-950 group-hover:scale-125 transition-transform" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-sm font-semibold text-slate-200">
              {event.eventType.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(event.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">{event.description}</p>
          {event.createdBy && (
            <span className="inline-block text-[10px] text-slate-500 mt-1 font-medium">
              By: {event.createdBy}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
