"use client";

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Video Capture App
        </h1>
        <div className="flex justify-center">
          <a
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full text-center"
          >
            Entrar com Auth0
          </a>
        </div>
      </div>
    </div>
  );
}
