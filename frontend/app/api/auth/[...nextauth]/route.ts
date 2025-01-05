import NextAuth from 'next-auth';
import eBayProvider from 'next-auth/providers/ebay';

const handler = NextAuth({
  providers: [
    eBayProvider({
      clientId: process.env.EBAY_APP_ID,
      clientSecret: process.env.EBAY_CERT_ID,
      authorization: {
        params: {
          scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Sauvegarder le token eBay dans le JWT
      if (account) {
        token.ebayToken = account.access_token;
        token.ebayRefreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Passer le token au client si nécessaire
      session.ebayToken = token.ebayToken;
      return session;
    }
  }
});

export { handler as GET, handler as POST }; 