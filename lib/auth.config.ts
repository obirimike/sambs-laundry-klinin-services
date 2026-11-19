import type { NextAuthConfig } from "next-auth";

const authConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "samb-ai-studio-preview-secret",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role =
          (token.role as
            | "CUSTOMER"
            | "ADMIN"
            | "STAFF"
            | "SUPERVISOR"
            | undefined) ?? "CUSTOMER";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;