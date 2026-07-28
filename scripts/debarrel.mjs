/* Rewrites `from "makemd-core"` imports to the modules the barrel re-exports.
 *
 * The barrel re-exports the whole plugin, so a single import of it makes every subsystem
 * reachable and keeps it in the bundle. Only needed while the fork is being trimmed. */
import fs from "fs";
import path from "path";

const MAP = {
  SpaceManager: ["core/spaceManager/spaceManager", "SpaceManager"],
  API: ["shared/types/api", "IAPI as API"],
  Superstate: ["shared/types/superstate", "ISuperstate as Superstate"],
  FileSystemAdapter: ["core/middleware/filesystem", "FileSystemAdapter"],
  FilesystemMiddleware: ["core/middleware/filesystem", "FilesystemMiddleware"],
  FileCache: ["core/middleware/filesystem", "FileCache"],
  FileTypeAdapter: ["core/middleware/filetypes", "FileTypeAdapter"],
  FileTypeCache: ["core/middleware/filetypes", "FileTypeCache"],
  FilesystemSpaceAdapter: ["core/spaceManager/filesystemAdapter/filesystemAdapter", "FilesystemSpaceAdapter"],
  AFile: ["shared/types/afile", "AFile"],
  PathLabel: ["shared/types/caches", "PathLabel"],
  UIManager: ["core/middleware/ui", "UIManager"],
  SelectMenu: ["core/react/components/UI/Menus/menu/SelectMenu", "default as SelectMenu"],
  SelectOptionType: ["shared/types/menu", "SelectOptionType"],
  SelectMenuProps: ["shared/types/menu", "SelectMenuProps"],
  SelectOption: ["shared/types/menu", "SelectOption"],
  SelectSection: ["shared/types/menu", "SelectSection"],
  Sticker: ["shared/types/ui", "Sticker"],
  UIAdapter: ["shared/types/uiManager", "UIAdapter"],
  FileContextView: ["core/react/components/Explorer/Explorer", "Explorer as FileContextView"],
  Backlinks: ["core/react/components/MarkdownEditor/Backlinks", "Backlinks"],
  MarkdownHeaderView: ["core/react/components/MarkdownEditor/MarkdownHeaderView", "MarkdownHeaderView"],
  MDBViewer: ["core/react/components/MDBView/MDBViewer", "MDBViewer"],
  Navigator: ["core/react/components/Navigator/Navigator", "Navigator"],
  NoteView: ["core/react/components/PathView/NoteView", "NoteView"],
  SpaceView: ["core/react/components/SpaceView/Contexts/SpaceView", "SpaceView"],
  SpaceFragmentViewComponent: ["core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentView", "SpaceFragmentViewComponent"],
  SpaceFragmentWrapper: ["core/react/components/SpaceView/Editor/EmbedView/SpaceFragmentWrapper", "SpaceFragmentWrapper"],
};

const IMPORT_RE = /import\s+(type\s+)?\{([^}]*)\}\s*from\s*["']makemd-core["'];?/g;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

let changed = 0;
const missing = new Set();
for (const file of walk("src").filter((f) => /\.tsx?$/.test(f))) {
  if (file.endsWith("makemd-core.ts")) continue;
  const source = fs.readFileSync(file, "utf8");
  if (!/["']makemd-core["']/.test(source)) continue;

  const next = source.replace(IMPORT_RE, (whole, typeOnly, names) => {
    const byModule = new Map();
    for (const raw of names.split(",").map((n) => n.trim()).filter(Boolean)) {
      // handles `X`, `X as Y`, `type X`
      const bare = raw.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      const alias = raw.includes(" as ") ? raw.split(/\s+as\s+/)[1].trim() : null;
      const entry = MAP[bare];
      if (!entry) { missing.add(bare); return whole; }
      const [module, exported] = entry;
      const spec = alias ? `${exported.split(" as ")[0]} as ${alias}` : exported;
      byModule.set(module, [...(byModule.get(module) ?? []), spec]);
    }
    return [...byModule]
      .map(([module, specs]) => `import ${typeOnly ?? ""}{ ${specs.join(", ")} } from "${module}";`)
      .join("\n");
  });

  if (next !== source) { fs.writeFileSync(file, next); changed++; }
}
console.log(`rewritten: ${changed} files`);
if (missing.size) console.log("unmapped exports:", [...missing].join(", "));
