import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactPathFor, buildArtifact, resolveOutPath } from "./artifacts";
import { parseArgs, USAGE } from "./options";
import { buildReport } from "./report";
import { runTargets } from "./run-target";

/** リポジトリルート。`pnpm --filter` 実行時は cwd がパッケージ配下になるため、
 * 相対パスはここを基準に解決する。 */
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

/** .env があれば読み込む。無くても環境変数だけで動く。 */
function loadEnvFile(): void {
  try {
    process.loadEnvFile(join(REPO_ROOT, ".env"));
  } catch {
    // .env が無い場合は何もしない
  }
}

async function main(): Promise<void> {
  loadEnvFile();
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.kind === "help") {
    console.log(USAGE);
    return;
  }

  const { options } = parsed;
  const { sections, errors, runs, usageRows } = await runTargets(options);
  const generatedAt = new Date();

  const report = buildReport({
    options,
    sections,
    errors,
    usageRows,
    generatedAt,
  });
  console.log(report);

  if (options.out) {
    const outPath = resolveOutPath(REPO_ROOT, options.out);
    const artifactPath = artifactPathFor(outPath);
    const artifact = buildArtifact({ options, runs, errors, generatedAt });
    writeFileSync(outPath, report, "utf8");
    writeFileSync(
      artifactPath,
      `${JSON.stringify(artifact, null, 2)}\n`,
      "utf8"
    );
    console.log(`\n書き出しました: ${outPath}`);
    console.log(`完全な判定出力（再計算用）: ${artifactPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
