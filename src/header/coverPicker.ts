import { App, FuzzySuggestModal, TFile } from "obsidian";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];

/** Picks an image already in the vault to use as a note's cover. */
export class CoverPicker extends FuzzySuggestModal<TFile> {
	constructor(
		app: App,
		private onPick: (file: TFile) => void,
	) {
		super(app);
		this.setPlaceholder("Pick an image for the cover");
	}

	getItems(): TFile[] {
		return this.app.vault
			.getFiles()
			.filter((file) => IMAGE_EXTENSIONS.includes(file.extension.toLowerCase()));
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.onPick(file);
	}
}
