import { IFolder } from "./IFolder";

export const findFolder = (
  folder: IFolder,
  path: string
): IFolder | undefined => {
  if (folder.path === path) {
    return folder;
  }
  for (const child of folder.children ?? []) {
    const found = findFolder(child, path);
    if (found) {
      return found;
    }
  }
  return undefined;
};

/**
 * Returns the path from the root folder to the folder with the specified path.
 */
export const getParentPaths = (folder: IFolder, path: string): string[] => {
  if (!path || folder.path === path) {
    return [folder.path];
  }
  for (const child of folder.children ?? []) {
    const childPaths = getParentPaths(child, path);
    if (childPaths[childPaths.length - 1] === path) {
      return [folder.path, ...childPaths];
    }
  }
  return [folder.path];
};
