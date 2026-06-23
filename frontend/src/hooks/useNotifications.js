import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketService from "../socket";
import {
  addNotification,
  setNotifications,
  markAsRead,
} from "../store/slices/notificationSlice";
import { logout } from "../store/slices/authSlice";
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from "../store/api/notificationApi";

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notification);
  
  const { data, isLoading, error } = useGetNotificationsQuery(undefined, {
    skip: !token,
  });
  
  const [markAsReadMutation] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    const message = error?.data?.message || error?.error || "";
    if (
      error &&
      (error?.status === 401 ||
        error?.status === 404 ||
        /user not found|session expired/i.test(message))
    ) {
      dispatch(logout());
    }
  }, [error, dispatch]);

  // Initialize socket connection and listeners
  useEffect(() => {
    if (!user?._id || !token) return;

    // Connect to socket
    socketService.connect(user._id);

    // Listen for new notifications
    const handleNewNotification = (notification) => {
      dispatch(addNotification(notification));
      
      // Optional: Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Notification", {
          body: notification.message,
          icon: "/notification-icon.png",
        });
      }
    };

    socketService.on("receive-notification", handleNewNotification);

    // Load initial notifications
    if (data?.notifications || Array.isArray(data)) {
      dispatch(setNotifications(data.notifications || data));
    }

    // Cleanup
    return () => {
      socketService.off("receive-notification", handleNewNotification);
    };
  }, [user, token, data, dispatch]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      try {
        await markAsReadMutation(notificationId).unwrap();
        dispatch(markAsRead(notificationId));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [markAsReadMutation, dispatch]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markNotificationAsRead,
  };
};
