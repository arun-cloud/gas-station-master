import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">Sign in</h1>
      <p className="mt-1 text-sm text-gray-500">Fuel Management System</p>
      <LoginForm />
    </div>
  )
}
