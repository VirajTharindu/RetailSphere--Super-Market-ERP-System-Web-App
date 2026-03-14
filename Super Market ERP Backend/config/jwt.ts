const isProd = process.env.APP_MODE === "PROD";

export const jwtConfig: string = isProd
  ? (process.env.JWT_SECRET as string)
  : (process.env.JWT_SECRET_TEST as string);

export default { jwtConfig };
