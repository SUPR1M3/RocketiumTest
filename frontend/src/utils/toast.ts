import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultOptions, ...options });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultOptions, ...options });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultOptions, ...options });
};

// Helper to show API error messages
export const showApiError = (error: any) => {
  if (error.response?.data?.message) {
    showErrorToast(error.response.data.message);
  } else if (error.message) {
    showErrorToast(error.message);
  } else {
    showErrorToast('An unexpected error occurred');
  }
};

