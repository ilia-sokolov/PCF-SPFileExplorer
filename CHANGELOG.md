# Changelog

## 0.0.5 (2026-10-29)

### Added

- **Search**: filter the current folder by name, or search the file names in all folders of the record (**All folders**). Search results show the folder of each file and can open it.
- **Fast folder navigation**: folders opened before are shown immediately and refreshed in the background.
- **File actions**: open in the browser or in the desktop app, download, copy link and open in SharePoint, from the context menu (right-click), the command bar (**More actions**) and the preview pane. **Open in SharePoint** in the command bar opens the current folder.
- **Preview pane** with a full-height preview of the selected file and its actions in a command bar below. Word, Excel, PowerPoint and Visio files are shown with Office for the web as soon as they are selected, other files as a preview image.
- **Show thumbnails** property: preview images rendered by SharePoint on the tiles.
- **Sort** menu for all view types, including the tile view, and small or large tiles.
- Layout for phones and narrow forms: the folder tree opens from the **Folders** button.
- Czech, Danish, Dutch, Finnish, French, Italian, Norwegian, Polish, Portuguese (Brazil), Spanish, Swedish and Ukrainian user interface.

### Fixed

- Drag and drop upload failed in Dataverse with "Feature 'Utility.getEntityMetadata' is required"; the primary key of the record is now read with the Web API.
- Drag and drop upload to a subfolder of a subfolder failed with "Folder … has been renamed or deleted".
- The control uses the full width of the form section.

### Security

- Build tooling dependencies updated to versions without known vulnerabilities: `npm audit fix` (cross-spawn, flatted, js-yaml, lodash, minimatch, picomatch, semver, brace-expansion), `@typescript-eslint/*` 5 → 8 with ESLint 8.57, `ajv` 7 → 8, and `@opentelemetry/core` / `@opentelemetry/sdk-trace-base` 2.x for the telemetry of `pcf-scripts` (npm `overrides`). The control itself and its bundle are unchanged.
- The `pcf-start` test harness is no longer a dev dependency: `npm start` builds the control and downloads the harness with `npx`. Its file server (`browser-sync`) depends on `braces`, for which no fixed version is published yet, so it is no longer installed with the project; it is only downloaded when the local test harness is started.

## 0.0.4 (2026-10-22)

### Added

- **Enable drag and drop upload (experimental)** property: files dropped onto the control are uploaded to the current folder of a record's document location ([#7](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/7)). Uses the undocumented `UploadDocument` action of the standard documents grid; off by default.
- English and German user interface and property names (`strings/*.resx`); other languages fall back to English.

### Changed

- The control is a React control that uses the React 16.14.0 and Fluent UI 8.121.1 libraries provided by Power Apps. The bundle shrinks from 1.52 MiB to 112 KiB. The namespace and constructor are unchanged, so the package upgrades the previous version.
- The folder tree is requested again at most once per minute instead of on every update, and a changed tree no longer reloads the grid.
- Build tooling: `pcf-scripts` and `pcf-start` 1.51.1; React, React DOM and Fluent UI are declared as dependencies; `@types/react-dom` matches React 16.

### Fixed

- The folder tree follows the document location of the shown documents, so another location selected in the grid gets its own tree ([#3](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/3)).
- Document locations created for a subfolder of another location show their folders: the path is built from the parent locations ([#5](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/5)).
- After the folder tree is reloaded, the folder the grid is filtered by stays selected.

## 0.0.3 (2026-10-22)

### Added

- **Default view** property to choose the view type (tile, list or compact list) that is shown when the control is opened ([#11](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/11)).
- **Remember selected view** property: the view type selected by a user is remembered in the browser and reused for other records ([#11](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/11)).
- A message is shown when no SharePoint document location is found, instead of an endless loading spinner.

### Fixed

- Reading the current sort order no longer removes it from the dataset, so sorting is kept after the grid is refreshed (e.g. when another folder is opened).
- Sorting by a column replaces the sort order of the view instead of being added as a secondary sort.
- Changes deep in the folder tree are detected even when a sibling folder has already changed.
- The folder tree is cached and rendered per record, so a reused control does not show the folder tree of the previously opened record.
- State updates of the control no longer overwrite each other (for example, the folder tree loading no longer restores outdated folder content).
- The selection handler always uses the latest dataset.
- Mock data is used only in the local test harness; previously, environments whose URL does not contain `dynamics.com` (sovereign clouds, custom domains, on-premises) got mock data.
- The React tree is unmounted when the control is destroyed.
- Accessibility: tiles report their position in the list (`aria-posinset`/`aria-setsize`) instead of the record id.

### Changed

- Removed the unused `office-ui-fabric-react` dependency, which made `npm ci` fail with a peer dependency conflict, and brought `package-lock.json` in sync with `package.json`.
- Solution project (`Solution/SPFileExplorerSolution`) and a GitHub Actions workflow that lints and builds every push, builds the managed solution and updates `Solution/SPFullFileExplorer.zip` when the control version is increased.

## 0.0.2 (2023-10-12)

### Added

- **Minimum Height** and **Hide folder tree** properties.

### Fixed

- Escaping of special characters in the relative location of subfolders ([#4](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/4)).
- Newly added folders appear in the folder tree.
