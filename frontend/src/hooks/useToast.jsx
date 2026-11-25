import { toast } from "react-toastify";

function addToast(message, type = "success", duration = 3000) {
  return toast(message, { type, autoClose: duration || false });
}

export const useToast = () => ({ addToast });
