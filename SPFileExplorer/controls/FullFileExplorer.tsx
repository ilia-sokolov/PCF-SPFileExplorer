import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  CommandBar,
  ICommandBarItemProps,
} from "@fluentui/react/lib/CommandBar";

import {
  IContextualMenuProps,
  ContextualMenu,
  ContextualMenuItemType,
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
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { Checkbox } from "@fluentui/react/lib/Checkbox";
import { IconButton } from "@fluentui/react/lib/Button";

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
import {
  canPreview,
  getBrowserUrl,
  getDesktopAppUrl,
  getDownloadUrl,
  getEmbedPreviewUrl,
  getFolderUrl,
  getItemUrl,
  getPreviewImageUrl,
  ILocationUrls,
  toEncodedUrl,
} from "./FileLinks";
import { PreviewPane } from "./PreviewPane";

type TileSize = "small" | "large";

interface IMessage {
  type: MessageBarType;
  text: string;
}

interface IClientSort {
  column: string;
  descending: boolean;
}

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
  selectedItems: IFileSystemItem[];
  searchText: string;
  searchAllFolders: boolean;
  searchResults?: IFileSystemItem[];
  searching?: boolean;
  searchError?: string;
  clientSort?: IClientSort;
  showingCachedContent?: boolean;
  tileSize: TileSize;
  previewOpen: boolean;
  narrow: boolean;
  compactCommands: boolean;
  foldersPanelOpen: boolean;
  locationUrls?: ILocationUrls | null;
  message?: IMessage;
}

const VIEW_TYPE_STORAGE_KEY = "SPFileExplorer.viewType";
const TILE_SIZE_STORAGE_KEY = "SPFileExplorer.tileSize";
const PREVIEW_STORAGE_KEY = "SPFileExplorer.preview";
// Width of the control below which the phone/tablet layout is used.
const NARROW_WIDTH = 640;
// Width of the files panel below which the commands are shown without text.
const COMPACT_COMMANDS_WIDTH = 760;
const SEARCH_DELAY_MS = 400;
const MIN_SEARCH_LENGTH = 2;

const readSetting = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can be unavailable (e.g. blocked by browser settings).
    return null;
  }
};

const writeSetting = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (e.g. blocked by browser settings).
  }
};

const getStoredViewType = (): ViewType | undefined => {
  const storedValue = readSetting(VIEW_TYPE_STORAGE_KEY);
  return storedValue !== null && ViewType[+storedValue] !== undefined
    ? (+storedValue as ViewType)
    : undefined;
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

const isFolder = (item: IFileSystemItem): boolean => item.filetype === "folder";

/**
 * Opens an URL in a new tab, or an application link (e.g. ms-word:) in place.
 */
const openUrl = (url: string) => {
  const link = document.createElement("a");
  link.href = url;
  if (/^https?:/i.test(url)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    selectedItems: [],
    searchText: "",
    searchAllFolders: false,
    tileSize: readSetting(TILE_SIZE_STORAGE_KEY) === "small" ? "small" : "large",
    previewOpen: readSetting(PREVIEW_STORAGE_KEY) === "true",
    narrow: false,
    compactCommands: false,
    foldersPanelOpen: false,
  } as unknown as IFullFileExplorerState);

  // Counts nested dragenter/dragleave events of the files panel.
  const dragDepth = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const filesPanelRef = useRef<HTMLDivElement>(null);
  // Content of the folders opened before, by folder path (shown while the folder is reloaded).
  const folderCache = useRef(new Map<string, IFileSystemItem[]>());
  // Identifies the latest search across folders, so that older results are ignored.
  const searchRequest = useRef(0);

  // The selection is created once, so its handler reads the latest properties through the ref.
  const propsRef = useRef(props);
  propsRef.current = props;

  const handleSelectionChange = () => {
    const selectedItems = selection.getSelection() as IFileSystemItem[];
    // Search results across folders are not records of the dataset.
    propsRef.current.selectRecords(
      selectedItems
        .filter((s) => !s.isSearchResult)
        .map((s) => (s.key ? s.key.toString() : ""))
    );
    setControlState((prevState) => ({
      ...prevState,
      selectedItems,
    }));
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

  const rootPath = controlState.rootFolder?.path ?? "";
  const searchAcrossFolders =
    controlState.searchAllFolders &&
    !!props.searchAllFolders &&
    controlState.searchText.trim().length >= MIN_SEARCH_LENGTH;

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
      if (folder) {
        propsRef.current.getLocationUrls?.().then((locationUrls) =>
          setControlState((prevState) => ({ ...prevState, locationUrls }))
        );
      }
    });
  }, []);

  // Phone/tablet layout when the control is narrow.
  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const narrow = entries[0].contentRect.width < NARROW_WIDTH;
      setControlState((prevState) =>
        prevState.narrow === narrow ? prevState : { ...prevState, narrow }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Commands without text when the files panel is small (e.g. next to the preview pane).
  useEffect(() => {
    const element = filesPanelRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const compactCommands = entries[0].contentRect.width < COMPACT_COMMANDS_WIDTH;
      setControlState((prevState) =>
        prevState.compactCommands === compactCommands
          ? prevState
          : { ...prevState, compactCommands }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Content of a folder that is still being loaded is not shown, so that the
    // cached content of the opened folder is not replaced by the previous folder.
    if (props.isLoading) {
      return;
    }
    const contentPath = props.currentFolderPath || rootPath;
    folderCache.current.set(contentPath, props.currentFolderContent);

    setControlState((prevState) => ({
      ...prevState,
      currentFolderContent: props.currentFolderContent,
      showingCachedContent: false,
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
  }, [props.currentFolderContent, props.isLoading]);

  // Search across all folders, started after the user stops typing.
  useEffect(() => {
    if (!searchAcrossFolders || !props.searchAllFolders) {
      setControlState((prevState) =>
        prevState.searchResults || prevState.searching
          ? { ...prevState, searchResults: undefined, searching: false, searchError: undefined }
          : prevState
      );
      return;
    }
    const request = ++searchRequest.current;
    setControlState((prevState) => ({ ...prevState, searching: true, searchError: undefined }));
    const timer = window.setTimeout(() => {
      propsRef.current
        .searchAllFolders?.(controlState.searchText)
        .then((searchResults) => {
          if (request === searchRequest.current) {
            setControlState((prevState) => ({ ...prevState, searchResults, searching: false }));
          }
        })
        .catch((e) => {
          if (request === searchRequest.current) {
            setControlState((prevState) => ({
              ...prevState,
              searchResults: [],
              searching: false,
              searchError: (e as Error)?.message ?? String(e),
            }));
          }
        });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [controlState.searchText, searchAcrossFolders]);

  const getDisplayedItems = (): IFileSystemItem[] => {
    let items: IFileSystemItem[];
    if (searchAcrossFolders) {
      items = controlState.searchResults ?? [];
    } else {
      const searchText = controlState.searchText.trim().toLowerCase();
      items = (controlState.currentFolderContent ?? []).filter(
        (item) =>
          !searchText ||
          String(item.fullname ?? "").toLowerCase().indexOf(searchText) >= 0
      );
    }
    const sort = controlState.clientSort;
    if (searchAcrossFolders && sort) {
      items = [...items].sort((a, b) => {
        const result = String(a[sort.column] ?? "").localeCompare(
          String(b[sort.column] ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
        return sort.descending ? -result : result;
      });
    }
    return items;
  };
  const displayedItems = getDisplayedItems();

  useEffect(() => {
    selection.setChangeEvents(false);
    selection.setItems(displayedItems, false);
    if (!searchAcrossFolders) {
      props.selectedRecordsKeys.forEach((id) => {
        selection.setKeySelected(id, true, false);
      });
    }
    selection.setChangeEvents(true);
    setControlState((prevState) => ({
      ...prevState,
      selectedItems: selection.getSelection() as IFileSystemItem[],
    }));
  }, [displayedItems.map((i) => i.key).join("|"), props.selectedRecordsKeys]);

  const showMessage = (type: MessageBarType, text: string) =>
    setControlState((prevState) => ({ ...prevState, message: { type, text } }));

  const handleSwitchLayout = (item?: IContextualMenuItem) => {
    if (item) {
      const viewType = +item.key as ViewType;
      if (props.rememberViewType !== false) {
        writeSetting(VIEW_TYPE_STORAGE_KEY, viewType.toString());
      }
      setControlState((prevState) => ({
        ...prevState,
        viewType,
      }));
    }
  };

  const setTileSize = (tileSize: TileSize) => {
    writeSetting(TILE_SIZE_STORAGE_KEY, tileSize);
    setControlState((prevState) => ({ ...prevState, tileSize }));
  };

  const togglePreview = () => {
    writeSetting(PREVIEW_STORAGE_KEY, String(!controlState.previewOpen));
    setControlState((prevState) => ({
      ...prevState,
      previewOpen: !prevState.previewOpen,
    }));
  };

  const getItemLink = (item: IFileSystemItem): string | undefined => {
    const urls = controlState.locationUrls;
    if (!urls) {
      return item.absoluteurl || undefined;
    }
    return isFolder(item)
      ? getFolderUrl(urls, item.path)
      : getItemUrl(
          urls,
          item.absoluteurl,
          item.fullname,
          item.folderPath ?? controlState.selectedFolderPath
        );
  };

  const getThumbnailUrl = (
    item: IFileSystemItem,
    size: "medium" | "large"
  ): string | undefined => {
    if (isFolder(item) || !canPreview(item.filetype)) {
      return undefined;
    }
    const url = getItemLink(item);
    return url && controlState.locationUrls
      ? getPreviewImageUrl(controlState.locationUrls.siteUrl, url, size === "large" ? 4 : 1)
      : undefined;
  };

  const copyLink = (url: string) => {
    navigator.clipboard
      ?.writeText(toEncodedUrl(url))
      .then(() => showMessage(MessageBarType.success, strings.LinkCopied))
      .catch(() => showMessage(MessageBarType.error, url));
  };

  const iconOnlyCommands = controlState.narrow || controlState.compactCommands;

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

    const viewItem = (
      viewType: ViewType,
      name: string,
      iconName: string,
      title: string
    ): IContextualMenuItem => ({
      key: viewType.toString(),
      name,
      iconProps: { iconName },
      canCheck: true,
      checked: controlState.viewType === viewType,
      ariaLabel: formatString(
        controlState.viewType === viewType
          ? strings.ViewOptionSelectedAriaLabel
          : strings.ViewOptionAriaLabel,
        name
      ),
      title,
      onClick: (
        _ev?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        item?: IContextualMenuItem
      ) => handleSwitchLayout(item),
    });

    return [
      getSortCommandBarItem(),
      {
        key: "listOptions",
        className: "commandBarNoChevron",
        title: strings.ViewOptionsTitle,
        ariaLabel: formatString(strings.ViewOptionSelectedAriaLabel, viewName),
        name: viewName,
        iconOnly: iconOnlyCommands,
        iconProps: {
          iconName: viewIconName,
        },
        subMenuProps: {
          items: [
            viewItem(ViewType.List, strings.ListView, "List", strings.ListViewTitle),
            viewItem(
              ViewType.Compact,
              strings.CompactView,
              "AlignLeft",
              strings.CompactViewTitle
            ),
            viewItem(ViewType.Tiles, strings.TileView, "GridViewMedium", strings.TileViewTitle),
            { key: "tileSizeDivider", itemType: ContextualMenuItemType.Divider },
            {
              key: "tileSize",
              itemType: ContextualMenuItemType.Section,
              sectionProps: {
                title: strings.TileSize,
                items: [
                  {
                    key: "smallTiles",
                    name: strings.SmallTiles,
                    iconProps: { iconName: "GridViewSmall" },
                    canCheck: true,
                    checked: controlState.tileSize === "small",
                    onClick: () => setTileSize("small"),
                  },
                  {
                    key: "largeTiles",
                    name: strings.LargeTiles,
                    iconProps: { iconName: "GridViewLarge" },
                    canCheck: true,
                    checked: controlState.tileSize === "large",
                    onClick: () => setTileSize("large"),
                  },
                ],
              },
            },
          ],
        },
      },
      {
        key: "preview",
        name: strings.Preview,
        title: strings.PreviewTitle,
        iconOnly: true,
        iconProps: { iconName: "Preview" },
        checked: controlState.previewOpen,
        ariaLabel: strings.PreviewTitle,
        onClick: togglePreview,
      },
    ];
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
    const cachedContent = folderCache.current.get(path);
    setControlState((prevState) => ({
      ...prevState,
      selectedFolderPath: path,
      // The content of a folder opened before is shown right away and refreshed.
      currentFolderContent: cachedContent ?? prevState.currentFolderContent,
      showingCachedContent: !!cachedContent,
      loading: cachedContent ? prevState.loading : true,
      foldersPanelOpen: false,
      searchText: "",
      error: false,
      errorMessage: undefined,
    }));
    props.setCurrentFolder(path);
  };

  const setExpandedFoldersPaths = (paths: string[]) => {
    setControlState((prevState) => ({ ...prevState, expandedFolders: paths }));
  };

  const openFileItem = (item: IFileSystemItem) => {
    if (isFolder(item)) {
      setCurrentFolder(item.path);
    } else if (item.isSearchResult) {
      const url = getItemLink(item);
      if (url) {
        openUrl(url);
      }
    } else {
      props.openRecord(item.reference);
    }
  };

  /**
   * Actions of an item: context menu, command bar and preview pane.
   */
  const getItemActions = (item: IFileSystemItem): IContextualMenuItem[] => {
    const url = getItemLink(item);
    const actions: IContextualMenuItem[] = [
      {
        key: "open",
        text: strings.Open,
        iconProps: { iconName: isFolder(item) ? "FabricOpenFolderHorizontal" : "OpenFile" },
        onClick: () => openFileItem(item),
      },
    ];
    if (url && !isFolder(item)) {
      actions.push({
        key: "openInBrowser",
        text: strings.OpenInBrowser,
        iconProps: { iconName: "Globe" },
        onClick: () => openUrl(getBrowserUrl(url)),
      });
      const desktopUrl = getDesktopAppUrl(url, item.filetype);
      if (desktopUrl) {
        actions.push({
          key: "openInApp",
          text: strings.OpenInApp,
          iconProps: { iconName: "OpenInNewWindow" },
          onClick: () => openUrl(desktopUrl),
        });
      }
      actions.push({
        key: "download",
        text: strings.Download,
        iconProps: { iconName: "Download" },
        onClick: () => openUrl(getDownloadUrl(url)),
      });
    }
    if (url) {
      actions.push({
        key: "copyLink",
        text: strings.CopyLink,
        iconProps: { iconName: "Link" },
        onClick: () => copyLink(url),
      });
      if (isFolder(item)) {
        actions.push({
          key: "openInSharePoint",
          text: strings.OpenInSharePoint,
          iconProps: { iconName: "SharepointLogo" },
          onClick: () => openUrl(url),
        });
      }
    }
    if (item.isSearchResult && item.folderPath !== undefined) {
      actions.push({
        key: "openContainingFolder",
        text: strings.OpenContainingFolder,
        iconProps: { iconName: "FolderOpen" },
        onClick: () => setCurrentFolder(item.folderPath || rootPath),
      });
    }
    return actions;
  };

  const showItemContextMenu = (
    item: IFileSystemItem,
    ev: React.MouseEvent<HTMLElement> | Event
  ) => {
    const index = displayedItems.findIndex((i) => i.key === item.key);
    if (index >= 0 && !selection.isIndexSelected(index)) {
      selection.setAllSelected(false);
      selection.setIndexSelected(index, true, true);
    }
    // React reuses its event objects, so the menu is positioned with the native event.
    const target = ("nativeEvent" in ev ? ev.nativeEvent : ev) as MouseEvent;
    setControlState((prevState) => ({
      ...prevState,
      contextualMenuProps: {
        items: getItemActions(item),
        target,
        directionalHint: DirectionalHint.bottomLeftEdge,
        onDismiss: onActionMenuClosed,
      },
    }));
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
              isFolder={isFolder(item)}
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

  const onSortAction = (columnName: string, ascending: boolean) => {
    if (searchAcrossFolders) {
      // Search results are sorted in the browser.
      setControlState((prevState) => ({
        ...prevState,
        clientSort: { column: columnName, descending: !ascending },
      }));
      return;
    }
    setControlState((prevState) => ({
      ...prevState,
      loading: true,
    }));

    props.setSorting(columnName, ascending);
  };

  const getSortState = (): IClientSort | undefined => {
    if (searchAcrossFolders) {
      return controlState.clientSort;
    }
    const sorted = props.columns.find((c) => c.isSorted);
    return sorted ? { column: sorted.name, descending: !!sorted.isSortedDescending } : undefined;
  };

  /**
   * Sort menu of the command bar, available in all views (also in the tile view).
   */
  const getSortCommandBarItem = (): ICommandBarItemProps => {
    const sort = getSortState();
    const columns = props.columns.filter((c) => c.isSortable);
    return {
      key: "sort",
      name: strings.Sort,
      title: strings.Sort,
      iconOnly: iconOnlyCommands,
      iconProps: { iconName: "Sort" },
      ariaLabel: strings.Sort,
      subMenuProps: {
        items: [
          ...columns.map((c) => ({
            key: `sort-${c.name}`,
            name: c.displayName,
            canCheck: true,
            checked: sort?.column === c.name,
            onClick: () => onSortAction(c.name, !(sort?.descending ?? false)),
          })),
          { key: "sortDivider", itemType: ContextualMenuItemType.Divider },
          {
            key: "ascending",
            name: strings.Ascending,
            iconProps: { iconName: "SortUp" },
            canCheck: true,
            checked: !!sort && !sort.descending,
            disabled: !sort,
            onClick: () => sort && onSortAction(sort.column, true),
          },
          {
            key: "descending",
            name: strings.Descending,
            iconProps: { iconName: "SortDown" },
            canCheck: true,
            checked: !!sort && sort.descending,
            disabled: !sort,
            onClick: () => sort && onSortAction(sort.column, false),
          },
        ],
      },
    };
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
            canCheck: true,
            checked: column.isSorted && !column.isSortedDescending,
            onClick: () => onSortAction(column.key, true),
          },
          {
            key: "zToA",
            name: strings.SortDescending,
            canCheck: true,
            checked: column.isSorted && column.isSortedDescending,
            onClick: () => onSortAction(column.key, false),
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
    !controlState.uploadProgress &&
    !searchAcrossFolders;

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

  const dismissMessages = () => {
    setControlState((prevState) => ({
      ...prevState,
      uploadMessages: undefined,
      uploadCompleted: false,
      message: undefined,
    }));
  };

  const renderMessages = (): JSX.Element | null => {
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
          onDismiss={dismissMessages}
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
          onDismiss={dismissMessages}
          dismissButtonAriaLabel={strings.Close}
        >
          {strings.UploadCompleted}
        </MessageBar>
      );
    }
    if (controlState.message) {
      return (
        <MessageBar
          messageBarType={controlState.message.type}
          isMultiline={true}
          onDismiss={dismissMessages}
          dismissButtonAriaLabel={strings.Close}
        >
          {controlState.message.text}
        </MessageBar>
      );
    }
    return null;
  };

  // Office for the web view of a file, shown in the preview pane.
  const getFullPreviewUrl = (item: IFileSystemItem): string | undefined => {
    const url = !isFolder(item) ? getItemLink(item) : undefined;
    return url && controlState.locationUrls
      ? getEmbedPreviewUrl(controlState.locationUrls.siteUrl, url, item.filetype)
      : undefined;
  };

  const toggleSearchAllFolders = () =>
    setControlState((prevState) => ({
      ...prevState,
      searchAllFolders: !prevState.searchAllFolders,
    }));

  const getCommandBarItems = (): ICommandBarItemProps[] => {
    const items: ICommandBarItemProps[] = [];
    if (controlState.narrow && controlState.rootFolder && !props.hideFoldersPane) {
      items.push({
        key: "folders",
        name: strings.Folders,
        iconOnly: true,
        iconProps: { iconName: "FabricFolder" },
        ariaLabel: strings.Folders,
        checked: controlState.foldersPanelOpen,
        onClick: () =>
          setControlState((prevState) => ({
            ...prevState,
            foldersPanelOpen: !prevState.foldersPanelOpen,
          })),
      });
    }
    items.push({
      key: "search",
      onRender: () => (
        <div className={`searchCommand${iconOnlyCommands ? " compact" : ""}`}>
          <SearchBox
            className="filesSearchBox"
            placeholder={strings.SearchFiles}
            ariaLabel={strings.SearchFiles}
            value={controlState.searchText}
            onChange={(_e, value) =>
              setControlState((prevState) => ({
                ...prevState,
                searchText: value ?? "",
                clientSort: undefined,
              }))
            }
            onClear={() =>
              setControlState((prevState) => ({ ...prevState, searchText: "" }))
            }
          />
          {props.searchAllFolders &&
            (iconOnlyCommands ? (
              <IconButton
                className="searchAllFoldersButton"
                iconProps={{ iconName: "FabricFolderSearch" }}
                title={strings.SearchAllFoldersTitle}
                ariaLabel={strings.SearchAllFoldersTitle}
                toggle={true}
                checked={controlState.searchAllFolders}
                onClick={toggleSearchAllFolders}
              />
            ) : (
              <Checkbox
                className="searchAllFolders"
                label={strings.SearchAllFolders}
                title={strings.SearchAllFoldersTitle}
                checked={controlState.searchAllFolders}
                onChange={toggleSearchAllFolders}
              />
            ))}
        </div>
      ),
    });
    if (controlState.locationUrls && controlState.selectedFolderPath) {
      const folderUrl = getFolderUrl(controlState.locationUrls, controlState.selectedFolderPath);
      items.push({
        key: "openFolderInSharePoint",
        name: strings.OpenInSharePoint,
        title: strings.OpenInSharePoint,
        iconOnly: iconOnlyCommands,
        iconProps: { iconName: "SharepointLogo" },
        onClick: () => openUrl(folderUrl),
      });
    }
    if (controlState.selectedItems.length === 1) {
      const actions = getItemActions(controlState.selectedItems[0]).filter(
        (a) => a.key !== "open"
      );
      if (actions.length > 0) {
        items.push({
          key: "itemActions",
          name: strings.MoreActions,
          iconOnly: true,
          iconProps: { iconName: "More" },
          ariaLabel: strings.MoreActions,
          subMenuProps: { items: actions },
        });
      }
    }
    return items;
  };

  const getViewColumns = (columns: IFileViewColumn[]): IColumn[] => {
    const sort = getSortState();
    return columns.map((c) => {
      const columnDefinition: IColumn = {
        key: c.name,
        name: c.displayName,
        fieldName: c.name,
        minWidth: c.visualSizeFactor ?? 0,
        maxWidth: 0,
        isResizable: true,
        isRowHeader: true,
        isSorted: searchAcrossFolders ? sort?.column === c.name : c.isSorted,
        isSortedDescending: searchAcrossFolders ? sort?.descending : c.isSortedDescending,
        sortAscendingAriaLabel: c.sortAscendingLabel ?? strings.SortedAscending,
        sortDescendingAriaLabel: c.sortDescendingLabel ?? strings.SortedDescending,

        onColumnClick: onColumnClick,
        onRender: (item, index, column) =>
          renderCell(item, column, c.isPrimary, c.renderIcon),
      };

      return columnDefinition;
    });
  };

  const renderFolderExplorer = () =>
    controlState.rootFolder &&
    !props.hideFoldersPane &&
    (!controlState.narrow || controlState.foldersPanelOpen) && (
      <FolderExplorer
        rootItem={controlState.rootFolder}
        hideSearchBox={props.hideFoldersSearchBox}
        strings={strings}
      ></FolderExplorer>
    );

  const previewItem =
    controlState.selectedItems.length === 1 ? controlState.selectedItems[0] : undefined;

  const renderContent = () => {
    if (searchAcrossFolders && controlState.searching) {
      return (
        <div className="emptyFolderMessage">
          <Spinner size={SpinnerSize.small} label={strings.Searching} labelPosition="right" />
        </div>
      );
    }
    if (displayedItems.length === 0) {
      return (
        <div className="emptyFolderMessage">
          {controlState.searchError
            ? formatString(strings.SearchFailed, controlState.searchError)
            : controlState.searchText.trim()
            ? strings.NoSearchResults
            : controlState.rootFolder
            ? strings.FolderEmpty
            : strings.NoDocumentLocation}
        </div>
      );
    }
    return (
      <div className="fileViewContent">
        <MarqueeSelection selection={selection}>
          {controlState.viewType !== ViewType.Tiles ? (
            <DetailsList
              items={displayedItems}
              compact={controlState.viewType === ViewType.Compact}
              columns={getViewColumns(props.columns)}
              setKey="key"
              selection={selection}
              onItemContextMenu={(item, _index, ev) => {
                if (item && ev) {
                  ev.preventDefault?.();
                  showItemContextMenu(item, ev);
                }
                return false;
              }}
            />
          ) : (
            <TilesView
              items={displayedItems}
              tileSize={controlState.tileSize}
              openFileItem={openFileItem}
              selection={selection}
              getThumbnailUrl={
                props.showThumbnails ? (item) => getThumbnailUrl(item, "medium") : undefined
              }
              onItemContextMenu={showItemContextMenu}
              strings={strings}
            ></TilesView>
          )}
        </MarqueeSelection>
      </div>
    );
  };

  return (
    <div
      className={`spFileExplorer${controlState.narrow ? " narrow" : ""}`}
      ref={rootRef}
    >
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
        {controlState.narrow ? (
          controlState.foldersPanelOpen && (
            <div className="foldersOverlay">{renderFolderExplorer()}</div>
          )
        ) : (
          renderFolderExplorer()
        )}

        <div
          className="filesViewPanel"
          ref={filesPanelRef}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <CommandBar
            className="explorerCommandBar"
            items={getCommandBarItems()}
            farItems={getViewTypeCommandBarItems()}
            ariaLabel={strings.FileActions}
          />
          <div className="uploadMessages">{renderMessages()}</div>
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
                {searchAcrossFolders ? (
                  <div className="searchResultsTitle">
                    {formatString(strings.SearchResults, controlState.searchText.trim())}
                  </div>
                ) : (
                  controlState.rootFolder && (
                    <div className="breadcrumbRow">
                      <Breadcrumb
                        items={buildBreadcrums(controlState.rootFolder)}
                      ></Breadcrumb>
                      {controlState.showingCachedContent && props.isLoading && (
                        <Spinner
                          className="refreshingIndicator"
                          size={SpinnerSize.xSmall}
                          title={strings.Refreshing}
                          ariaLabel={strings.Refreshing}
                        />
                      )}
                    </div>
                  )
                )}
                {renderContent()}
                {controlState.contextualMenuProps && (
                  <ContextualMenu {...controlState.contextualMenuProps} />
                )}
              </>
            ) : (
              <div className="selectFolderMessage">{strings.SelectFolder}</div>
            )}
          </div>
        </div>
        {/* On narrow screens the preview covers the files, so it is shown only for a selected item. */}
        {controlState.previewOpen && (!controlState.narrow || previewItem) && (
          <div className={controlState.narrow ? "previewOverlay" : "previewPanel"}>
            <PreviewPane
              item={previewItem}
              imageUrl={previewItem ? getThumbnailUrl(previewItem, "large") : undefined}
              fullPreviewUrl={previewItem ? getFullPreviewUrl(previewItem) : undefined}
              actions={previewItem ? getItemActions(previewItem) : []}
              strings={strings}
              onClose={togglePreview}
            />
          </div>
        )}
      </FolderExplorerContext.Provider>
    </div>
  );
};

export default FullFileExplorer;
