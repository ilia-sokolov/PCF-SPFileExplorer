import { createContext } from "react";

export interface IFolderExplorerContext {
  selectedFolderPath: string;
  setSelectedFolderPath(path: string): void;

  expandedFoldersPaths: string[];
  setExpandedFoldersPaths(paths: string[]): void;
}

export const FolderExplorerContext = createContext(
  null as IFolderExplorerContext | null
);
