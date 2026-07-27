import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface NotioneerPluginSettings {
	// Add plugin settings here as they're needed.
}

const DEFAULT_SETTINGS: NotioneerPluginSettings = {};

export default class NotioneerPlugin extends Plugin {
	settings: NotioneerPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NotioneerPluginSettingTab(this.app, this));
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
	}
}
