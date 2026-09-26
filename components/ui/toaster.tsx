import { ToastContainer, type ToastContainerProps } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Toaster(props: Partial<ToastContainerProps>) {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3200}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      {...props}
    />
  );
}

export { toast } from 'react-toastify';
