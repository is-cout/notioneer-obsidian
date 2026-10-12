/** Notioneer's settings. The keys and defaults are make.md's (`MakeMDSettings`), so the
    `data.json` of anyone upgrading keeps working; keys this version no longer reads are
    loaded and saved back untouched. */
export type NotioneerSettings = {
	/** Show the note header. */
	inlineContext: boolean;
	/** Show the cover image. */
	banners: boolean;
	/** Show the property rows. */
	inlineContextProperties: boolean;
	/** Property rows expanded (the chevron next to the folder chips). */
	inlineContextExpanded: boolean;
	bannerHeight: number;
	/** Start the title in alias mode when the note has an alias. */
	spacesUseAlias: boolean;
	fmKeyBanner: string;
	fmKeyBannerOffset: string;
	fmKeyAlias: string;
	fmKeySticker: string;
	fmKeyColor: string;
	defaultDateFormat: string;
	defaultTimeFormat: string;
	datePickerTime: boolean;
	notioneerSlashCommands: boolean;
	notioneerSelectionToolbar: boolean;
};

export const DEFAULT_SETTINGS: NotioneerSettings = {
	inlineContext: true,
	banners: true,
	inlineContextProperties: true,
	inlineContextExpanded: true,
	bannerHeight: 200,
	spacesUseAlias: false,
	fmKeyBanner: "banner",
	fmKeyBannerOffset: "banner_y",
	fmKeyAlias: "aliases",
	fmKeySticker: "sticker",
	fmKeyColor: "color",
	defaultDateFormat: "MMM dd yyyy",
	defaultTimeFormat: "h:mm a",
	datePickerTime: false,
	notioneerSlashCommands: true,
	notioneerSelectionToolbar: true,
};

/** Frontmatter keys the header shows elsewhere (cover, offset, …) or that belong to make.md
    spaces; they never get a property row. */
export const hiddenPropertyKeys = (settings: NotioneerSettings) => [
	settings.fmKeyBanner,
	settings.fmKeySticker,
	settings.fmKeyColor,
	settings.fmKeyBanner,
	settings.fmKeyBannerOffset,
	"_contexts",
	"_joins",
	"_links",
	"_sort",
	"_template",
	"_templateName",
];
