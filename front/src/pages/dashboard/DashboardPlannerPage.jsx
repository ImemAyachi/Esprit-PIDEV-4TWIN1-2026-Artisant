import React from 'react';
import AIProjectPlanner from '../../components/dashboard/AIProjectPlanner';
import '../../styles/planner-pidev.css';

/** Planner inside dashboard layout (sidebar + topbar); available to every logged-in role. */
export default function DashboardPlannerPage() {
  return (
    <div className="planner-pidev" style={{ maxWidth: 1240, margin: '0 auto' }}>
      <AIProjectPlanner />
    </div>
  );
}
