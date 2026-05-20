type ModalProps = {
  title: string;
  message?: string;
  isOpen: boolean;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm?: () => void;
  children?: React.ReactNode;
};

export default function Modal({
  title,
  message,
  isOpen,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onClose,
  onConfirm,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-blue-900">{title}</h2>

        {message && <p className="mt-2 text-gray-600">{message}</p>}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            {cancelText}
          </button>

          {onConfirm && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-blue-900 px-4 py-2 text-white"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}