import * as React from "react";
import { useState, useEffect } from "react";
import {
  CommandBar,
  ICommandBarItemProps,
} from "@fluentui/react/lib/CommandBar";

import {
  IContextualMenuProps,
  ContextualMenu,
  DirectionalHint,
  IContextualMenuItem,
} from "@fluentui/react/lib/ContextualMenu";

import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { Breadcrumb, IBreadcrumbItem } from "@fluentui/react/lib/Breadcrumb";

import {
  DetailsList,
  IColumn,
  ColumnActionsMode,
  DetailsListLayoutMode,
} from "@fluentui/react/lib/DetailsList";

import { Link } from "@fluentui/react/lib/Link";

import { TilesView } from "./TilesView";
import FolderExplorer from "./FolderExplorer";

import {
  IObjectWithKey,
  SelectionMode,
  Selection,
} from "@fluentui/react/lib/Selection";

import { MarqueeSelection } from "@fluentui/react/lib/MarqueeSelection";

import { FolderExplorerContext } from "./FolderExplorerContext";
import { FileItemIcon } from "./FileItemIcon";
import { IFullFileExplorerProps, ViewType } from "./IFullFileExplorerProps";
import { IFileSystemItem } from "./IFileSystemItem";
import { IFolder } from "./IFolder";
import { IFileViewColumn } from "./IFileViewColumn";
import { SearchBox } from "@fluentui/react/lib/SearchBox";

interface IFullFileExplorerState {
  viewType: ViewType;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  selectedFolderPath: string;
  expandedFolders: string[];
  currentFolderContent: IFileSystemItem[];
  rootFolder: IFolder;
  contextualMenuProps?: IContextualMenuProps;
  fileFilterText?: string;
  sortColumn?: string;
  sortAscending?: boolean;
}

const FullFileExplorer = (props: IFullFileExplorerProps) => {
  const [controlState, setControlState] = useState({
    viewType: props.defaultViewType ?? ViewType.Compact,
    selectedFolderPath: props.currentFolderPath,
    expandedFolders: [props.currentFolderPath],
    fileFilterText: undefined,
  } as IFullFileExplorerState);

  const handleSelectionChange = () => {
    props.selectRecords(
      selection.getSelection().map((s) => (s.key ? s.key.toString() : ""))
    );
  };

  const selection = React.useMemo(
    () =>
      new Selection({
        selectionMode: SelectionMode.multiple,
        onSelectionChanged: handleSelectionChange,
        items: props.currentFolderContent as IObjectWithKey[],
      }),
    []
  );

  useEffect(() => {
    // Initialize sort state from props
    const sortedColumn = props.columns.find(c => c.isSorted);
    const initialSortColumn = sortedColumn?.name;
    const initialSortAscending = sortedColumn ? !sortedColumn.isSortedDescending : true;

    console.log('[REACT-INIT] Initial sort state:', { column: initialSortColumn, ascending: initialSortAscending });

    setControlState({
      ...controlState,
      loading: true,
      sortColumn: initialSortColumn,
      sortAscending: initialSortAscending,
    });

    props.getFolderStructure().then((folder) => {
      setControlState({
        ...controlState,
        currentFolderContent: props.currentFolderContent,
        selectedFolderPath: folder.path,
        expandedFolders: [folder.path],
        loading: false,
        rootFolder: folder,
        sortColumn: initialSortColumn,
        sortAscending: initialSortAscending,
      });
    });
  }, []);

  useEffect(() => {
    console.log('[REACT-EFFECT] useEffect triggered - sortColumn:', controlState.sortColumn, 'sortAscending:', controlState.sortAscending);
    const filteredContent = getFilteredContent();

    selection.setChangeEvents(false);
    selection.setItems(filteredContent);

    props.selectedRecordsKeys.forEach((id) => {
      selection.setKeySelected(id, true, false);
    });
    selection.setChangeEvents(true);
  }, [props.currentFolderContent, props.selectedRecordsKeys, controlState.fileFilterText, controlState.selectedFolderPath, controlState.sortColumn, controlState.sortAscending]);

  // Sync internal state when folder path changes externally
  useEffect(() => {
    if (props.currentFolderPath !== controlState.selectedFolderPath) {
      setControlState({
        ...controlState,
        selectedFolderPath: props.currentFolderPath,
      });
    }
  }, [props.currentFolderPath]);

  const filterByFolderPath = (items: IFileSystemItem[], folderPath: string): IFileSystemItem[] => {
    // Filter to show ALL documents under the specified folder (recursively)
    return items.filter(doc => {
      const docLocation = doc.relativelocation || doc.path || '';
      
      // Check if doc is anywhere under this folder path
      return docLocation.startsWith(folderPath + '/');
    });
  };

  const filterBySearchText = (items: IFileSystemItem[], filterText?: string): IFileSystemItem[] => {
    if (!filterText || filterText.trim() === '') {
      return items;
    }
    const lowerFilterText = filterText.toLowerCase().trim();
    return items.filter((item) => 
      item && item.fullname && item.fullname.toLowerCase().includes(lowerFilterText)
    );
  };

  const onFileFilterChanged = (newFilterText: string | undefined) => {
    setControlState({
      ...controlState,
      fileFilterText: newFilterText,
    });
  };

  // Client-side sorting function
  const sortItems = (items: IFileSystemItem[], sortColumn?: string, sortAscending?: boolean): IFileSystemItem[] => {
    if (!sortColumn) return items;

    console.log('[REACT-SORT] Sorting', items.length, 'items by', sortColumn, 'ascending:', sortAscending);

    return [...items].sort((a, b) => {
      const aValue = a[sortColumn as keyof IFileSystemItem] as string || "";
      const bValue = b[sortColumn as keyof IFileSystemItem] as string || "";

      // Handle numeric sorting for certain fields
      if (sortColumn === "size" || sortColumn === "filesize") {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortAscending ? aNum - bNum : bNum - aNum;
      }

      // String comparison for all other fields
      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortAscending ? comparison : -comparison;
    });
  };

  const getFilteredContent = (): IFileSystemItem[] => {
    // First filter by folder path
    let filtered = filterByFolderPath(props.currentFolderContent, controlState.selectedFolderPath);

    // Then apply search text filter
    filtered = filterBySearchText(filtered, controlState.fileFilterText);

    // Apply client-side sorting if sort state exists
    console.log('[REACT-FILTER] getFilteredContent - sortColumn:', controlState.sortColumn, 'ascending:', controlState.sortAscending);
    if (controlState.sortColumn) {
      filtered = sortItems(filtered, controlState.sortColumn, controlState.sortAscending);
    } else {
      console.log('[REACT-FILTER] No sort column - returning unsorted');
    }

    return filtered;
  };

  const handleSwitchLayout = (item?: IContextualMenuItem) => {
    if (item) {
      setControlState({
        ...controlState,
        loading: false,
        viewType: +item.key as ViewType,
      });
    }
  };

  const getCommandBarItems = (): ICommandBarItemProps[] => {
    return [
      {
        key: "filter",
        onRender: () => (
          <SearchBox
            placeholder={props.resources.FilterFilesByName}
            underlined={false}
            className="filesSearchBox"
            styles={{ root: { width: 200, marginLeft: 8 } }}
            onSearch={onFileFilterChanged}
            onChange={(e, value) => onFileFilterChanged(value)}
          />
        ),
      },
    ];
  };

  const getViewTypeCommandBarItems = (): ICommandBarItemProps[] => {
    let viewIconName: string;
    let viewName: string;
    switch (controlState.viewType) {
      case ViewType.List:
        viewIconName = "List";
        viewName = props.resources.ListView;
        break;
      case ViewType.Compact:
        viewIconName = "AlignLeft";
        viewName = props.resources.CompactView;
        break;
      default:
        viewIconName = "GridViewMedium";
        viewName = props.resources.TileView;
    }

    const farItems: ICommandBarItemProps[] = [
      {
        key: "listOptions",
        className: "commandBarNoChevron",
        title: props.resources.OpenViewOptionsMenu,
        ariaLabel: props.resources.ViewOptionsSelected.replace('{0}', viewName),
        name: viewName,
        iconProps: {
          iconName: viewIconName,
        },
        //iconOnly: true,
        subMenuProps: {
          items: [
            {
              key: ViewType.List.toString(),
              name: props.resources.ListView,
              iconProps: {
                iconName: "List",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.List,
              ariaLabel: props.resources.ViewOptionsLabel.replace('{0}', props.resources.ListView).replace('{1}', controlState.viewType === ViewType.List ? props.resources.Selected : ''),
              title: props.resources.ViewItemsInList,
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Compact.toString(),
              name: props.resources.CompactView,
              iconProps: {
                iconName: "AlignLeft",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Compact,
              ariaLabel: props.resources.ViewOptionsLabel.replace('{0}', props.resources.CompactView).replace('{1}', controlState.viewType === ViewType.Compact ? props.resources.Selected : ''),
              title: props.resources.ViewItemsInCompactList,
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Tiles.toString(),
              name: props.resources.TileView,
              iconProps: {
                iconName: "GridViewMedium",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Tiles,
              ariaLabel: props.resources.ViewOptionsLabel.replace('{0}', props.resources.TileView).replace('{1}', controlState.viewType === ViewType.Tiles ? props.resources.Selected : ''),
              title: props.resources.ViewItemsWithTiles,
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
          ],
        },
      },
    ];
    return farItems;
  };

  const buildBreadcrums = (folderInfo: IFolder): IBreadcrumbItem[] => {
    let items: IBreadcrumbItem[] = [];
    if (folderInfo.path == controlState.selectedFolderPath) {
      items.push({
        text: folderInfo.name,
        key: folderInfo.path,
        onClick: onBreadcrumbItemClicked,
        isCurrentItem: true,
      });
    } else {
      if (folderInfo.children) {
        folderInfo.children.forEach((subfolder) => {
          const childItems = buildBreadcrums(subfolder);
          if (childItems && childItems.length > 0) {
            items.push({
              text: folderInfo.name,
              key: folderInfo.path,
              onClick: onBreadcrumbItemClicked,
            });

            items = items.concat(childItems);
          }
        });
      }
    }
    return items;
  };

  const onBreadcrumbItemClicked = (
    ev?: React.MouseEvent<HTMLElement>,
    item?: IBreadcrumbItem
  ) => {
    if (item && item.key) {
      setCurrentFolder(item.key);
    }
  };

  const setCurrentFolder = (path: string) => {
    setControlState({
      ...controlState,
      selectedFolderPath: path,
      //loading: true,
      error: false,
      errorMessage: undefined,
    });
    props.setCurrentFolder(path);
  };

  const setExpandedFoldersPaths = (paths: string[]) => {
    setControlState({ ...controlState, expandedFolders: paths });
  };

  const openFileItem = (item: IFileSystemItem) => {
    if (item.filetype == "folder") {
      setCurrentFolder(item.path);
    } else {
      props.openRecord(item.reference);
    }
  };

  const renderCell = (
    item: IFileSystemItem,
    column?: IColumn,
    isPrimary?: boolean,
    renderIcon?: boolean
  ): JSX.Element => {
    let cellElement = <></>;
    if (item && column) {
      const fieldValue = item[
        column.fieldName as keyof IFileSystemItem
      ] as string;
      cellElement = (
        <>
          {renderIcon && (
            <FileItemIcon
              isFolder={item.filetype === "folder"}
              isCheckedOut={item.ischeckedout == 1}
              isSharedLocation={item.isSharedLocation}
              extension={item.filetype}
              size={"small"}
              className={`tileIcon small`}
            />
          )}{" "}
          {fieldValue}
        </>
      );
      if (isPrimary) {
        cellElement = (
          <Link onClick={() => openFileItem(item)}>{cellElement}</Link>
        );
      }
    }

    return cellElement;
  };

  const onActionMenuClosed = () => {
    setControlState({ ...controlState, contextualMenuProps: undefined });
  };

  const onSortAction = (column: IColumn, ascending: boolean) => {
    console.log('[REACT-SORT] onSortAction called - column:', column.key, 'ascending:', ascending);

    // Update React state for immediate UI update - use functional form to avoid stale closure
    setControlState((prevState) => {
      console.log('[REACT-SORT] Updating state from:', prevState.sortColumn, 'to:', column.key);
      return {
        ...prevState,
        sortColumn: column.key,
        sortAscending: ascending,
        loading: false, // Don't show loading for client-side sort
      };
    });

    // Also call props.setSorting to persist in cache (but won't wait for re-render)
    props.setSorting(column.key, ascending);
  };

  const onColumnClick = (
    ev: React.MouseEvent<HTMLElement>,
    column: IColumn
  ) => {
    if (column.columnActionsMode !== ColumnActionsMode.disabled) {
      const actionsMenuProps = {
        items: [
          {
            key: "aToZ",
            name: props.resources.SortAtoZ,
            //iconProps: { iconName: "SortUp" },
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => onSortAction(column, true),
          },
          {
            key: "zToA",
            name: props.resources.SortZtoA,
            //iconProps: { iconName: "SortDown" },
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: () => onSortAction(column, false),
          },
        ],
        target: ev.currentTarget as HTMLElement,
        directionalHint: DirectionalHint.bottomLeftEdge,
        onDismiss: onActionMenuClosed,
      };
      setControlState({
        ...controlState,
        contextualMenuProps: actionsMenuProps,
      });
    }
  };

  const getViewColumns = (columns: IFileViewColumn[]): IColumn[] => {
    return columns.map((c) => {
      const isFullName = c.name === 'fullname';
      const isRelativePath = c.name === 'relativelocation';
      const isFlex = isFullName || isRelativePath;

      // FIX for Problem C: Use relativelocationDisplay for display, but keep key as relativelocation for sorting
      const displayFieldName = isRelativePath ? 'relativelocationDisplay' : c.name;

      // Use React state for sort indicators instead of props
      const isSorted = controlState.sortColumn === c.name;
      const isSortedDescending = isSorted && !controlState.sortAscending;

      const columnDefinition: IColumn = {
        key: c.name,
        name: c.displayName,
        fieldName: displayFieldName,
        // Flex columns: small minWidth (100px) allows equal 50/50 split
        // Fixed columns: use visualSizeFactor for both min and max
        minWidth: isFlex ? 100 : (c.visualSizeFactor ?? 100),
        maxWidth: isFlex ? undefined : (c.visualSizeFactor ?? 100),
        isResizable: true,
        isRowHeader: true,
        isSorted: isSorted,
        isSortedDescending: isSortedDescending,
        sortAscendingAriaLabel: c.sortAscendingLabel ?? props.resources.SortedAtoZ,
        sortDescendingAriaLabel: c.sortDescendingLabel ?? props.resources.SortedZtoA,

        onColumnClick: onColumnClick,
        onRender: (item, index, column) =>
          renderCell(item, column, c.isPrimary, c.renderIcon),
      };

      return columnDefinition;
    });
  };

  return (
    <div className="spFileExplorer">
      {controlState.loading && (
        <div className="loadingContainer">
          <Spinner
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
            size={SpinnerSize.large}
            label={props.resources.Loading}
            ariaLive="assertive"
            labelPosition="bottom"
          />
        </div>
      )}
      <FolderExplorerContext.Provider
        value={{
          selectedFolderPath: controlState.selectedFolderPath,
          setSelectedFolderPath: setCurrentFolder,
          expandedFoldersPaths: controlState.expandedFolders,
          setExpandedFoldersPaths: setExpandedFoldersPaths,
        }}
      >
        {controlState.rootFolder && !props.hideFoldersPane && (
          <FolderExplorer
            rootItem={controlState.rootFolder}
            hideSearchBox={props.hideFoldersSearchBox}
            resources={props.resources}
          ></FolderExplorer>
        )}

        <div className="filesViewPanel">
          <CommandBar
            className="explorerCommandBar"
            items={getCommandBarItems()}
            farItems={getViewTypeCommandBarItems()}
            ariaLabel={props.resources.FileActions}
          />
          <div className="fileView">
            {controlState.selectedFolderPath ? (
              <>
                {controlState.rootFolder && (
                  <Breadcrumb
                    items={buildBreadcrums(controlState.rootFolder)}
                  ></Breadcrumb>
                )}
                {props.error && (
                  <div className="errorBanner">
                    <div className="errorIcon">⚠</div>
                    <div className="errorContent">
                      <div className="errorMessage">{props.error.message}</div>
                      {props.error.code && (
                        <div className="errorCode">Error Code: {props.error.code}</div>
                      )}
                    </div>
                  </div>
                )}
                {getFilteredContent().length > 0 ? (
                  <div className="fileViewContent">
                    <MarqueeSelection selection={selection}>
                      {controlState.viewType !== ViewType.Tiles ? (
                        <>
                          <DetailsList
                            items={getFilteredContent()}
                            compact={controlState.viewType === ViewType.Compact}
                            columns={getViewColumns(props.columns)}
                            setKey="key"
                            selection={selection}
                            layoutMode={DetailsListLayoutMode.justified}
                          />
                          {controlState.contextualMenuProps && (
                            <ContextualMenu
                              {...controlState.contextualMenuProps}
                            />
                          )}
                        </>
                      ) : (
                        <TilesView
                          items={getFilteredContent()}
                          tileSize={"large"}
                          openFileItem={openFileItem}
                          selection={selection}
                        ></TilesView>
                      )}
                    </MarqueeSelection>
                  </div>
                ) : (
                  <div className="emptyFolderMessage">
                    {controlState.fileFilterText ? props.resources.NoFilesMatchSearch : props.resources.FolderIsEmpty}
                  </div>
                )}
              </>
            ) : (
              <div className="selectFolderMessage">
                {props.resources.SelectFolder}
              </div>
            )}
          </div>
        </div>
      </FolderExplorerContext.Provider>
    </div>
  );
};

export default FullFileExplorer;
