import { IFileSystemItem } from "./IFileSystemItem";
import { IFileViewColumn } from "./IFileViewColumn";
import { IFolder } from "./IFolder";
import { IStrings } from "./Strings";

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
 * File that could not be uploaded.
 */
export interface IUploadError {
  fileName: string;
  message: string;
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
   * Indicates if the view type selected by a user should be remembered in the browser (by default it is remembered).
   */
  rememberViewType?: boolean;
  /**
   * Indicates if search box in the folder explorer should be hidden (by default it is visible).
   */
  hideFoldersSearchBox?: boolean;
  /**
   * Defines if folders navigation pane should be hidden (by default it is visible).
   */
  hideFoldersPane?: boolean;
  /**
   * Identifier of the document location whose documents are shown (empty if unknown).
   * The folder tree is loaded again when it changes.
   */
  locationKey?: string;
  /**
   * Localized texts (English texts are used if not specified).
   */
  strings?: IStrings;
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
   * Resolves with null if no document location is found for the current context.
   */
  getFolderStructure: () => Promise<IFolder | null>;
  /**
   * Requests the folder tree again if it was not requested recently.
   * Resolves with true if the tree (returned by getFolderStructure) has changed.
   */
  refreshFolderStructure?: () => Promise<boolean>;
  /**
   * Uploads files to the folder with the specified path and reloads the folder content.
   * Not specified if uploading is not enabled or not possible (e.g. no record).
   * @param files Files to be uploaded.
   * @param folderPath Path of the target folder.
   * @param onProgress Called with the number of processed files after each file.
   * @returns Files that could not be uploaded.
   */
  uploadFiles?: (
    files: File[],
    folderPath: string,
    onProgress: (uploaded: number) => void
  ) => Promise<IUploadError[]>;
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
