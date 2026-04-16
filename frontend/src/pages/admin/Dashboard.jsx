import React, { useEffect } from "react";
import { Calendar, Home, ChevronRight } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import socketService from "../../socket.js";
import {
  addNotification,
  setNotifications,
} from "../../store/slices/notificationSlice.js";
import { useGetNotificationsQuery } from "../../store/api/notificationApi.js";
import NotificationBell from "../../components/NotificationBell.jsx";
import DashboardAnalytics from "../../components/dashboard/DashboardAnalytics.jsx";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const { data: notificationsData, isLoading } = useGetNotificationsQuery();

  useEffect(() => {
    if (userId) {
      socketService.connect(userId);
      const handleNewNotification = (notification) => {
        console.log("New notification received:", notification);
        dispatch(addNotification(notification));
        if (Notification.permission === "granted") {
          new Notification("New Notification", {
            body: notification.message,
            icon: "/notification-icon.png",
          });
        }
      };

      socketService.on("receive-notification", handleNewNotification);
      return () => {
        socketService.off("receive-notification", handleNewNotification);
        socketService.disconnect();
      };
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (notificationsData?.notifications || Array.isArray(notificationsData)) {
      dispatch(setNotifications(notificationsData.notifications || notificationsData));
    }
  }, [notificationsData, dispatch]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4 -m-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

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
