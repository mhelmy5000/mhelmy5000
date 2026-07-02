/** Typed application configuration loaded from the environment. */
export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
}

export const configuration = (): AppConfig => ({
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  databaseUrl: process.env.DATABASE_URL ?? '',
});
