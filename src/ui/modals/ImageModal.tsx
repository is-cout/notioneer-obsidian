import React, { useEffect, useRef, useState } from "react";
import { HeaderApi } from "../header/api";
import i18n from "../i18n";

/** Extensions make.md indexed as images. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "avif"];
/** Covers saved through make.md's asset manager, listed first when present. */
const COVER_IMAGES_PATH = ".space/coverImages.json";
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

type ImagePreview = { path: string; thumbnail: string };

const loadSavedCovers = async (api: HeaderApi): Promise<ImagePreview[]> => {
	try {
		if (!(await api.app.vault.adapter.exists(COVER_IMAGES_PATH))) return [];
		const data = JSON.parse(await api.app.vault.adapter.read(COVER_IMAGES_PATH)) as { images?: { url?: string }[] };
		return (data.images ?? [])
			.map((f) => f.url)
			.filter((url): url is string => typeof url === "string")
			.map((url) => ({ path: url, thumbnail: url }));
	} catch {
		return [];
	}
};

/** make.md's cover picker: vault images, newest first, or a pasted URL. */
const ImageModal = (props: { api: HeaderApi; selectedPath: (path: string) => void; hide?: () => void }) => {
	const [query, setQuery] = useState("");
	const [allImages, setAllImages] = useState<ImagePreview[]>([]);
	const [images, setImages] = useState<ImagePreview[]>([]);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const hide = () => props.hide?.();

	useEffect(() => {
		const vaultImages = props.api.app.vault
			.getFiles()
			.filter((f) => IMAGE_EXTENSIONS.includes(f.extension))
			.sort((a, b) => b.stat.ctime - a.stat.ctime)
			.map((f) => ({ path: f.path, thumbnail: f.path }));
		setAllImages(vaultImages);
		setImages(vaultImages);
		void loadSavedCovers(props.api).then((covers) => {
			if (covers.length == 0) return;
			setAllImages([...covers, ...vaultImages]);
			setImages([...covers, ...vaultImages]);
		});
	}, []);

	useEffect(() => {
		if (query.match(urlRegex)) setImages([{ path: query, thumbnail: query }]);
		else setImages(allImages.filter((f) => f.path.includes(query)));
	}, [query, allImages]);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		const currentIndex = images.findIndex((f) => f.path == selectedImage);
		if (event.key === "ArrowUp" && currentIndex > 0) {
			setSelectedImage(images[currentIndex - 1].path);
		} else if (event.key === "ArrowDown" && currentIndex < images.length - 1) {
			setSelectedImage(images[currentIndex + 1].path);
		} else if (event.key === "Enter") {
			if (selectedImage) props.selectedPath(selectedImage);
			hide();
		}
	};

	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		ref.current?.focus();
	}, [ref.current]);

	return (
		<>
			<input
				onKeyDown={handleKeyDown}
				value={query}
				ref={ref}
				onChange={(event) => setQuery(event.target.value)}
				className="mk-input mk-input-large mk-border-bottom"
				placeholder={i18n.descriptions.searchForImagesInYourVaultOrPasteAUrl}
			/>
			<div className="mk-layout-masonry mk-padding-12 mk-layout-scroll">
				{images.map((image) => (
					<img
						key={image.path}
						src={props.api.getUIPath(image.thumbnail)}
						className={selectedImage === image.path ? "mk-selected" : ""}
						onClick={() => {
							props.selectedPath(image.path);
							hide();
						}}
					/>
				))}
			</div>
		</>
	);
};

export default ImageModal;
