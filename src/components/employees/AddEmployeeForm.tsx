'use client'

import { useState, useTransition } from 'react'
import { addEmployee }             from '@/app/actions/employee.actions'
import { UserPlus, X, Eye, EyeOff } from 'lucide-react'

export default function AddEmployeeForm() {
  const [open,       setOpen]       = useState(false)
  const [error,      setError]      = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [isPending,  startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await addEmployee(formData)
      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600
          text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <UserPlus size={16} />
        Add Employee
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center
          justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Add New Employee
              </h2>
              <button onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="name" type="text" required
                  placeholder="e.g. Mohammed Al-Zahrani"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email" type="email" required
                  placeholder="employee@gasstation.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
                    bg-white"
                >
                  <option value="">Select role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 pr-10 border border-gray-300
                      rounded-lg text-sm focus:outline-none
                      focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300
                    rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 px-4 py-2 text-sm bg-amber-500
                    hover:bg-amber-600 text-white rounded-lg font-medium
                    transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Adding…' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}