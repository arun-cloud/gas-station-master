import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Must have a valid token AND an activated account.
        return !!token && token.isActive === true
      },
    },
    pages: {
      signIn: '/login',
    },
  },
)

// Protects every dashboard route (including the Server Actions posted to
// those same routes). Auth pages (/login, /register) and the NextAuth
// API route are intentionally excluded.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dispensers/:path*',
    '/fuel/:path*',
    '/sales/:path*',
    '/employees/:path*',
    '/suppliers/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
}
