import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../lib/prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        const email = profile.emails?.[0]?.value;

        if (!user && email) {
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                isEmailVerified: true,
                avatar: profile.photos?.[0]?.value ?? user.avatar,
              },
            });
          } else {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails?.[0]?.value as string,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value as string,
                isEmailVerified: true,
                role: "user",
              },
            });
          }
        }

        done(null, user as any);
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
