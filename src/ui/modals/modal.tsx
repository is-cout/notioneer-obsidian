import React, { cloneElement, useEffect, useTransition } from "react";
import { createRoot } from "react-dom/client";
import { Transition, TransitionStatus } from "react-transition-group";
import { MobileDrawer } from "../menus/Drawer";
import { isTouchScreen } from "../screen";
import { MenuObject } from "../types";
import { UI } from "../ui";

const isModalElement = (el: HTMLElement) =>
	el.classList.contains("mk-menu") || el.classList.contains("mk-menu-mobile") || el.classList.contains("mk-modal");

const transitionStyles: Record<TransitionStatus, React.CSSProperties> = {
	entering: { opacity: 1 },
	entered: { opacity: 1 },
	exiting: { opacity: 0 },
	exited: { opacity: 0 },
	unmounted: { opacity: 0 },
};

const ModalInner = (props: React.PropsWithChildren<{ ui: UI; hide: () => void; className: string }>) => {
	const ref = React.useRef<HTMLDivElement>(null);
	const [, startTransition] = useTransition();
	useEffect(() => {
		startTransition(() => null);
	}, []);
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key == "Escape") {
				props.hide();
				return true;
			}
			return false;
		};
		const handleClickOutside = (event: MouseEvent) => {
			let dom = event.target as HTMLElement;
			while (!isModalElement(dom) && dom.parentElement) dom = dom.parentElement;
			if (isModalElement(dom)) return;
			if (ref.current && !ref.current.contains(event.target as Node)) props.hide();
		};
		props.ui.inputManager.on("mousedown", handleClickOutside);
		props.ui.inputManager.on("contextmenu", handleClickOutside);
		props.ui.inputManager.on("keydown", onKeyDown);
		return () => {
			props.ui.inputManager.off("mousedown", handleClickOutside);
			props.ui.inputManager.off("contextmenu", handleClickOutside);
			props.ui.inputManager.off("keydown", onKeyDown);
		};
	}, [props.hide]);
	return (
		<Transition timeout={300} appear={true} in={true} nodeRef={ref}>
			{(state) => (
				<div
					className={props.className}
					style={{ transition: `all 100ms ease-in`, transform: "translateY(0px)", ...transitionStyles[state] }}
					ref={ref}
				>
					{props.children}
				</div>
			)}
		</Transition>
	);
};

/** make.md's modal/palette host: a centred panel on desktop, a bottom drawer on touch. */
export const showModal = (props: {
	ui: UI;
	fc: React.ReactElement;
	title?: string;
	isPalette?: boolean;
	className?: string;
	win: Window;
}): MenuObject => {
	const portalElement = props.win.document.body.createDiv();
	portalElement.classList.add(isTouchScreen() ? "mk-modal-wrapper-mobile" : "mk-modal-wrapper");
	const root = createRoot(portalElement);
	let hidden = false;
	const hide = () => {
		if (hidden) return;
		hidden = true;
		root.unmount();
		portalElement.remove();
	};
	const update = (newProps?: Record<string, unknown>) => {
		if (isTouchScreen()) {
			root.render(
				<MobileDrawer
					fc={props.fc}
					hide={hide}
					newProps={newProps}
					className={`${props.isPalette ? "mk-drawer-palette" : "mk-drawer-modal"} ${props.className ?? ""}`}
				/>,
			);
			return;
		}
		root.render(
			<div className="mk-modal-container">
				<ModalInner
					ui={props.ui}
					hide={hide}
					className={`${props.isPalette ? "mk-palette" : "mk-modal"} ${props.className ?? ""}`}
				>
					{!props.isPalette && (
						<div className="mk-modal-header">
							{props.title && <div className="mk-modal-title">{props.title}</div>}
							<div
								className="mk-x-small"
								dangerouslySetInnerHTML={{ __html: props.ui.getSticker("ui//close") }}
								onClick={hide}
							></div>
						</div>
					)}
					{cloneElement(props.fc, { hide, ...newProps })}
				</ModalInner>
			</div>,
		);
	};
	update();
	return { hide, update };
};
