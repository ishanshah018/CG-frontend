export default function NotFound() {
return (
<div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
    <h1 className="text-4xl font-bold text-gray-900">404</h1>
    <p className="mt-2 text-lg text-gray-600">Page not found</p>
    <p className="mt-4">
        <a href="/login" className="text-blue-600 hover:text-blue-800">
        Go back to login
        </a>
    </p>
    </div>
</div>
)
}