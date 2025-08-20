declare module 'passport-discord' {
  import { Strategy } from 'passport-strategy';
  
  export interface DiscordProfile {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    locale?: string;
    verified?: boolean;
    email?: string;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
  }

  export interface DiscordStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export type DiscordVerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: DiscordProfile,
    done: (error: any, user?: any) => void
  ) => void;

  export class Strategy extends Strategy {
    constructor(options: DiscordStrategyOptions, verify: DiscordVerifyFunction);
  }
}