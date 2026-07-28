/* Lists source files unreachable from src/main.ts.
 *
 * Used while trimming the make.md fork down: anything the entry point cannot reach is a
 * subsystem we no longer ship, and can be deleted. Run with --delete to remove them.
 *
 * Resolution mirrors tsconfig.json: relative paths plus a `src` baseUrl, extensions
 * .ts/.tsx/.js/.jsx, and directory index files. CSS imports count as edges so stylesheets
 * still reachable are kept.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("src");
const ENTRY = path.join(ROOT, "main.ts");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css"];
const IMPORT_RE = /(?:import|export)\s+(?:[\s\S]*?from\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g;

const exists = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

function resolve(spec, fromFile) {
	if (!spec.startsWith(".") && !spec.startsWith("/")) {
		// tsconfig baseUrl: src
		const candidates = [path.join(ROOT, spec)];
		const hit = candidates.flatMap(withExtensions).find(exists);
		return hit ?? null;
	}
	const base = path.resolve(path.dirname(fromFile), spec);
	return withExtensions(base).find(exists) ?? null;
}

function withExtensions(base) {
	return [
		base,
		...EXTENSIONS.map((ext) => base + ext),
		...EXTENSIONS.map((ext) => path.join(base, "index" + ext)),
	];
}

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

const reachable = new Set();
const queue = [ENTRY];
while (queue.length) {
	const file = queue.pop();
	if (reachable.has(file)) continue;
	reachable.add(file);
	if (file.endsWith(".css")) continue;

	const source = fs.readFileSync(file, "utf8");
	for (const match of source.matchAll(IMPORT_RE)) {
		const spec = match[1] ?? match[2] ?? match[3];
		if (!spec) continue;
		const target = resolve(spec, file);
		if (target && !reachable.has(target)) queue.push(target);
	}
}

/* Never delete: ambient declarations are not imported by anyone; sql.js's wasm shim is loaded
   at runtime by path rather than by an import statement; and stylesheets are kept even when
   unreferenced — deleting the ones main.ts did not import is what left the note header
   unstyled in 0.8.1. Drop a stylesheet by hand, after checking what still uses its classes. */
const KEEP = (f) => f.endsWith(".d.ts") || f.includes("sql-wasm") || f.endsWith(".css");

const all = walk(ROOT).filter((f) => EXTENSIONS.some((ext) => f.endsWith(ext)));
const unreachable = all.filter((f) => !reachable.has(f) && !KEEP(f));

console.log(`reachable: ${reachable.size}  unreachable: ${unreachable.length}  total: ${all.length}`);
if (process.argv.includes("--delete")) {
	for (const file of unreachable) fs.rmSync(file);
	console.log(`deleted ${unreachable.length} files`);
} else {
	for (const file of unreachable.slice(0, 40)) console.log("  " + path.relative(".", file));
	if (unreachable.length > 40) console.log(`  ... +${unreachable.length - 40}`);
}

/* --why <relative path>: print one import chain from the entry to that file. */
const whyIndex = process.argv.indexOf("--why");
if (whyIndex !== -1) {
	const target = path.resolve(process.argv[whyIndex + 1]);
	const parents = new Map();
	const seen = new Set([ENTRY]);
	const q = [ENTRY];
	while (q.length) {
		const file = q.shift();
		if (file.endsWith(".css")) continue;
		for (const match of fs.readFileSync(file, "utf8").matchAll(IMPORT_RE)) {
			const spec = match[1] ?? match[2] ?? match[3];
			if (!spec) continue;
			const next = resolve(spec, file);
			if (!next || seen.has(next)) continue;
			seen.add(next);
			parents.set(next, file);
			q.push(next);
		}
	}
	const chain = [];
	for (let f = target; f; f = parents.get(f)) chain.unshift(path.relative(".", f));
	console.log(chain.join("\n  -> ") || "not reachable");
}
