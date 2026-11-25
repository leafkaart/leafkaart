import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { connectNotifications } from "../socket";
import { logout } from "../store/slices/authSlice";
import { apiErrorMessage } from "../utils/apiError";
import {
  notificationApi,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "../store/api/notificationApi";

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;
  const { currentData, isLoading, error, refetch } = useGetNotificationsQuery(userId, {
    skip: !token || !userId,
    refetchOnMountOrArgChange: true,
  });
  const [markAsRead] = useMarkNotificationAsReadMutation();

  useEffect(() => {
    if (error?.status === 401) dispatch(logout());
  }, [error, dispatch]);

  useEffect(() => {
    if (!userId || !token) return;
    const socket = connectNotifications(token);
    const updateList = (update) =>
      dispatch(notificationApi.util.updateQueryData("getNotifications", userId, update));

    socket.on("receive-notification", (notification) => {
      if (String(notification.userId) !== String(userId) || notification.isRead) return;
      updateList((draft) => {
        if (!draft.notifications.some((item) => item._id === notification._id)) {
          draft.notifications.unshift(notification);
        }
      });
    });
    socket.on("notification-read", (notificationId) => {
      updateList((draft) => {
        draft.notifications = draft.notifications.filter((item) => item._id !== notificationId);
      });
    });
    socket.on("connect", refetch);
    return () => socket.disconnect();
  }, [userId, token, dispatch, refetch]);

  async function markNotificationAsRead(notificationId) {
    try {
      await markAsRead({ notificationId, userId }).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not mark the notification as read."));
    }
  }

  const notifications = token && userId ? currentData?.notifications || [] : [];
  return { notifications, unreadCount: notifications.length, isLoading, error, markNotificationAsRead };
};
