/**
 * Texts of the control in English. They are used when a text is not found in the
 * resource file of the user's language (strings/SPFileExplorer.<LCID>.resx).
 */
export const DEFAULT_STRINGS = {
  ListView: "List view",
  CompactView: "Compact view",
  TileView: "Tile view",
  ListViewTitle: "View items and details in a list",
  CompactViewTitle: "View items and details in a compact list",
  TileViewTitle: "View items with tile previews",
  ViewOptionsTitle: "Open the view options menu",
  ViewOptionAriaLabel: "View options. {0}.",
  ViewOptionSelectedAriaLabel: "View options. {0} selected.",
  SortAscending: "Sort A to Z",
  SortDescending: "Sort Z to A",
  SortedAscending: "Sorted A to Z",
  SortedDescending: "Sorted Z to A",
  Loading: "Loading...",
  FileActions: "File actions",
  FolderEmpty: "This folder is empty",
  NoDocumentLocation:
    "There are no documents to show. Please, check that document management is enabled for this table and that a document location exists for this record.",
  SelectFolder: "Please, select a folder to explore its content.",
  FilterFolders: "Filter folder by name",
  FolderSearchNoResults: "Your search returned no results.",
  NoFolders: "There are no folders to show.",
  CheckedOut: "Checked out",
  Shared: "Shared",
  DropFilesHere: "Drop files here to upload them to {0}",
  Uploading: "Uploading {0} of {1}...",
  UploadCompleted: "Upload completed.",
  UploadFailed: "{0} could not be uploaded: {1}",
  FoldersNotUploaded: "Folders cannot be uploaded: {0}",
  Close: "Close",
  SearchFiles: "Search files",
  SearchAllFolders: "All folders",
  SearchAllFoldersTitle: "Search in all folders",
  SearchResults: "Search results for \"{0}\"",
  NoSearchResults: "No files match your search.",
  Searching: "Searching...",
  SearchFailed: "The search failed: {0}",
  Sort: "Sort",
  Ascending: "Ascending",
  Descending: "Descending",
  TileSize: "Tile size",
  SmallTiles: "Small tiles",
  LargeTiles: "Large tiles",
  Folders: "Folders",
  Preview: "Preview",
  PreviewTitle: "Show or hide the preview pane",
  NoPreview: "No preview available",
  SelectFileToPreview: "Select a file to see its preview.",
  ShowFullPreview: "Show full preview",
  SignIn: "Sign in to Microsoft 365",
  SignInHint: "Sign in to Microsoft 365 to show previews and create folders.",
  Open: "Open",
  OpenInBrowser: "Open in browser",
  OpenInApp: "Open in desktop app",
  Download: "Download",
  CopyLink: "Copy link",
  LinkCopied: "The link has been copied.",
  OpenInSharePoint: "Open in SharePoint",
  OpenContainingFolder: "Open containing folder",
  MoreActions: "More actions",
  NewFolder: "New folder",
  NewFolderTitle: "Create a folder in {0}",
  FolderName: "Folder name",
  Create: "Create",
  Cancel: "Cancel",
  InvalidFolderName: "Enter a name without the characters \" * : < > ? / \\ |.",
  FolderCreated: "The folder {0} has been created.",
  FolderCreateFailed: "The folder could not be created: {0}",
  Details: "Details",
  Refreshing: "Refreshing...",
};

export type IStrings = typeof DEFAULT_STRINGS;

/**
 * Reads the texts of the control from the resource file of the user's language.
 * @param getString Function that returns the text with the specified key (context.resources.getString).
 */
export const getStrings = (getString?: (key: string) => string): IStrings => {
  const strings = { ...DEFAULT_STRINGS };
  if (getString) {
    (Object.keys(strings) as (keyof IStrings)[]).forEach((key) => {
      const value = getString(key);
      // A missing text is returned as an empty string or as its key.
      if (value && value !== key) {
        strings[key] = value;
      }
    });
  }
  return strings;
};

/**
 * Replaces the {0}, {1}, ... placeholders of a text with the specified values.
 */
export const formatString = (text: string, ...values: string[]): string =>
  text.replace(/\{(\d+)\}/g, (match, index) => values[+index] ?? match);
