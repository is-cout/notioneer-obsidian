import classNames from "classnames";
import React, { cloneElement, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { calculateBoundsBasedOnPosition, isPhone } from "../screen";
import { Anchors, MenuObject, OpenSubmenu, Rect } from "../types";
import { UI } from "../ui";
import { MobileDrawer } from "./Drawer";

const isMenuElement = (el: HTMLElement) =>
	el.classList.contains("mk-menu") ||
	el.classList.contains("mk-menu-wrapper") ||
	el.classList.contains("mk-modal");

export const MenuWrapper = (props: {
	ui: UI;
	hide: (suppress?: boolean) => void;
	children: React.ReactNode;
}) => {
	const ref = React.useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = React.useState(false);
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key == "Escape") {
				props.hide(true);
				return true;
			}
			return false;
		};
		const handleClickOutside = (event: MouseEvent) => {
			let dom = event.target as HTMLElement;
			while (!isMenuElement(dom) && dom.parentElement) dom = dom.parentElement;
			if (isMenuElement(dom)) return;
			if (ref.current && !ref.current.contains(event.target as Node)) props.hide(true);
		};
		props.ui.inputManager.on("click", handleClickOutside);
		props.ui.inputManager.on("contextmenu", handleClickOutside);
		props.ui.inputManager.on("keydown", onKeyDown);
		return () => {
			props.ui.inputManager.off("click", handleClickOutside);
			props.ui.inputManager.off("contextmenu", handleClickOutside);
			props.ui.inputManager.off("keydown", onKeyDown);
		};
	}, [props.hide]);

	useEffect(() => {
		if (!isPhone()) return;
		const resizeObserver = new ResizeObserver(() => setIsReady(true));
		if (ref.current) resizeObserver.observe(ref.current);
		return () => resizeObserver.disconnect();
	}, []);

	return (
		<div className={`mk-menu-wrapper ${!isPhone() || isReady ? "mk-ready" : ""}`} ref={ref}>
			{props.children}
		</div>
	);
};

/** Renders `fc` in a floating menu next to `rect` (a bottom drawer on phones). The element
    receives `hide` and `onSubmenu` props, like make.md's menus expect. */
export const showMenu = (props: {
	rect: Rect;
	ui: UI;
	anchor: Anchors;
	win: Window;
	fc: React.ReactElement;
	props?: Record<string, unknown>;
	onHide?: () => void;
	className?: string;
	force?: boolean;
}): MenuObject => {
	const portalElement = props.win.document.body.createDiv();
	const isDrawer = isPhone() && !props.force;
	portalElement.classList.add(isDrawer ? "mk-menu-mobile" : "mk-menu");

	let submenu: MenuObject | null = null;
	const root = createRoot(portalElement);
	let hidden = false;
	const hide = (suppress?: boolean) => {
		if (props.onHide && !suppress) props.onHide();
		if (submenu) submenu.hide(true);
		if (hidden) return;
		hidden = true;
		props.win.setTimeout(() => {
			root.unmount();
			portalElement.remove();
		}, 50);
	};
	const onSubmenu = (openSubmenu: OpenSubmenu) => {
		const menu = openSubmenu(props.rect, () => {
			if (props.onHide) props.onHide();
			hide(true);
		});
		if (submenu) submenu.hide(true);
		submenu = menu;
	};

	const updateRoot = (newProps?: Record<string, unknown>) => {
		if (isDrawer) {
			root.render(
				<MobileDrawer
					fc={cloneElement(props.fc, { onSubmenu })}
					hide={hide}
					newProps={newProps}
					className={classNames("mk-drawer-menu", props.className)}
				></MobileDrawer>,
			);
			return;
		}
		root.render(
			<MenuWrapper ui={props.ui} hide={hide}>
				{cloneElement(props.fc, { hide, onSubmenu, ...newProps })}
			</MenuWrapper>,
		);
	};

	updateRoot(props.props);
	if (!isDrawer) {
		portalElement.setCssStyles({
			position: "absolute",
			left: `${props.rect.x}px`,
			top: `${props.rect.y}px`,
		});
		const resizeObserver = new ResizeObserver((entries) => {
			const newPos = calculateBoundsBasedOnPosition(
				props.rect,
				entries[0].target.getBoundingClientRect(),
				{ width: props.win.innerWidth, height: props.win.innerHeight },
				props.anchor,
			);
			portalElement.setCssStyles({ left: `${newPos.x}px`, top: `${newPos.y}px` });
		});
		resizeObserver.observe(portalElement);
	}
	return { update: updateRoot, hide };
};
