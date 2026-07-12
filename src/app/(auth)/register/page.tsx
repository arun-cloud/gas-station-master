import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">Create an account</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your account will need admin approval before you can sign in.
      </p>
      <RegisterForm />
    </div>
  )
}
