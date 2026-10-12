import React, { useCallback, useEffect, useRef, useState } from "react";
import i18n from "../i18n";
import { defaultMenu } from "../menus/SelectMenu";
import ImageModal from "../modals/ImageModal";
import { isTouchScreen, windowFromDocument } from "../screen";
import { SelectOption } from "../types";
import { HeaderApi } from "./api";
import { useNote } from "./NoteContext";
import { parseURI, URI } from "./uri";

const coverOf = (property: Record<string, unknown>, key: string): URI | null => {
	const value = property[key];
	return typeof value === "string" && value ? parseURI(value) : null;
};

const offsetOf = (property: Record<string, unknown>, key: string) => {
	const value = property[key];
	if (!value || (typeof value !== "string" && typeof value !== "number")) return "center";
	return `${Math.min(100, parseFloat(value.toString())).toString()}%`;
};

export const saveCover = (api: HeaderApi, path: string, cover: string) =>
	api.saveProperties(path, { [api.settings.fmKeyBanner]: cover });

export const openCoverPicker = (api: HeaderApi, path: string, win: Window) =>
	api.ui.openPalette(<ImageModal api={api} selectedPath={(image) => void saveCover(api, path, image)} />, win);

/** The cover image: drag to reposition, change it, or remove it (make.md's `BannerView`). */
export const BannerView = (props: { reposition: boolean; setReposition: (reposition: boolean) => void }) => {
	const { note, api } = useNote();
	const { settings } = api;
	const property = note?.property ?? {};
	const [banner, setBanner] = useState<URI | null>(coverOf(property, settings.fmKeyBanner));
	const [offset, setOffset] = useState(offsetOf(property, settings.fmKeyBannerOffset));
	useEffect(() => {
		setOffset(offsetOf(property, settings.fmKeyBannerOffset));
		setBanner(coverOf(property, settings.fmKeyBanner));
	}, [note]);

	const changeCover = (ev: React.MouseEvent) => {
		if (note) void openCoverPicker(api, note.path, windowFromDocument(ev.view.document));
	};
	const triggerBannerContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		const menuOptions: SelectOption[] = [
			{ name: i18n.buttons.changeBanner, value: "change", icon: "ui//image", onClick: (ev) => changeCover(ev) },
			{
				name: i18n.buttons.removeBanner,
				value: "remove",
				icon: "ui//file-minus",
				onClick: () => {
					if (note) void api.deleteProperty(note.path, settings.fmKeyBanner);
				},
			},
		];
		api.ui.openMenu(
			{ x: e.clientX, y: e.clientY, width: 0, height: 0 },
			defaultMenu(menuOptions),
			windowFromDocument(e.view.document),
		);
		return false;
	};

	const startValue = useRef(offset == "center" ? 50 : parseFloat(offset));
	const currentValue = useRef(offset == "center" ? 50 : parseFloat(offset));
	const startPos = useRef<[number, number]>([0, 0]);
	const saveOffset = useCallback(
		(value: number) => {
			setOffset(`${value}%`);
			if (note) void api.saveProperties(note.path, { [settings.fmKeyBannerOffset]: value.toString() });
		},
		[note],
	);
	const step = 0.5;
	const handleMove = useCallback((e: MouseEvent) => {
		const [, y1] = startPos.current;
		const delta = (y1 - e.clientY) * step;
		const newValue = Math.min(Math.max(startValue.current + delta, 0), 100);
		currentValue.current = newValue;
		setOffset(`${newValue}%`);
		e.stopPropagation();
	}, []);
	const handleMoveEnd = useCallback(
		(e: MouseEvent) => {
			// Swallow the click that ends the drag.
			const captureClick = (click: MouseEvent) => {
				click.stopPropagation();
				window.removeEventListener("click", captureClick, true);
			};
			window.addEventListener("click", captureClick, true);
			activeDocument.removeEventListener("mousemove", handleMove);
			activeDocument.removeEventListener("mouseup", handleMoveEnd);
			saveOffset(currentValue.current);
			e.preventDefault();
			e.stopPropagation();
		},
		[handleMove, saveOffset],
	);
	const handleDown = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!props.reposition) return;
			startValue.current = offset == "center" ? 50 : parseFloat(offset);
			startPos.current = [e.clientX, e.clientY];
			activeDocument.addEventListener("mousemove", handleMove);
			activeDocument.addEventListener("mouseup", handleMoveEnd);
			e.stopPropagation();
		},
		[handleMove, handleMoveEnd, offset, props.reposition],
	);
	useEffect(
		() => () => {
			activeDocument.removeEventListener("mousemove", handleMove);
			activeDocument.removeEventListener("mouseup", handleMoveEnd);
		},
		[],
	);

	if (!banner) return <></>;
	return (
		<>
			<div
				className={`mk-space-banner`}
				onContextMenu={triggerBannerContextMenu}
				style={
					{
						"--mk-banner-height": `${settings.bannerHeight}px`,
						backgroundImage: `url("${banner.scheme == "vault" ? api.getUIPath(banner.basePath) : banner.fullPath}")`,
						backgroundPositionY: offset,
						cursor: props.reposition ? "grab" : "inherit",
					} as React.CSSProperties
				}
				onMouseDown={handleDown}
			></div>
			<div className="mk-space-banner-buttons">
				{props.reposition ? (
					<button className="mk-hover-button" onClick={() => props.setReposition(false)}>
						<div dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//check") }}></div>
						{i18n.labels.done}
					</button>
				) : (
					<button className="mk-hover-button" onClick={() => props.setReposition(true)}>
						<div dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//move") }}></div>
						{i18n.labels.reposition}
					</button>
				)}
				<button className="mk-hover-button" onClick={(e) => changeCover(e)}>
					<div dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//edit") }}></div>
					{i18n.labels.changeCoverShort}
				</button>
				<button
					className="mk-hover-button"
					dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//options") }}
					onClick={(e) => triggerBannerContextMenu(e)}
				></button>
			</div>
			<div
				className={`mk-spacer`}
				style={
					{
						// make.md: touch offset + (cover height − 62) + 50 when stickers are off.
						"--mk-header-height": `${(isTouchScreen() ? 26 : 0) + (settings.bannerHeight - 62) + 50}px`,
					} as React.CSSProperties
				}
				onContextMenu={(e) => e.preventDefault()}
			></div>
		</>
	);
};
