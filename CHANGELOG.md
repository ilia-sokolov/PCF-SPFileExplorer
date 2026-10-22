# Changelog

## Unreleased (control version 0.0.3)

These changes are in the sources but not yet in the packaged solution (`Solution/SPFullFileExplorer.zip`).

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

## 0.0.2

- Escaping of special characters in the relative location of subfolders ([#4](https://github.com/ilia-sokolov/PCF-SPFileExplorer/issues/4)).
- **Minimum Height** and **Hide folder tree** properties.
- Newly added folders appear in the folder tree.
