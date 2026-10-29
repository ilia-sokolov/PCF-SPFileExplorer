/**
 * Interface that represents file items that are presented by full file explorer.
 */
export interface IFileSystemItem {
  [key: string]: any;
  /**
   * Uniqe id of the file item.
   */
  id: string;
  /**
   * File item's full name.
   */
  fullname: string;
  /**
   * Unique key of the file item.
   */
  key: string;
  /**
   * File item's path.
   */
  path: string;
  /**
   * Last file item's modification date.
   */
  modified: string;
  /**
   * Type of the file item.
   */
  filetype: string;
  /**
   * Refrence of the file item.
   */
  reference: any;
  /**
   * Absolute URL of the item, if Dataverse returns it.
   */
  absoluteurl?: string;
  /**
   * Path of the folder that contains the item (search results across folders).
   */
  folderPath?: string;
  /**
   * Indicates that the item is a search result across folders (not a record of the dataset).
   */
  isSearchResult?: boolean;
}
