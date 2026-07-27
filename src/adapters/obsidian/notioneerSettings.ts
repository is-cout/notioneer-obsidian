import { App, PluginSettingTab, Setting } from "obsidian";
import NotioneerPlugin from "../../main";

/** Replaces make.md's `MakeMDPluginSettingsTab`, which was almost entirely spaces, the
    navigator and the space views — all removed. Only settings that still change something
    are listed here; the rest of `MakeMDSettings` keeps its default. */
export class NotioneerSettingsTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: NotioneerPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Note header").setHeading();

		this.toggle(
			"Show the header",
			"Cover image, title and properties at the top of a note.",
			"inlineContext",
			() => {
				document.body.classList.toggle(
					"mk-inline-context-enabled",
					this.plugin.superstate.settings.inlineContext,
				);
				this.plugin.refreshHeader();
			},
		);
		this.toggle("Cover image", "Show the cover image (banner) in the header.", "banners");
		this.toggle(
			"Properties",
			"Show the note's frontmatter properties in the header.",
			"inlineContextProperties",
		);

		new Setting(containerEl)
			.setName("Cover height")
			.setDesc("Height of the cover image, in pixels.")
			.addText((text) =>
				text
					.setValue(String(this.plugin.superstate.settings.bannerHeight))
					.onChange(async (value) => {
						const height = Number.parseInt(value, 10);
						if (Number.isNaN(height)) return;
						this.plugin.superstate.settings.bannerHeight = height;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Editor").setHeading();

		this.toggle(
			"Slash commands",
			"Type / in the editor to insert Markdown blocks. Unlike make.md's, these insert plain Markdown — /table gives a real Markdown table.",
			"notioneerSlashCommands",
		);
		this.toggle(
			"Selection toolbar",
			"Show a formatting toolbar when text is selected.",
			"notioneerSelectionToolbar",
		);

		new Setting(containerEl).setName("Frontmatter keys").setHeading();

		this.text("Cover", "Frontmatter key the cover image is stored under.", "fmKeyBanner");
		this.text("Aliases", "Frontmatter key used for note aliases.", "fmKeyAlias");
	}

	private toggle(
		name: string,
		description: string,
		key: "inlineContext" | "banners" | "inlineContextProperties" | "notioneerSlashCommands" | "notioneerSelectionToolbar",
		onChanged?: () => void,
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.superstate.settings[key]).onChange(async (value) => {
					this.plugin.superstate.settings[key] = value;
					await this.plugin.saveSettings();
					onChanged?.();
				}),
			);
	}

	private text(
		name: string,
		description: string,
		key: "fmKeyBanner" | "fmKeyAlias",
	): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(description)
			.addText((text) =>
				text.setValue(this.plugin.superstate.settings[key]).onChange(async (value) => {
					this.plugin.superstate.settings[key] = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
