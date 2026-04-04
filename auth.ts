import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Twitter from 'next-auth/providers/twitter'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Twitter,
    Credentials({
      id: 'email',
      name: 'メール',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        if (!email || !email.includes('@')) return null
        return {
          id: email,
          email,
          name: email.split('@')[0],
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/auth/verify-request',
  },
})
