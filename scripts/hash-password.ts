// Prints a password hash for seeding or for creating the first coach by hand.
// Usage (Node ≥ 23 strips TS types natively): node scripts/hash-password.ts "<password>"
import { hashPassword } from "../src/lib/auth/password.ts";

const pw = process.argv[2];
if (!pw) {
  console.error('Uso: node scripts/hash-password.ts "<contraseña>"');
  process.exit(1);
}
console.log(await hashPassword(pw));
