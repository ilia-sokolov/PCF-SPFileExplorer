/**
 * Interface for columns to be presented by full file explorer component.
 */
export interface IFileViewColumn {
  /**
   * Name of the file system item property that should be presented by the column.
   */
  name: string;
  /**
   * Display name of the column.
   */
  displayName: string;
  /**
   * Indicates if the column is primary column (should render link to open records).
   */
  isPrimary?: boolean;
  /**
   * Indicates if a file icon should be redered next to property value.
   */
  renderIcon?: boolean;
  /**
   * Indicates if column sortable.
   */
  isSortable: boolean;
  /**
   * Visual size factor of the column in the view.
   */
  visualSizeFactor?: number;
  /**
   * Indicates if data is sorted by the column.
   */
  isSorted?: boolean;
  /**
   * Indicates if data is sorted by the column descending.
   */
  isSortedDescending?: boolean;
  /**
   * Sort ascending column arai label text.
   */
  sortAscendingLabel?: string;
  /**
   * Sort descending column arai label text.
   */
  sortDescendingLabel?: string;
}
