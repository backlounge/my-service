import bcrypt from "bcryptjs";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";

const DB_NAME = "gyomu_system_lp_db";

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const positional = args.filter((a) => a !== "--local");
const [email, password, roleArg] = positional;
const role = roleArg === "user" ? "user" : "admin";

if (!email || !password) {
  console.error("使い方: npm run create-user -- <email> <password> [admin|user] [--local]");
  console.error("例:     npm run create-user -- admin@example.com \"StrongPassword123\" admin");
  process.exit(1);
}

if (password.length < 8) {
  console.error("パスワードは8文字以上にしてください。");
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
const escapedEmail = email.trim().toLowerCase().replace(/'/g, "''");
const escapedHash = passwordHash.replace(/'/g, "''");

const sql = `INSERT INTO users (email, password_hash, role, created_at) VALUES ('${escapedEmail}', '${escapedHash}', '${role}', datetime('now'));`;

const tmpFile = `.tmp-create-user-${randomUUID()}.sql`;
writeFileSync(tmpFile, sql, "utf8");

const target = isLocal ? "ローカル" : "リモート(本番)";
console.log(`${target}のD1にユーザーを作成します: ${escapedEmail} (${role})`);

try {
  const flags = isLocal ? ["--local"] : ["--remote"];
  execFileSync("npx", ["wrangler", "d1", "execute", DB_NAME, ...flags, `--file=${tmpFile}`], {
    stdio: "inherit",
    shell: true,
  });
  console.log("作成が完了しました。");
} catch (error) {
  console.error("作成に失敗しました。同じメールアドレスのユーザーが既に存在する可能性があります。");
  process.exitCode = 1;
} finally {
  unlinkSync(tmpFile);
}
