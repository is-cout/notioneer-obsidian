import { App, Modal, Setting } from "obsidian";

/** Asks for a frontmatter key name. Obsidian has no built-in prompt. */
export class NewPropertyModal extends Modal {
	private name = "";

	constructor(
		app: App,
		private onSubmit: (name: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		// `Modal.setTitle` only exists from Obsidian 1.6; minAppVersion here is 1.4.
		this.titleEl.setText("New property");

		const setting = new Setting(this.contentEl).setName("Name").addText((text) =>
			text.setPlaceholder("Property name").onChange((value) => {
				this.name = value;
			}),
		);
		const input = setting.controlEl.querySelector("input");
		input?.addEventListener("keydown", (event) => {
			if (event.key === "Enter") this.submit();
		});
		input?.focus();

		new Setting(this.contentEl).addButton((button) =>
			button.setButtonText("Add").setCta().onClick(() => this.submit()),
		);
	}

	private submit(): void {
		const name = this.name.trim();
		if (!name) return;
		this.close();
		this.onSubmit(name);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
