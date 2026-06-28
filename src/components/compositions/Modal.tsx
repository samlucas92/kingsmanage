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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/60 bg-white p-5 shadow-[0_24px_80px_rgba(8,42,40,.24)] sm:p-6">
        <h2 className="text-xl font-black tracking-[-.02em] text-slate-950">{title}</h2>

        {message && <p className="mt-2 text-gray-600">{message}</p>}

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>

          {onConfirm && (
            <button
              onClick={onConfirm}
              className="btn-primary"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
