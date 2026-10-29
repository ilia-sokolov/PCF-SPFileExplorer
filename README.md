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
- Preview pane with a full-height preview of the selected file (Office documents with Office for the web, other files as a preview image) and its actions, and optional thumbnails in the tile view.
- Sort menu and small or large tiles in the tile view.
- Layout for phones and narrow forms.
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

**Default view** and **Remember selected view** are available from control version 0.0.3, **Enable drag and drop upload** from 0.0.4, **Show thumbnails** from 0.0.5 (see the [changelog](/CHANGELOG.md)).

The control reuses the columns, sorting and filters of the view it is applied to.

## Working with files

- **Search**: the search box above the files filters the current folder by name. Select **All folders** to search the file names in all folders of the record's documents; the results show the folder of each file, and **Open containing folder** opens it. Searching all folders is available for the documents of a record (documents subgrid or related **Documents** tab).
- **File actions**: right-click a file or folder, use **More actions** (…) in the command bar when one item is selected, or use the command bar at the bottom of the preview pane: **Open**, **Open in browser**, **Open in desktop app** (Word, Excel, PowerPoint, Visio and Project files), **Download**, **Copy link** and, for folders, **Open in SharePoint**. **Open in SharePoint** in the command bar opens the current folder.
- **Preview pane**: the **Preview** button on the right side of the command bar shows a preview of the selected file over the full height of the pane, with its actions in a command bar below. Word, Excel, PowerPoint and Visio files are shown as documents, other files as a preview image. The pane stays open for other records until it is closed.
- **Sort and tile size**: the **Sort** menu sorts by the columns of the view in all view types, including the tile view. The view menu switches between small and large tiles.
- **Phones and narrow forms**: when the control is narrower than 640 pixels, the folder tree opens from the **Folders** button and the preview pane covers the files.
- **Folder navigation**: the content of folders opened before is shown immediately while it is loaded again; a small spinner next to the breadcrumb shows that the content is being refreshed.

### Thumbnails and previews

The preview images are rendered by SharePoint for images, PDF and Office files (`_layouts/15/getpreview.ashx`). When a Word, Excel, PowerPoint or Visio file is selected, the preview pane shows it with Office for the web (`_layouts/15/WopiFrame.aspx`, embedded view); it can take a few seconds to appear. Both are loaded by the browser directly from SharePoint, with the user's SharePoint session, and the user only sees files they have access to in SharePoint. If the browser blocks third-party cookies, or if the user has not signed in to SharePoint yet, the file icon is shown instead and the full preview stays empty.

If [content security policy](https://learn.microsoft.com/en-us/power-platform/admin/content-security-policy) is enforced for model-driven apps in your environment, allow the SharePoint domain of your organization (for example `https://contoso.sharepoint.com`) in `img-src` and `frame-src`.

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

**Thumbnails, preview images or the full preview are not shown.**
They need the user's SharePoint session and third-party cookies (see [Thumbnails and previews](#thumbnails-and-previews)). Open SharePoint once in the same browser and check that the browser does not block third-party cookies for the SharePoint domain. Thumbnails are available for images, PDF and Office files, the full preview for Word, Excel, PowerPoint and Visio files.

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

The local test harness has no SharePoint, so it shows file icons instead of thumbnails, and the full preview cannot load.

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
