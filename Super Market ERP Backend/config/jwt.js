const isProd = process.env.APP_MODE === "PROD";

export const jwtConfig = isProd
  ? process.env.JWT_SECRET
  : process.env.JWT_SECRET_TEST;

export default { jwtConfig };
