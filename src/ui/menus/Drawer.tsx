import classNames from "classnames";
import React, { cloneElement, useMemo } from "react";
import { Drawer } from "vaul";

/** Bottom sheet used for menus and modals on phones (make.md's `MobileDrawer`). */
export const MobileDrawer = (props: {
	fc: React.ReactElement;
	title?: string;
	hide: (suppress?: boolean) => void;
	className: string;
	newProps?: Record<string, unknown>;
}) => {
	const [open, setOpen] = React.useState(true);
	const drawerCount = useMemo(() => {
		let drawerIndex = 0;
		activeDocument.querySelectorAll(".mk-drawer-content").forEach((drawer) => {
			const index = drawer.getAttribute("data-drawer-index");
			if (index && parseInt(index) >= drawerIndex) drawerIndex = parseInt(index) + 1;
		});
		return drawerIndex;
	}, []);

	return (
		<Drawer.Root
			open={open}
			onOpenChange={(isOpen) => setOpen(isOpen)}
			shouldScaleBackground
			onClose={() => {
				setOpen(false);
				props.hide(true);
			}}
			noBodyStyles
		>
			<Drawer.Portal>
				<Drawer.Content
					className={classNames("mk-drawer-content", props.className)}
					data-drawer-index={drawerCount}
					style={{ "--drawer-index": drawerCount } as React.CSSProperties}
				>
					<Drawer.Handle className="mk-drawer-handle" />
					<Drawer.Title className="mk-drawer-title" hidden={!props.title}>
						{props.title}
					</Drawer.Title>
					{cloneElement(props.fc, {
						hide: (suppress?: boolean) => {
							setOpen(false);
							props.hide(suppress);
						},
						...props.newProps,
					})}
				</Drawer.Content>
				<Drawer.Overlay
					className="mk-drawer-overlay"
					style={{ "--drawer-index": drawerCount } as React.CSSProperties}
				/>
			</Drawer.Portal>
		</Drawer.Root>
	);
};
