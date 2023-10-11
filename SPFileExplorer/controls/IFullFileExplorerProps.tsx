import { IFileSystemItem } from "./IFileSystemItem";
import { IFileViewColumn } from "./IFileViewColumn";
import { IFolder } from "./IFolder";

/**
 * Type of view to be presented to user.
 */
export enum ViewType {
  /**
   * List (grid) view.
   */
  List,
  /**
   * Compact list (grid) view.
   */
  Compact,
  /**
   * Tiles view.
   */
  Tiles,
}

/**
 * Interface for Full File Explorer component properties.
 */
export interface IFullFileExplorerProps {
  /**
   * List of columns avaliable in dataset and to be presented in the grid view.
   */
  columns: IFileViewColumn[];
  /**
   * The type of view to be presented by default.
   */
  defaultViewType?: ViewType;
  /**
   * Indicates if search box in the folder explorer should be hidden (by default it is visible).
   */
  hideFoldersSearchBox?: boolean;
  /**
   * Defines if folders navigation pane should be hidden (by default it is visible).
   */
  hideFoldersPane?: boolean;
  /**
   * Relative location path of the currently selected folder.
   */
  currentFolderPath: string;
  /**
   * Keys of currently selected records.
   */
  selectedRecordsKeys: string[];
  /**
   * Content of the currently selected folder.
   */
  currentFolderContent: IFileSystemItem[];
  /**
   * Gets full tree of folders for the current context.
   */
  getFolderStructure: () => Promise<IFolder>;
  /**
   * Sets a folder whose content shoud be presented to user.
   * @param path Path of the folder to be shown.
   */
  setCurrentFolder: (path: string) => void;
  /**
   * Selects records with specified ids.
   * @param ids Ids of the records to be selected.
   */
  selectRecords: (ids: string[]) => void;
  /**
   * Opens the specified record.
   * @param reference Reference of the record to be opened.
   */
  openRecord: (reference: any) => void;
  /**
   *  Sets sorting for presented reords.
   * @param column Name of the column that shoulb be used to sort records.
   * @param ascending Indicates if the records should be sorted ascending.
   */
  setSorting: (column: string, ascending: boolean) => void;
}
