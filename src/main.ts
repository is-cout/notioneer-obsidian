import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { SlashSuggest } from "./slash/suggest";

interface NotioneerPluginSettings {
	slashCommands: boolean;
}

const DEFAULT_SETTINGS: NotioneerPluginSettings = {
	slashCommands: true,
};

export default class NotioneerPlugin extends Plugin {
	settings: NotioneerPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NotioneerPluginSettingTab(this.app, this));
		this.registerEditorSuggest(new SlashSuggest(this.app, () => this.settings.slashCommands));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class NotioneerPluginSettingTab extends PluginSettingTab {
	plugin: NotioneerPlugin;

	constructor(app: App, plugin: NotioneerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Notioneer").setHeading();

		new Setting(containerEl)
			.setName("Slash commands")
			.setDesc("Type / in the editor to insert Markdown blocks.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.slashCommands).onChange(async (value) => {
					this.plugin.settings.slashCommands = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
