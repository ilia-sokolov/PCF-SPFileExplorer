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
   * File item's relative location (full path from SharePoint root).
   */
  relativelocation?: string;
  /**
   * File item's relative location for display (path with base directory removed).
   */
  relativelocationDisplay?: string;
  /**
   * SharePoint document location name (base folder name).
   */
  locationname?: string;
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
}
