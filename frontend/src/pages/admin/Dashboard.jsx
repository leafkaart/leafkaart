import DashboardAnalytics from "../../components/dashboard/DashboardAnalytics.jsx";

const AdminDashboard = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <main className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
        </div>
        <DashboardAnalytics />
      </main>
    </div>
  );
};

export default AdminDashboard;
