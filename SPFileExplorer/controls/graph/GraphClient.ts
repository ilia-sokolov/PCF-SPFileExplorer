import { getGraphShareId } from "../FileLinks";

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

/**
 * Error thrown when a Microsoft Graph token cannot be acquired without user interaction.
 */
export class SignInRequiredError extends Error {
  constructor() {
    super("Sign-in to Microsoft 365 is required.");
    this.name = "SignInRequiredError";
  }
}

/**
 * Returns an access token for Microsoft Graph.
 * @param interactive Indicates if the user may be asked to sign in (only from a user action).
 */
export type TokenProvider = (interactive: boolean) => Promise<string>;

/**
 * Thumbnails of a file returned by Microsoft Graph.
 */
export interface IThumbnailUrls {
  small?: string;
  medium?: string;
  large?: string;
}

interface IDriveItemReference {
  driveId: string;
  itemId: string;
}

/**
 * Microsoft Graph operations of the control. SharePoint files and folders are addressed by their URLs.
 */
export interface IGraphClient {
  /**
   * Asks the user to sign in to Microsoft 365 (call only from a user action).
   */
  signIn(): Promise<void>;
  /**
   * Creates a folder in the folder with the specified URL.
   */
  createFolder(parentFolderUrl: string, name: string): Promise<void>;
  /**
   * Returns the thumbnails of the files of a folder, by lower case file name.
   */
  getThumbnails(folderUrl: string): Promise<Map<string, IThumbnailUrls>>;
  /**
   * Returns an URL that shows a preview of the file and can be embedded in an iframe.
   */
  getPreviewUrl(fileUrl: string, interactive: boolean): Promise<string | undefined>;
}

/**
 * Microsoft Graph client that resolves SharePoint URLs with the shares API.
 */
export class GraphClient implements IGraphClient {
  private readonly _items = new Map<string, Promise<IDriveItemReference>>();

  constructor(
    private readonly _getToken: TokenProvider,
    private readonly _fetch: typeof fetch = (input, init) => fetch(input, init)
  ) {}

  public async signIn(): Promise<void> {
    await this._getToken(true);
  }

  public async createFolder(parentFolderUrl: string, name: string): Promise<void> {
    const parent = await this._resolve(parentFolderUrl, true);
    await this._request(
      "POST",
      `/drives/${parent.driveId}/items/${parent.itemId}/children`,
      true,
      {
        name: name.trim(),
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      }
    );
  }

  public async getThumbnails(folderUrl: string): Promise<Map<string, IThumbnailUrls>> {
    const folder = await this._resolve(folderUrl, false);
    const thumbnails = new Map<string, IThumbnailUrls>();
    let path: string | undefined =
      `/drives/${folder.driveId}/items/${folder.itemId}/children` +
      "?$select=id,name,file&$expand=thumbnails&$top=200";
    while (path) {
      const page: {
        value?: { name: string; file?: unknown; thumbnails?: IThumbnailUrlSets[] }[];
        "@odata.nextLink"?: string;
      } = await this._request("GET", path, false);
      (page.value ?? []).forEach((item) => {
        const set = item.file ? item.thumbnails?.[0] : undefined;
        if (set) {
          thumbnails.set(item.name.toLowerCase(), {
            small: set.small?.url,
            medium: set.medium?.url,
            large: set.large?.url,
          });
        }
      });
      const nextLink: string | undefined = page["@odata.nextLink"];
      path = nextLink ? nextLink.substring(GRAPH_URL.length) : undefined;
    }
    return thumbnails;
  }

  public async getPreviewUrl(
    fileUrl: string,
    interactive: boolean
  ): Promise<string | undefined> {
    const file = await this._resolve(fileUrl, interactive);
    const preview = await this._request(
      "POST",
      `/drives/${file.driveId}/items/${file.itemId}/preview`,
      interactive,
      {}
    );
    return preview.getUrl;
  }

  private _resolve(url: string, interactive: boolean): Promise<IDriveItemReference> {
    let item = this._items.get(url);
    if (!item) {
      item = this._request(
        "GET",
        `/shares/${getGraphShareId(url)}/driveItem?$select=id,parentReference`,
        interactive
      ).then((driveItem) => ({
        driveId: driveItem.parentReference.driveId,
        itemId: driveItem.id,
      }));
      // A failed lookup is not cached, so that it can be retried (e.g. after sign-in).
      item.catch(() => this._items.delete(url));
      this._items.set(url, item);
    }
    return item;
  }

  private async _request(
    method: string,
    path: string,
    interactive: boolean,
    body?: unknown
  ) {
    const token = await this._getToken(interactive);
    const response = await this._fetch(`${GRAPH_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new GraphError(
        response.status,
        error?.error?.code,
        error?.error?.message ?? `${response.status} ${response.statusText}`
      );
    }
    return response.status === 204 ? {} : response.json();
  }
}

interface IThumbnailUrlSets {
  small?: { url?: string };
  medium?: { url?: string };
  large?: { url?: string };
}

/**
 * Error returned by Microsoft Graph.
 */
export class GraphError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string
  ) {
    super(message);
    this.name = "GraphError";
  }
}
