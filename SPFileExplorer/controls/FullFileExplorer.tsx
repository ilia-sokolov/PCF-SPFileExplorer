import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";

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
import { DEFAULT_STRINGS, formatString } from "./Strings";

interface IFullFileExplorerState {
  viewType: ViewType;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  selectedFolderPath: string;
  expandedFolders: string[];
  currentFolderContent: IFileSystemItem[];
  rootFolder: IFolder;
  folderStructureLoaded?: boolean;
  contextualMenuProps?: IContextualMenuProps;
  dragActive?: boolean;
  uploadProgress?: { uploaded: number; total: number };
  uploadMessages?: string[];
  uploadCompleted?: boolean;
}

const VIEW_TYPE_STORAGE_KEY = "SPFileExplorer.viewType";

const getStoredViewType = (): ViewType | undefined => {
  try {
    const storedValue = window.localStorage.getItem(VIEW_TYPE_STORAGE_KEY);
    return storedValue !== null && ViewType[+storedValue] !== undefined
      ? (+storedValue as ViewType)
      : undefined;
  } catch {
    // Storage can be unavailable (e.g. blocked by browser settings).
    return undefined;
  }
};

const storeViewType = (viewType: ViewType) => {
  try {
    window.localStorage.setItem(VIEW_TYPE_STORAGE_KEY, viewType.toString());
  } catch {
    // Storage can be unavailable (e.g. blocked by browser settings).
  }
};

const findFolder = (folder: IFolder, path: string): IFolder | undefined => {
  if (folder.path === path) {
    return folder;
  }
  for (const child of folder.children ?? []) {
    const found = findFolder(child, path);
    if (found) {
      return found;
    }
  }
  return undefined;
};

/**
 * Returns the files and the names of the folders dropped onto the control.
 */
const getDroppedItems = (
  dataTransfer: DataTransfer
): { files: File[]; folders: string[] } => {
  const files: File[] = [];
  const folders: string[] = [];
  const items = Array.from(dataTransfer.items ?? []);
  if (items.length > 0) {
    items.forEach((item) => {
      if (item.kind !== "file") {
        return;
      }
      const entry = item.webkitGetAsEntry?.();
      const file = item.getAsFile();
      if (entry?.isDirectory) {
        folders.push(entry.name);
      } else if (file) {
        files.push(file);
      }
    });
  } else {
    files.push(...Array.from(dataTransfer.files ?? []));
  }
  return { files, folders };
};

/**
 * Returns the paths of the folders from the root folder to the folder with the specified path.
 */
const getParentPaths = (folder: IFolder, path: string): string[] => {
  if (!path || folder.path === path) {
    return [folder.path];
  }
  for (const child of folder.children ?? []) {
    const childPaths = getParentPaths(child, path);
    if (childPaths[childPaths.length - 1] === path) {
      return [folder.path, ...childPaths];
    }
  }
  return [folder.path];
};

const FullFileExplorer = (props: IFullFileExplorerProps) => {
  const strings = props.strings ?? DEFAULT_STRINGS;
  const [controlState, setControlState] = useState({
    viewType:
      (props.rememberViewType !== false ? getStoredViewType() : undefined) ??
      props.defaultViewType ??
      ViewType.Tiles,
    selectedFolderPath: props.currentFolderPath,
    expandedFolders: [props.currentFolderPath],
  } as IFullFileExplorerState);

  // Counts nested dragenter/dragleave events of the files panel.
  const dragDepth = useRef(0);

  // The selection is created once, so its handler reads the latest properties through the ref.
  const propsRef = useRef(props);
  propsRef.current = props;

  const handleSelectionChange = () => {
    propsRef.current.selectRecords(
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
    setControlState((prevState) => ({
      ...prevState,
      loading: true,
    }));

    props.getFolderStructure().then((folder) => {
      // Keeps the folder the dataset is filtered by (e.g. after the tree is reloaded).
      const currentFolderPath = propsRef.current.currentFolderPath;
      setControlState((prevState) =>
        folder
          ? {
              ...prevState,
              selectedFolderPath: currentFolderPath || folder.path,
              expandedFolders: getParentPaths(folder, currentFolderPath),
              loading: false,
              folderStructureLoaded: true,
              rootFolder: folder,
            }
          : { ...prevState, loading: false, folderStructureLoaded: true }
      );
    });
  }, []);

  useEffect(() => {
    selection.setChangeEvents(false);
    selection.setItems(props.currentFolderContent);

    props.selectedRecordsKeys.forEach((id) => {
      selection.setKeySelected(id, true, false);
    });
    selection.setChangeEvents(true);

    setControlState((prevState) => ({
      ...prevState,
      currentFolderContent: props.currentFolderContent,
      // New data has arrived (e.g. after sorting), so the spinner can be hidden
      // unless the folder structure is still being loaded.
      loading: prevState.folderStructureLoaded ? false : prevState.loading,
    }));

    // The tree is changed in place, so a new state object renders it again.
    props.refreshFolderStructure?.().then((changed) => {
      if (changed) {
        setControlState((prevState) => ({ ...prevState }));
      }
    });
  }, [props.currentFolderContent, props.selectedRecordsKeys]);

  const handleSwitchLayout = (item?: IContextualMenuItem) => {
    if (item) {
      const viewType = +item.key as ViewType;
      if (props.rememberViewType !== false) {
        storeViewType(viewType);
      }
      setControlState((prevState) => ({
        ...prevState,
        viewType,
      }));
    }
  };

  const getViewTypeCommandBarItems = (): ICommandBarItemProps[] => {
    let viewIconName: string;
    let viewName: string;
    switch (controlState.viewType) {
      case ViewType.List:
        viewIconName = "List";
        viewName = strings.ListView;
        break;
      case ViewType.Compact:
        viewIconName = "AlignLeft";
        viewName = strings.CompactView;
        break;
      default:
        viewIconName = "GridViewMedium";
        viewName = strings.TileView;
    }

    const farItems: ICommandBarItemProps[] = [
      {
        key: "listOptions",
        className: "commandBarNoChevron",
        title: strings.ViewOptionsTitle,
        ariaLabel: formatString(strings.ViewOptionSelectedAriaLabel, viewName),
        name: viewName,
        iconProps: {
          iconName: viewIconName,
        },
        //iconOnly: true,
        subMenuProps: {
          items: [
            {
              key: ViewType.List.toString(),
              name: strings.ListView,
              iconProps: {
                iconName: "List",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.List,
              ariaLabel: formatString(
                controlState.viewType === ViewType.List
                  ? strings.ViewOptionSelectedAriaLabel
                  : strings.ViewOptionAriaLabel,
                strings.ListView
              ),
              title: strings.ListViewTitle,
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Compact.toString(),
              name: strings.CompactView,
              iconProps: {
                iconName: "AlignLeft",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Compact,
              ariaLabel: formatString(
                controlState.viewType === ViewType.Compact
                  ? strings.ViewOptionSelectedAriaLabel
                  : strings.ViewOptionAriaLabel,
                strings.CompactView
              ),
              title: strings.CompactViewTitle,
              onClick: (
                _ev?:
                  | React.MouseEvent<HTMLElement>
                  | React.KeyboardEvent<HTMLElement>,
                item?: IContextualMenuItem
              ) => handleSwitchLayout(item),
            },
            {
              key: ViewType.Tiles.toString(),
              name: strings.TileView,
              iconProps: {
                iconName: "GridViewMedium",
              },
              canCheck: true,
              checked: controlState.viewType === ViewType.Tiles,
              ariaLabel: formatString(
                controlState.viewType === ViewType.Tiles
                  ? strings.ViewOptionSelectedAriaLabel
                  : strings.ViewOptionAriaLabel,
                strings.TileView
              ),
              title: strings.TileViewTitle,
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
    setControlState((prevState) => ({
      ...prevState,
      selectedFolderPath: path,
      error: false,
      errorMessage: undefined,
    }));
    props.setCurrentFolder(path);
  };

  const setExpandedFoldersPaths = (paths: string[]) => {
    setControlState((prevState) => ({ ...prevState, expandedFolders: paths }));
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
              strings={strings}
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
    setControlState((prevState) => ({
      ...prevState,
      contextualMenuProps: undefined,
    }));
  };

  const onSortAction = (column: IColumn, ascending: boolean) => {
    setControlState((prevState) => ({
      ...prevState,
      loading: true,
    }));

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
            name: strings.SortAscending,
            //iconProps: { iconName: "SortUp" },
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => onSortAction(column, true),
          },
          {
            key: "zToA",
            name: strings.SortDescending,
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
      setControlState((prevState) => ({
        ...prevState,
        contextualMenuProps: actionsMenuProps,
      }));
    }
  };

  const canUpload =
    !!props.uploadFiles &&
    !!controlState.rootFolder &&
    !!controlState.selectedFolderPath &&
    !controlState.uploadProgress;

  const isFileDrag = (ev: React.DragEvent<HTMLElement>): boolean =>
    Array.from(ev.dataTransfer?.types ?? []).indexOf("Files") >= 0;

  const onDragEnter = (ev: React.DragEvent<HTMLElement>) => {
    if (canUpload && isFileDrag(ev)) {
      ev.preventDefault();
      dragDepth.current++;
      if (!controlState.dragActive) {
        setControlState((prevState) => ({ ...prevState, dragActive: true }));
      }
    }
  };

  const onDragOver = (ev: React.DragEvent<HTMLElement>) => {
    if (canUpload && isFileDrag(ev)) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "copy";
    }
  };

  const onDragLeave = (ev: React.DragEvent<HTMLElement>) => {
    if (canUpload && isFileDrag(ev)) {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) {
        setControlState((prevState) => ({ ...prevState, dragActive: false }));
      }
    }
  };

  const onDrop = async (ev: React.DragEvent<HTMLElement>) => {
    if (!canUpload || !props.uploadFiles || !isFileDrag(ev)) {
      return;
    }
    ev.preventDefault();
    dragDepth.current = 0;

    const { files, folders } = getDroppedItems(ev.dataTransfer);
    const messages =
      folders.length > 0
        ? [formatString(strings.FoldersNotUploaded, folders.join(", "))]
        : [];
    setControlState((prevState) => ({
      ...prevState,
      dragActive: false,
      uploadMessages: messages,
      uploadCompleted: false,
      uploadProgress:
        files.length > 0 ? { uploaded: 0, total: files.length } : undefined,
    }));
    if (files.length === 0) {
      return;
    }

    const errors = await props.uploadFiles(
      files,
      controlState.selectedFolderPath,
      (uploaded) =>
        setControlState((prevState) => ({
          ...prevState,
          uploadProgress: { uploaded, total: files.length },
        }))
    );
    setControlState((prevState) => ({
      ...prevState,
      uploadProgress: undefined,
      uploadCompleted: errors.length < files.length,
      uploadMessages: [
        ...messages,
        ...errors.map((e) =>
          formatString(strings.UploadFailed, e.fileName, e.message)
        ),
      ],
    }));
  };

  const dismissUploadMessages = () => {
    setControlState((prevState) => ({
      ...prevState,
      uploadMessages: undefined,
      uploadCompleted: false,
    }));
  };

  const renderUploadMessages = (): JSX.Element | null => {
    if (controlState.uploadProgress) {
      return (
        <MessageBar messageBarType={MessageBarType.info}>
          {formatString(
            strings.Uploading,
            String(
              Math.min(
                controlState.uploadProgress.uploaded + 1,
                controlState.uploadProgress.total
              )
            ),
            String(controlState.uploadProgress.total)
          )}
        </MessageBar>
      );
    }
    if (controlState.uploadMessages && controlState.uploadMessages.length > 0) {
      return (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={true}
          onDismiss={dismissUploadMessages}
          dismissButtonAriaLabel={strings.Close}
        >
          {controlState.uploadMessages.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </MessageBar>
      );
    }
    if (controlState.uploadCompleted) {
      return (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={dismissUploadMessages}
          dismissButtonAriaLabel={strings.Close}
        >
          {strings.UploadCompleted}
        </MessageBar>
      );
    }
    return null;
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
        sortAscendingAriaLabel: c.sortAscendingLabel ?? strings.SortedAscending,
        sortDescendingAriaLabel: c.sortDescendingLabel ?? strings.SortedDescending,

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
            label={strings.Loading}
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
            strings={strings}
          ></FolderExplorer>
        )}

        <div
          className="filesViewPanel"
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <CommandBar
            className="explorerCommandBar"
            items={[]}
            farItems={getViewTypeCommandBarItems()}
            ariaLabel={strings.FileActions}
          />
          <div className="uploadMessages">{renderUploadMessages()}</div>
          {controlState.dragActive && controlState.rootFolder && (
            <div className="dropOverlay">
              {formatString(
                strings.DropFilesHere,
                findFolder(
                  controlState.rootFolder,
                  controlState.selectedFolderPath
                )?.name ?? controlState.rootFolder.name
              )}
            </div>
          )}
          <div className="fileView">
            {controlState.selectedFolderPath ||
            (controlState.folderStructureLoaded && !controlState.rootFolder) ? (
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
                          strings={strings}
                        ></TilesView>
                      )}
                    </MarqueeSelection>
                  </div>
                ) : (
                  <div className="emptyFolderMessage">
                    {controlState.rootFolder
                      ? strings.FolderEmpty
                      : strings.NoDocumentLocation}
                  </div>
                )}
              </>
            ) : (
              <div className="selectFolderMessage">{strings.SelectFolder}</div>
            )}
          </div>
        </div>
      </FolderExplorerContext.Provider>
    </div>
  );
};

export default FullFileExplorer;
