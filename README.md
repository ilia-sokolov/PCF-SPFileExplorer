# SharePoint Full File Explorer PCF Control

The control enables seamless browsing of SharePoint documents in a manner similar to Windows Explorer. The user-friendly interface displays the entire folder hierarchy, offering the ability to quickly locate specific folders by name. This feature ensures swift access to the required files, enhancing overall efficiency.
The control ensures that users have access to all the features available in the standard views, including sorting, keyword filtering, the ability to add new documents, and more.

![SharePoint Full File Explorer interface](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/screenshot1.png)

## Key Features

- Folder tree view with folder search by name.
- Comprehensive access to all features available in standard views, including sorting, keyword filtering, seamless integration with the standard command bar, and more.
- Three view types: tile view, list view, and compact list view. The default view can be configured, and the view selected by a user is remembered in the browser.
- Upload of files to the current folder by drag and drop (experimental, has to be enabled).
- English and German user interface.

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

**Default view** and **Remember selected view** are available from control version 0.0.3, **Enable drag and drop upload** from 0.0.4 (see the [changelog](/CHANGELOG.md)).

The control reuses the columns, sorting and filters of the view it is applied to.

### Drag and drop upload

When **Enable drag and drop upload (experimental)** is set, files dropped onto the file list are uploaded to the folder that is currently open, and the folder content is refreshed afterwards. Files that cannot be uploaded (for example, because a file with the same name already exists) are listed with the message returned by Dataverse. Folders cannot be uploaded.

The upload uses the `UploadDocument` action of Dataverse, which the standard **Documents** grid uses for its **Upload** command. The action is not publicly documented, so it may change without notice. Test the upload in your environment before enabling it for users, and disable the property if it stops working.

### Languages

The user interface and the property names are available in English and German; other languages fall back to English. To add a language, copy `SPFileExplorer/strings/SPFileExplorer.1033.resx` to `SPFileExplorer.<LCID>.resx`, translate the values and add the file to the `resources` element of `SPFileExplorer/ControlManifest.Input.xml`.

## Troubleshooting

**Folders are not shown, all files of all subfolders are listed together.**
The control shows whatever the view returns. If the view filter contains the condition **Is Recursive Fetch** equals **Yes**, files of all subfolders are returned as a flat list and folders are not returned. Edit the view used by the control and remove this condition (or set it to **No**).

**The standard grid is still shown instead of the control.**
Check that the control is selected for all client types (Web, Phone and Tablet) in the **Custom Controls** dialog and that the view or the form was published. On a form, add the control to the documents subgrid itself (see the [installation guide](/installation-guide.md#set-sharepoint-full-file-explorer-for-an-associated-grid)).

**The control is rendered too small on a form tab.**
Increase the **Minimum Height** property of the control.

**"There are no documents to show" is displayed.**
No active SharePoint document location was found for the record. Check that document management is enabled for the table and open the standard **Documents** tab once, so that the document location and the SharePoint folder are created.

**Files cannot be dropped onto the control.**
Check that **Enable drag and drop upload (experimental)** is set and that the control shows the documents of a record; in a table view of all documents there is no record to upload the files to.

## Known limitations

- The folder tree is built for the document location of the shown documents. When a record has several document locations and the selected location contains no documents, the tree of the oldest location is shown.
- The control loads up to 5,000 documents of the current folder. The folder tree is requested with one query per folder when it is loaded and refreshed at most once per minute, so very large folder hierarchies take longer to load.
- Drag and drop upload is experimental (see [Drag and drop upload](#drag-and-drop-upload)) and does not upload folders.

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
