import { getIcon } from "obsidian";
import { icons } from "./icons";

const parseStickerString = (input: string): [string, string] => {
	const match = input.match(/^(.*?)\s*\/\/\s*(.*)$/);
	return match ? [match[1], match[2]] : ["", input];
};

const emojiFromString = (unified: string) => {
	try {
		return String.fromCodePoint(...unified.split("-").map((u) => parseInt(u, 16)));
	} catch {
		return unified;
	}
};

/** make.md's `stickerFromString`, minus custom icon sets: `ui//name` (make.md's own SVGs),
    `lucide//name` (Obsidian's bundled Lucide icons) and emoji. Returns inline HTML. */
export const getSticker = (sticker: string | undefined): string => {
	if (!sticker) return "";
	const [type, value] = parseStickerString(sticker);
	if (type == "" || type == "emoji") {
		return `
    <svg viewBox="0 0 26 26" preserveAspectRatio="xMidYMid meet" style="width: var(--icon-size); height: var(--icon-size); display: inline-block; vertical-align: middle;">
      <foreignObject x="0" y="0" width="26" height="26">
        <div xmlns="http://www.w3.org/1999/xhtml" style="
          position: relative;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span class="mk-emoji-icon-span">${emojiFromString(value)}</span>
        </div>
      </foreignObject>
    </svg>
    `;
	}
	if (type == "ui") return icons[value] ?? "";
	if (type == "lucide") return getIcon(value)?.outerHTML ?? "";
	return "";
};
