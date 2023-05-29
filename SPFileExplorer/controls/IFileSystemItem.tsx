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
}
