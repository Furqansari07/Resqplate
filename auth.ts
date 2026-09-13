import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import EmailOtp from '@/models/EmailOtp';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        await dbConnect();
        const dbUser = await User.findOne({ email });

        if (!dbUser || !dbUser.password) return null;

        const valid = await bcrypt.compare(password, dbUser.password);
        if (!valid) return null;

        return {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        };
      },
    }),

    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const otp = credentials?.otp as string | undefined;

        if (!email || !otp) return null;

        await dbConnect();
        const record = await EmailOtp.findOne({ email });

        if (!record || record.expiresAt < new Date()) return null;

        const valid = await bcrypt.compare(otp, record.codeHash);
        if (!valid) return null;

        await EmailOtp.deleteOne({ _id: record._id });

        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          dbUser = await User.create({
            name: email.split('@')[0],
            email,
            provider: 'email-otp',
            // no role yet — user picks one on /select-role
          });
        }

        return {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        };
      },
    }),
  ],

  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });

        if (!existing) {
          await User.create({
            name: user.name || 'Google User',
            email: user.email,
            provider: 'google',
            // no role yet — user picks one on /select-role
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }

      if (account?.provider === 'google' && token.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }

      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }

      return token;
    },

       async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;

        if (token.id) {
          await dbConnect();
          const dbUser = await User.findById(token.id)
            .select('verificationStatus profilePhotoUrl')
            .lean();

          if (dbUser) {
            (session.user as any).verificationStatus = dbUser.verificationStatus;
            (session.user as any).profilePhotoUrl = dbUser.profilePhotoUrl || '';
          }
        }
      }

      return session;
    }, 
  },

  pages: {
    signIn: '/login',
  },
});

export const { GET, POST } = handlers;