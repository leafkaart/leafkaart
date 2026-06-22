import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import socketService from "../../socket.js";
import {
  addNotification,
  setNotifications,
} from "../../store/slices/notificationSlice.js";
import { useGetNotificationsQuery } from "../../store/api/notificationApi.js";
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
