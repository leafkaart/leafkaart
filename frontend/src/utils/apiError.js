export function apiErrorMessage(error, fallback) {
  const status = error?.response?.status ?? error?.originalStatus ?? error?.status;
  const body = error?.response?.data ?? error?.data;
  if (typeof body?.message === "string") return body.message;
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 413) return "The file exceeds the upload size limit.";
  if (status === 415) return "This file format is not supported.";
  return fallback;
}
