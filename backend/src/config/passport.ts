import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import type { IUser } from "../types/index.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        const email = profile.emails?.[0]?.value;

        if (!user && email) {
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            user.isEmailVerified = true;
            if (profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
          } else {
            user = await User.create({
              googleId: profile.id,
              email: profile.emails?.[0]?.value as string,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value as string,
              isEmailVerified: true,
              role: "user",
            });
          }
        }

        done(null, user as IUser);
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
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
