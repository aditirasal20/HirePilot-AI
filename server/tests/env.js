import { randomBytes } from "node:crypto";
// Isolated test-process secrets; never read production credentials to sign test tokens.
process.env.ACCESS_TOKEN_SECRET = randomBytes(48).toString("hex");
process.env.REFRESH_TOKEN_SECRET = randomBytes(48).toString("hex");
process.env.EMAIL_VERIFICATION_TOKEN_SECRET = randomBytes(48).toString("hex");
process.env.PASSWORD_RESET_TOKEN_SECRET = randomBytes(48).toString("hex");
process.env.NODE_ENV = "test";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
process.env.AUTH_COOKIE_SAME_SITE = "lax";
