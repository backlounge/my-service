import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

function getLocalGitSha() {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

// Cloudflare Pagesのビルド環境ではCF_PAGES_*が自動的に設定される。
// ローカルで `wrangler pages deploy` する場合はローカルのgit HEADを代わりに使う。
const commitSha = process.env.CF_PAGES_COMMIT_SHA || getLocalGitSha() || "unknown";
const branch = process.env.CF_PAGES_BRANCH || "unknown";
const builtAt = new Date().toISOString();

const buildInfo = { commitSha, branch, builtAt };

writeFileSync("./public/build-info.json", JSON.stringify(buildInfo, null, 2));

console.log(`build-info.json generated: commit=${commitSha.slice(0, 7)} branch=${branch} builtAt=${builtAt}`);
