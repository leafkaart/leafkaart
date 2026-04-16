import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationAsRead } = useNotifications();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.toLowerCase() || "admin";

  const getNotificationRoute = (notification) => {
    const roleBasePath = `/${role}`;

    if (notification.type === "order") {
      return notification.orderId
        ? `${roleBasePath}/orders/${notification.orderId}`
        : `${roleBasePath}/orders`;
    }

    if (notification.type === "product") {
      return notification.productId
        ? `${roleBasePath}/products/${notification.productId}`
        : `${roleBasePath}/products`;
    }

    if (notification.type === "dealer") {
      if (role === "admin" || role === "employee") {
        return `${roleBasePath}/dealers`;
      }

      return "/dealer/dashboard";
    }

    return `${roleBasePath}/products`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }

    setIsOpen(false);
    navigate(getNotificationRoute(notification));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
