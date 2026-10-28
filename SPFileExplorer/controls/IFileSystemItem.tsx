/**
 * Interface that represents file items that are presented by full file explorer.
 */
export interface IFileSystemItem {
  [key: string]: unknown;
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
   * Relative SharePoint folder path used by the dataset filter.
   */
  relativelocation: string;
  /**
   * Indicates that the item belongs to the shared document location.
   */
  isSharedLocation?: boolean;
  /**
   * Indicates whether the document is checked out.
   */
  ischeckedout?: boolean | number;
  /**
   * Refrence of the file item.
   */
  reference: ComponentFramework.EntityReference;
}
