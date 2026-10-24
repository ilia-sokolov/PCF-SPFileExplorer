/**
 * SharePoint URLs of the document location shown by the control.
 */
export interface ILocationUrls {
  /**
   * Absolute URL of the folder of the document location.
   */
  locationUrl: string;
  /**
   * URL of the SharePoint site (collection) of the document location.
   */
  siteUrl: string;
  /**
   * Path of the document location relative to its document library (path of the root folder).
   */
  rootPath: string;
}

const OFFICE_DESKTOP_SCHEMES: { [extension: string]: string } = {
  doc: "ms-word",
  docx: "ms-word",
  docm: "ms-word",
  dot: "ms-word",
  dotx: "ms-word",
  rtf: "ms-word",
  xls: "ms-excel",
  xlsx: "ms-excel",
  xlsm: "ms-excel",
  xlsb: "ms-excel",
  csv: "ms-excel",
  ppt: "ms-powerpoint",
  pptx: "ms-powerpoint",
  pptm: "ms-powerpoint",
  pps: "ms-powerpoint",
  ppsx: "ms-powerpoint",
  vsd: "ms-visio",
  vsdx: "ms-visio",
  mpp: "ms-project",
};

const PREVIEW_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "tif",
  "tiff",
  "heic",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "rtf",
  "txt",
  "vsdx",
  "mp4",
];

const encodePath = (path: string): string =>
  path
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const trimSlashes = (value: string): string => value.replace(/\/+$/, "");

/**
 * Returns the URL of the SharePoint site of an URL ("/sites/x" or "/teams/x", otherwise the root site).
 */
export const getSiteUrl = (url: string): string => {
  const match = /^(https?:\/\/[^/]+)(\/(?:sites|teams|personal)\/[^/]+)?/i.exec(url);
  return match ? `${match[1]}${match[2] ?? ""}` : url;
};

/**
 * Returns the path of a folder relative to the document location, e.g. "A/B" for "Contoso_1/A/B".
 */
export const getPathBelowRoot = (rootPath: string, folderPath: string): string => {
  if (!folderPath || folderPath === rootPath) {
    return "";
  }
  return folderPath.startsWith(`${rootPath}/`)
    ? folderPath.substring(rootPath.length + 1)
    : folderPath;
};

/**
 * Returns the absolute URL of a folder of the document location.
 */
export const getFolderUrl = (urls: ILocationUrls, folderPath: string): string => {
  const subPath = getPathBelowRoot(urls.rootPath, folderPath);
  return subPath
    ? `${trimSlashes(urls.locationUrl)}/${encodePath(subPath)}`
    : trimSlashes(urls.locationUrl);
};

/**
 * Returns the absolute URL of a file or folder.
 * @param absoluteUrl Absolute URL returned by Dataverse for the item, if any.
 * @param name File name.
 * @param folderPath Path of the folder that contains the item.
 */
export const getItemUrl = (
  urls: ILocationUrls,
  absoluteUrl: string | undefined,
  name: string,
  folderPath: string
): string =>
  absoluteUrl && /^https?:\/\//i.test(absoluteUrl)
    ? absoluteUrl
    : `${getFolderUrl(urls, folderPath)}/${encodeURIComponent(name)}`;

/**
 * Returns the path of the folder that contains an item, based on its relative location.
 * The relative location of a file can either be the path of its folder or its own path.
 */
export const getContainingFolderPath = (
  relativeLocation: string,
  name: string
): string => {
  const location = trimSlashes(relativeLocation ?? "");
  if (location === name) {
    return "";
  }
  return location.endsWith(`/${name}`)
    ? location.substring(0, location.length - name.length - 1)
    : location;
};

const withQuery = (url: string, query: string): string =>
  `${url}${url.indexOf("?") >= 0 ? "&" : "?"}${query}`;

/**
 * URL that opens a file in the browser (Office for the web for Office documents).
 */
export const getBrowserUrl = (fileUrl: string): string => withQuery(fileUrl, "web=1");

/**
 * URL that downloads a file.
 */
export const getDownloadUrl = (fileUrl: string): string =>
  withQuery(fileUrl, "download=1");

/**
 * Office URI that opens a file in the desktop application, or undefined for other file types.
 */
export const getDesktopAppUrl = (
  fileUrl: string,
  extension: string | undefined
): string | undefined => {
  const scheme = OFFICE_DESKTOP_SCHEMES[(extension ?? "").toLowerCase()];
  return scheme ? `${scheme}:ofe|u|${fileUrl}` : undefined;
};

/**
 * Indicates if SharePoint can render a preview image of a file with the specified extension.
 */
export const canPreview = (extension: string | undefined): boolean =>
  PREVIEW_EXTENSIONS.indexOf((extension ?? "").toLowerCase()) >= 0;

/**
 * URL of the preview image rendered by SharePoint (requires the user to be signed in to SharePoint).
 * @param resolution 0 (smallest) to 6 (largest).
 */
export const getPreviewImageUrl = (
  siteUrl: string,
  fileUrl: string,
  resolution: number
): string =>
  `${trimSlashes(siteUrl)}/_layouts/15/getpreview.ashx?path=${encodeURIComponent(
    fileUrl
  )}&resolution=${resolution}`;

/**
 * Identifier of a sharing URL for the Microsoft Graph shares API ("u!" + base64url of the URL).
 */
export const getGraphShareId = (url: string): string => {
  const bytes = new TextEncoder().encode(url);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `u!${btoa(binary)
    .replace(/=+$/, "")
    .replace(/\//g, "_")
    .replace(/\+/g, "-")}`;
};

/**
 * Characters SharePoint does not allow in file and folder names.
 */
const INVALID_NAME_CHARACTERS = /["*:<>?/\\|]/;

/**
 * Validates the name of a new folder. Returns true if the name can be used.
 */
export const isValidFolderName = (name: string): boolean => {
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 250 &&
    !INVALID_NAME_CHARACTERS.test(trimmed) &&
    !trimmed.endsWith(".") &&
    !trimmed.startsWith("~") &&
    trimmed !== "." &&
    trimmed !== ".."
  );
};
