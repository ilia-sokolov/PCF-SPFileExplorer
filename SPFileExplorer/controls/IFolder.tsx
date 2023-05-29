/**
 * Interface for folders presented by folders explorer
 */
export interface IFolder {
  /**
   * Name of the folder.
   */
  name: string;
  /**
   * Unique key of the folder.
   */
  key: string;
  /**
   * Path of the folder.
   */
  path: string;
  /**
   * List of sub-folders.
   */
  children?: IFolder[];
}
