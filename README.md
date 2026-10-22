# SharePoint Full File Explorer PCF Control

The control enables seamless browsing of SharePoint documents in a manner similar to Windows Explorer. The user-friendly interface displays the entire folder hierarchy, offering the ability to quickly locate specific folders by name. This feature ensures swift access to the required files, enhancing overall efficiency.
The control ensures that users have access to all the features available in the standard views, including sorting, keyword filtering, the ability to add new documents, and more.

![SharePoint Full File Explorer interface](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/screenshot1.png)

## Key Features

- Folder tree view with folder search by name.
- Comprehensive access to all features available in standard views, including sorting, keyword filtering, seamless integration with the standard command bar, and more.
- Three view types: tile view, list view, and compact list view. The default view can be configured, and the view selected by a user is remembered in the browser.

## Prerequisites

The control works on top of the standard SharePoint integration of Dataverse (Dynamics 365) and shows the records of the **SharePoint Document** (`sharepointdocument`) table. It does not connect to SharePoint by itself, so before you install it:

1. [Set up SharePoint integration](https://learn.microsoft.com/en-us/power-platform/admin/set-up-dynamics-365-online-to-use-sharepoint-online) for your environment.
2. [Enable document management](https://learn.microsoft.com/en-us/power-platform/admin/enable-sharepoint-document-management-specific-entities) for every table on which you want to use the control.
3. Make sure that the standard **Documents** tab of a record shows the files. If it does not, the control will not show them either.

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

**Default view** and **Remember selected view** are available from control version 0.0.3 (see the [changelog](/CHANGELOG.md)).

The control reuses the columns, sorting and filters of the view it is applied to.

## Troubleshooting

**Folders are not shown, all files of all subfolders are listed together.**
The control shows whatever the view returns. If the view filter contains the condition **Is Recursive Fetch** equals **Yes**, files of all subfolders are returned as a flat list and folders are not returned. Edit the view used by the control and remove this condition (or set it to **No**).

**The standard grid is still shown instead of the control.**
Check that the control is selected for all client types (Web, Phone and Tablet) in the **Custom Controls** dialog and that the view or the form was published. On a form, add the control to the documents subgrid itself (see the [installation guide](/installation-guide.md#set-sharepoint-full-file-explorer-for-an-associated-grid)).

**The control is rendered too small on a form tab.**
Increase the **Minimum Height** property of the control.

**"There are no documents to show" is displayed.**
No active SharePoint document location was found for the record. Check that document management is enabled for the table and open the standard **Documents** tab once, so that the document location and the SharePoint folder are created.

## Known limitations

- If a record has several active document locations, the folder tree is built for only one of them, and it is not rebuilt when another location is selected in the grid.
- Document locations whose parent is another document location (subfolder locations) may show an empty folder ([#5](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/5)).
- The control loads up to 5,000 documents of the current folder and requests the folder tree with one query per folder, so very large folder hierarchies take longer to load.
- Uploading files by drag and drop is not supported yet ([#7](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/7)).

## Build from source

You need [Node.js](https://nodejs.org/) (LTS) and, for packaging, the [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction).

```bash
npm install        # install dependencies
npm run build      # build the control into out/controls
npm start          # run the control with mock data in the local test harness
```

To create a solution package from the sources:

```bash
mkdir SPFileExplorerSolution && cd SPFileExplorerSolution
pac solution init --publisher-name <publisher> --publisher-prefix <prefix>
pac solution add-reference --path ..
dotnet build -c Release   # bin/Release/SPFileExplorerSolution.zip
```

Increase the `version` of the control in `SPFileExplorer/ControlManifest.Input.xml` before you build a package for an environment where the control is already installed, otherwise the changes are not applied on import.

See the [changelog](/CHANGELOG.md) for the changes that are not yet included in the packaged solution.

## License

The control is distributed under the [MIT License](/LICENSE).
