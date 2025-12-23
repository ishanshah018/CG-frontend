"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, X } from "lucide-react"

interface ToastMessage {
id: string
message: string
type: "success" | "error"
}

export function Toaster() {
const [toasts, setToasts] = useState<ToastMessage[]>([])

useEffect(() => {
const handleShowToast = (event: Event) => {
    const customEvent = event as CustomEvent<{ message: string; type: "success" | "error" }>
    const { message, type } = customEvent.detail

    const id = `${Date.now()}-${Math.random()}`
    const newToast = { id, message, type }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
}

window.addEventListener("showToast", handleShowToast)
return () => window.removeEventListener("showToast", handleShowToast)
}, [])

const removeToast = (id: string) => {
setToasts((prev) => prev.filter((toast) => toast.id !== id))
}

return (
<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4">
    {toasts.map((toast) => (
    <div
        key={toast.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-5 ${
        toast.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
    >
        {toast.type === "success" ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        ) : (
        <XCircle className="h-5 w-5 flex-shrink-0" />
        )}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close"
        >
        <X className="h-4 w-4" />
        </button>
    </div>
    ))}
</div>
)
}
