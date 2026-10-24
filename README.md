# SharePoint Full File Explorer PCF Control

The control enables seamless browsing of SharePoint documents in a manner similar to Windows Explorer. The user-friendly interface displays the entire folder hierarchy, offering the ability to quickly locate specific folders by name. This feature ensures swift access to the required files, enhancing overall efficiency.
The control ensures that users have access to all the features available in the standard views, including sorting, keyword filtering, the ability to add new documents, and more.

![SharePoint Full File Explorer interface](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/screenshot1.png)

## Key Features

- Folder tree view with folder search by name.
- Comprehensive access to all features available in standard views, including sorting, keyword filtering, seamless integration with the standard command bar, and more.
- Three view types: tile view, list view, and compact list view. The default view can be configured, and the view selected by a user is remembered in the browser.
- Search for files in the current folder or in all folders of the record.
- Fast folder navigation: folders opened before are shown immediately and refreshed in the background.
- File actions (open in the browser or in the desktop app, download, copy link, open in SharePoint) from the context menu, the command bar and the preview pane.
- Preview pane with a preview image, the details and the actions of the selected file, and optional thumbnails in the tile view.
- Sort menu and small or large tiles in the tile view.
- Layout for phones and narrow forms.
- New folders, file thumbnails and full previews with Microsoft Graph (optional, see [Microsoft Graph](#microsoft-graph-new-folders-thumbnails-and-full-previews)).
- Upload of files to the current folder by drag and drop (experimental, has to be enabled).
- User interface in 14 languages.

## Prerequisites

The control works on top of the standard SharePoint integration of Dataverse (Dynamics 365) and shows the records of the **SharePoint Document** (`sharepointdocument`) table. It does not connect to SharePoint by itself, so before you install it:

1. [Set up SharePoint integration](https://learn.microsoft.com/en-us/power-platform/admin/set-up-dynamics-365-online-to-use-sharepoint-online) for your environment.
2. [Enable document management](https://learn.microsoft.com/en-us/power-platform/admin/enable-sharepoint-document-management-specific-entities) for every table on which you want to use the control.
3. Make sure that the standard **Documents** tab of a record shows the files. If it does not, the control will not show them either.

From version 0.0.4 the control is a React control that uses the React and Fluent UI libraries provided by Power Apps. It is supported in model-driven apps; Power Pages does not support React controls.

## How to install the control

To install the control you can follow the steps described [here](/installation-guide.md "Installation Guide").

## Configuration

The following properties can be set when the control is added to a view or to a documents subgrid:

| Property | Default | Description |
| --- | --- | --- |
| **Minimum Height** | `350` | Minimum height of the control in pixels. Increase it if the control is rendered too small on a form tab. |
| **Hide folder tree** | `No` | Hides the folder navigation pane on the left side. |
| **Default view** | `Tile view` | View type (tile, list or compact list) that is shown when the control is opened. |
| **Remember selected view** | `Yes` | Remembers the view type selected by a user in the browser and reuses it for other records. Set it to `No` to always open the **Default view**. |
| **Enable drag and drop upload (experimental)** | `No` | Allows users to upload files to the current folder by dragging them onto the control. Works on the documents of a record (documents subgrid or related **Documents** tab). See [Drag and drop upload](#drag-and-drop-upload). |
| **Show thumbnails** | `No` | Shows preview images of images, PDF and Office files on the tiles instead of file icons. See [Thumbnails and previews](#thumbnails-and-previews). |
| **Microsoft Graph client ID** | *(empty)* | Application (client) ID of a Microsoft Entra app registration. Enables new folders, Microsoft Graph thumbnails and full previews. See [Microsoft Graph](#microsoft-graph-new-folders-thumbnails-and-full-previews). |
| **Microsoft Graph tenant ID** | *(empty)* | Directory (tenant) ID of the app registration. Optional; by default users sign in to their own organization. |

**Default view** and **Remember selected view** are available from control version 0.0.3, **Enable drag and drop upload** from 0.0.4, **Show thumbnails** and the Microsoft Graph properties from 0.0.5 (see the [changelog](/CHANGELOG.md)).

The control reuses the columns, sorting and filters of the view it is applied to.

## Working with files

- **Search**: the search box above the files filters the current folder by name. Select **All folders** to search the file names in all folders of the record's documents; the results show the folder of each file, and **Open containing folder** opens it. Searching all folders is available for the documents of a record (documents subgrid or related **Documents** tab).
- **File actions**: right-click a file or folder, use **More actions** (…) in the command bar when one item is selected, or use the buttons of the preview pane: **Open**, **Open in browser**, **Open in desktop app** (Word, Excel, PowerPoint, Visio and Project files), **Download**, **Copy link** and, for folders, **Open in SharePoint**. **Open in SharePoint** in the command bar opens the current folder.
- **Preview pane**: the **Preview** button on the right side of the command bar shows the preview image, the details (columns of the view) and the actions of the selected file. The pane stays open for other records until it is closed.
- **Sort and tile size**: the **Sort** menu sorts by the columns of the view in all view types, including the tile view. The view menu switches between small and large tiles.
- **Phones and narrow forms**: when the control is narrower than 640 pixels, the folder tree opens from the **Folders** button and the preview pane covers the files.
- **Folder navigation**: the content of folders opened before is shown immediately while it is loaded again; a small spinner next to the breadcrumb shows that the content is being refreshed.

### Thumbnails and previews

The preview images are rendered by SharePoint for images, PDF and Office files. They are loaded by the browser directly from SharePoint, with the user's SharePoint session. If the browser blocks third-party cookies, or if the user has not signed in to SharePoint yet, the file icon is shown instead. With [Microsoft Graph](#microsoft-graph-new-folders-thumbnails-and-full-previews) configured, the control uses the thumbnails returned by Microsoft Graph, which do not depend on the SharePoint session, and **Show full preview** in the preview pane shows the document itself.

### Microsoft Graph (new folders, thumbnails and full previews)

Creating folders, Microsoft Graph thumbnails and full previews call [Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/resources/onedrive) on behalf of the signed-in user. Users can only access files they have access to in SharePoint. To enable these features:

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), go to **App registrations** → **New registration**. Enter a name (for example *SharePoint Full File Explorer*), keep **Accounts in this organizational directory only** and click **Register**.
2. In **Authentication**, click **Add a platform** → **Single-page application** and add the redirect URI of each environment that uses the control:
   `https://<your environment>.crm.dynamics.com/WebResources/dotact_/spfileexplorer/authredirect.html`
   (use the URL of the environment as shown in the browser, e.g. `https://contoso.crm4.dynamics.com/...`). The page is installed with the solution.
3. In **API permissions**, click **Add a permission** → **Microsoft Graph** → **Delegated permissions**, select **Files.ReadWrite.All** and click **Add permissions**. If users are not allowed to consent to applications in your organization, click **Grant admin consent**.
4. Copy the **Application (client) ID** and the **Directory (tenant) ID** from **Overview** into the **Microsoft Graph client ID** and **Microsoft Graph tenant ID** properties of the control.

The control signs the user in silently with the Microsoft 365 account of the Dataverse user. If that is not possible (for example, consent is missing), the preview pane shows **Sign in to Microsoft 365**, which opens a sign-in popup. Creating a folder opens the popup when needed.

The control declares `graph.microsoft.com` and `login.microsoftonline.com` as external services, so Power Apps classifies it as a premium component. Model-driven apps already require a premium license, so this has no effect on users of model-driven apps. If [content security policy](https://learn.microsoft.com/en-us/power-platform/admin/content-security-policy) is enforced for model-driven apps in your environment, allow `https://graph.microsoft.com` and `https://login.microsoftonline.com` in `connect-src` and `frame-src`, and the SharePoint and OneDrive domains of your organization in `frame-src` and `img-src`.

### Drag and drop upload

When **Enable drag and drop upload (experimental)** is set, files dropped onto the file list are uploaded to the folder that is currently open, and the folder content is refreshed afterwards. Files that cannot be uploaded (for example, because a file with the same name already exists) are listed with the message returned by Dataverse. Folders cannot be uploaded.

The upload uses the `UploadDocument` action of Dataverse, which the standard **Documents** grid uses for its **Upload** command. The action is not publicly documented, so it may change without notice. Test the upload in your environment before enabling it for users, and disable the property if it stops working.

### Languages

The user interface and the property names are available in English, Czech, Danish, Dutch, Finnish, French, German, Italian, Norwegian (Bokmål), Polish, Portuguese (Brazil), Spanish, Swedish and Ukrainian; other languages fall back to English. Corrections from native speakers are welcome. To add a language, copy `SPFileExplorer/strings/SPFileExplorer.1033.resx` to `SPFileExplorer.<LCID>.resx`, translate the values and add the file to the `resources` element of `SPFileExplorer/ControlManifest.Input.xml`.

## Troubleshooting

**Folders are not shown, all files of all subfolders are listed together.**
The control shows whatever the view returns. If the view filter contains the condition **Is Recursive Fetch** equals **Yes**, files of all subfolders are returned as a flat list and folders are not returned. Edit the view used by the control and remove this condition (or set it to **No**).

**The standard grid is still shown instead of the control.**
Check that the control is selected for all client types (Web, Phone and Tablet) in the **Custom Controls** dialog and that the view or the form was published. On a form, add the control to the documents subgrid itself (see the [installation guide](/installation-guide.md#set-sharepoint-full-file-explorer-for-an-associated-grid)).

**The control is rendered too small on a form tab.**
Increase the **Minimum Height** property of the control.

**"There are no documents to show" is displayed.**
No active SharePoint document location was found for the record. Check that document management is enabled for the table and open the standard **Documents** tab once, so that the document location and the SharePoint folder are created.

**Thumbnails or preview images are not shown.**
SharePoint preview images need the user's SharePoint session and third-party cookies (see [Thumbnails and previews](#thumbnails-and-previews)). Open SharePoint once in the same browser, or configure [Microsoft Graph](#microsoft-graph-new-folders-thumbnails-and-full-previews). Thumbnails are available for images, PDF and Office files.

**The sign-in popup shows "AADSTS50011" (redirect URI mismatch).**
The redirect URI of the environment is missing in the app registration. Add `https://<your environment>/WebResources/dotact_/spfileexplorer/authredirect.html` as a **Single-page application** redirect URI (see [Microsoft Graph](#microsoft-graph-new-folders-thumbnails-and-full-previews)).

**The sign-in popup does not open.**
Allow popups for the Dataverse environment in the browser, then click **Sign in to Microsoft 365** or **New folder** again.

**New folder is not shown.**
The command is shown when the **Microsoft Graph client ID** property is set and the SharePoint URL of the document location is known; it is not available while searching all folders.

**Files cannot be dropped onto the control.**
Check that **Enable drag and drop upload (experimental)** is set and that the control shows the documents of a record; in a table view of all documents there is no record to upload the files to.

## Known limitations

- The folder tree is built for the document location of the shown documents. When a record has several document locations and the selected location contains no documents, the tree of the oldest location is shown.
- The control loads up to 5,000 documents of the current folder. The folder tree is requested with one query per folder when it is loaded and refreshed at most once per minute, so very large folder hierarchies take longer to load.
- Drag and drop upload is experimental (see [Drag and drop upload](#drag-and-drop-upload)) and does not upload folders.
- **All folders** search compares file names only (not the content), loads up to 5,000 documents of the record and shows up to 500 results.
- Folders opened before are shown from the browser memory until their content is reloaded, which usually takes less than a second.

## Build from source

You need [Node.js](https://nodejs.org/) 22 and, to create the solution package, the [.NET SDK](https://dotnet.microsoft.com/download) 8.

```bash
npm ci             # install dependencies
npm run build      # build the control into out/controls
npm start          # build and run the control with mock data in the local test harness
                   # (the harness, pcf-start, is downloaded on first use)

# build the managed solution into Solution/SPFileExplorerSolution/bin/Release
dotnet build Solution/SPFileExplorerSolution --configuration Release
```

In the local test harness, set **Microsoft Graph client ID** to any value to try new folders, thumbnails and previews with mock data.

The sign-in redirect page (`Solution/SPFileExplorerSolution/src/WebResources/dotact_/spfileexplorer/authredirect.html`) is generated from the installed `@azure/msal-browser` package. Generate it again after updating the package:

```bash
node scripts/auth-bridge/build.mjs
```

## Release process

The packaged solution (`Solution/SPFullFileExplorer.zip`) is built and updated automatically by the [Build solution](/.github/workflows/build-solution.yml) GitHub Actions workflow:

1. Increase the `version` of the control in `SPFileExplorer/ControlManifest.Input.xml` (e.g. `0.0.3` → `0.0.4`) and add the changes to the [changelog](/CHANGELOG.md). Dataverse applies an updated control only if its version is higher than the installed one.
2. Merge the changes into `master`.
3. The workflow builds the managed solution and commits the updated `Solution/SPFullFileExplorer.zip` to `master`.

The solution version is derived from the control version: `<major>.<minor>` from `Solution/SPFileExplorerSolution/src/Other/Solution.xml`, followed by `<control major × 100 + control minor>.<control patch>` (e.g. control `0.0.4` → solution `1.1.0.4`).

If the control version was not increased, the package is built but not committed. A lower control version than the packaged one fails the build. Every push to any branch and every pull request is linted and built as well, and the resulting package can be downloaded from the workflow run artifacts for testing.

The workflow commits with the `GITHUB_TOKEN`. If the commit is rejected, allow GitHub Actions to write to the repository (**Settings** → **Actions** → **General** → **Workflow permissions**) and make sure `master` is not protected against pushes from GitHub Actions.

## License

The control is distributed under the [MIT License](/LICENSE).
