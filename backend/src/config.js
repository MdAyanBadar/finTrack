// Required settings. Failing fast beats silently signing logins with a
// guessable default secret.
export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("❌ JWT_SECRET is missing or too short (need 16+ characters). Set it in the environment.");
  process.exit(1);
}
