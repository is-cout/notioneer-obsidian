
import { savePathColor } from "core/superstate/utils/label";
import { ISuperstate as Superstate } from "shared/types/superstate";
import { savePathSticker } from "shared/utils/sticker";


export const saveIconsForPaths = (
  superstate: Superstate,
  paths: string[],
  icon: string
) => {
  paths.forEach((path) => {
      void savePathSticker(superstate, path, icon);
  });
};

export const saveColorForPaths = (
  superstate: Superstate,
  paths: string[],
  icon: string
) => {
  paths.forEach((path) => {

      void savePathColor(superstate, path, icon);

  });
};


export const savePathIcon = (
  superstate: Superstate,
  path: string,
  icon: string
) => {
  void savePathSticker(superstate, path, icon);
};

export const removePathIcon = (superstate: Superstate, path: string) => {
  void savePathSticker(superstate, path, "");
};
