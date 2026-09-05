const sessionLifetime = 60 * 60 * 24 * 7;

export const supabaseCookieOptions = {
  lifetime: sessionLifetime,
  maxAge: sessionLifetime,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
