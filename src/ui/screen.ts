import { Platform } from "obsidian";
import { Anchors, Rect, Size } from "./types";

/** make.md's `isTouchScreen`: Obsidian mobile, phone or tablet. */
export const isTouchScreen = () => Platform.isMobile;
/** make.md's `isPhone`: menus become bottom drawers. */
export const isPhone = () => Platform.isPhone;

/** Where a menu of size `rect` opens next to `targetRect`, flipped to stay on screen. */
export const calculateBoundsBasedOnPosition = (
	targetRect: Rect,
	rect: DOMRect,
	bounds: Size,
	anchor: Anchors,
): Rect => {
	const x = anchor === "bottom" ? targetRect.x : targetRect.x + targetRect.width;
	const y =
		anchor === "top"
			? targetRect.y - rect.height - 10
			: anchor == "right"
				? targetRect.y
				: targetRect.y + targetRect.height + 10;
	const overflowX = x + rect.width - bounds.width;
	const overflowY = y + rect.height - bounds.height;
	let newY = y;
	let newX = x;
	if (overflowX > 0) {
		if (targetRect.x - rect.width < 0) newX = targetRect.x - overflowX;
		else newX = targetRect.x - rect.width;
	}
	if (overflowY > 0) {
		if (targetRect.y - rect.height < 0) newY = targetRect.y - overflowY;
		else newY = targetRect.y - rect.height - 10;
	}
	return { x: newX, y: newY, width: rect.width, height: rect.height };
};

export const windowFromDocument = (doc: Document): Window => doc.defaultView ?? window;
