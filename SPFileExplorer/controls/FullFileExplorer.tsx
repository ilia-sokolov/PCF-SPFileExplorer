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
}

const FullFileExplorer = (props: IFullFileExplorerProps) => {
  const [controlState, setControlState] = useState({
    viewType: props.defaultViewType ?? ViewType.Tiles,
    selectedFolderPath: props.currentFolderPath,
    expandedFolders: [props.currentFolderPath],
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
    setControlState({
      ...controlState,
      loading: true,
    });

    props.getFolderStructure().then((folder) => {
      setControlState({
        ...controlState,
        currentFolderContent: props.currentFolderContent,
        selectedFolderPath: folder.path,
        expandedFolders: [folder.path],
        loading: false,
        rootFolder: folder,
      });
    });
  }, []);

  useEffect(() => {
    selection.setChangeEvents(false);
    selection.setItems(props.currentFolderContent);

    props.selectedRecordsKeys.forEach((id) => {
      selection.setKeySelected(id, true, false);
    });
    selection.setChangeEvents(true);

    setControlState({
      ...controlState,
      currentFolderContent: props.currentFolderContent,
    });
  }, [props.currentFolderContent, props.selectedRecordsKeys]);

  const handleSwitchLayout = (item?: IContextualMenuItem) => {
    if (item) {
      setControlState({
        ...controlState,
        loading: false,
        viewType: +item.key as ViewType,
      });
    }
  };

  const getViewTypeCommandBarItems = (): ICommandBarItemProps[] => {
    let viewIconName: string;
    let viewName: string;
    switch (controlState.viewType) {
      case ViewType.List:
        viewIconName = "List";
        viewName = "List view";
        break;
      case ViewType.Compact:
        viewIconName = "AlignLeft";
        viewName = "Compact view";
        break;
      default:
        viewIconName = "GridViewMedium";
        viewName = "Tile view";
    }

    const farItems: ICommandBarItemProps[] = [
      {
        key: "listOptions",
        className: "commandBarNoChevron",
        title: "Open the view options menu",
        ariaLabel: `View options. ${viewName} selected.`,
        name: viewName,
        iconProps: {
          iconName: viewIconName,
        },
        //iconOnly: true,
        subMenuProps: {
          items: [
            {
              key: ViewType.List.toString(),
              name: "List view",
              iconProps: {
                iconName: "List",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.List,
              ariaLabel: `View options. List view${
                controlState.viewType === ViewType.List ? " selected" : ""
              }.`,
              title: "View items and details in a list",
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Compact.toString(),
              name: "Compact view",
              iconProps: {
                iconName: "AlignLeft",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Compact,
              ariaLabel: `View options. Compact view${
                controlState.viewType === ViewType.Compact ? " selected" : ""
              }.`,
              title: "View items and details in a compact list",
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Tiles.toString(),
              name: "Tile view",
              iconProps: {
                iconName: "GridViewMedium",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Tiles,
              ariaLabel: `View options. Tile view${
                controlState.viewType === ViewType.Tiles ? " selected" : ""
              }.`,
              title: "View items with tile previews",
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
    setControlState({
      ...controlState,
      loading: true,
    });

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
            name: "Sort A to Z",
            //iconProps: { iconName: "SortUp" },
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => onSortAction(column, true),
          },
          {
            key: "zToA",
            name: "Sort Z to A",
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
      const columnDefinition: IColumn = {
        key: c.name,
        name: c.displayName,
        fieldName: c.name,
        minWidth: c.visualSizeFactor ?? 0,
        maxWidth: 0,
        isResizable: true,
        isRowHeader: true,
        isSorted: c.isSorted,
        isSortedDescending: c.isSortedDescending,
        sortAscendingAriaLabel: c.sortAscendingLabel ?? "Sorted A to Z",
        sortDescendingAriaLabel: c.sortDescendingLabel ?? "Sorted Z to A",

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
            label="Loading..."
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
        {controlState.rootFolder && (
          <FolderExplorer
            rootItem={controlState.rootFolder}
            hideSearchBox={props.hideFoldersSearchBox}
          ></FolderExplorer>
        )}

        <div className="filesViewPanel">
          <CommandBar
            className="explorerCommandBar"
            items={[]}
            farItems={getViewTypeCommandBarItems()}
            ariaLabel="File actions"
          />
          <div className="fileView">
            {controlState.selectedFolderPath ? (
              <>
                {controlState.rootFolder && (
                  <Breadcrumb
                    items={buildBreadcrums(controlState.rootFolder)}
                  ></Breadcrumb>
                )}
                {controlState.currentFolderContent &&
                controlState.currentFolderContent.length > 0 ? (
                  <div className="fileViewContent">
                    <MarqueeSelection selection={selection}>
                      {controlState.viewType !== ViewType.Tiles ? (
                        <>
                          <DetailsList
                            items={controlState.currentFolderContent}
                            compact={controlState.viewType === ViewType.Compact}
                            columns={getViewColumns(props.columns)}
                            setKey="key"
                            selection={selection}
                          />
                          {controlState.contextualMenuProps && (
                            <ContextualMenu
                              {...controlState.contextualMenuProps}
                            />
                          )}
                        </>
                      ) : (
                        <TilesView
                          items={controlState.currentFolderContent}
                          tileSize={"large"}
                          openFileItem={openFileItem}
                          selection={selection}
                        ></TilesView>
                      )}
                    </MarqueeSelection>
                  </div>
                ) : (
                  <div className="emptyFolderMessage">This folder is empty</div>
                )}
              </>
            ) : (
              <div className="selectFolderMessage">
                Please, select a folder to explore its content.
              </div>
            )}
          </div>
        </div>
      </FolderExplorerContext.Provider>
    </div>
  );
};

export default FullFileExplorer;
