import { IInputs } from "../generated/ManifestTypes";
import { IFileSystemItem } from "./IFileSystemItem";
import { IFolder } from "./IFolder";
import { IFullFileExplorerProps, ViewType } from "./IFullFileExplorerProps";

export const ALL_ITEMS_PAGE_SIZE = 5000;

const SHARED_LOCATION_GUID = "17DE0DBB-153C-4C1A-B98A-223B3EA10125";
const FOLDER_STRUCTURE_KEY = "FolderStructure";

const retrieveSubFoldersRecursive = (
  context: ComponentFramework.Context<IInputs>,
  relativeUrl: string
): Promise<IFolder[]> => {
  return new Promise<IFolder[]>((resolve) => {
    const entityType =
      context.parameters.documentsDataSet.getTargetEntityType();
    const contextPage = (context as any).page;
    const escapedRelativeUrl = relativeUrl
      .split("&")
      .join("&amp;")
      .split("<")
      .join("&lt;")
      .split(">")
      .join("&gt;")
      .split("'")
      .join("&apos;")
      .split('"')
      .join("&quot;");

    const subfoldersFetchXml =
      `<fetch mapping="logical" count="${ALL_ITEMS_PAGE_SIZE}">
                <entity name="${entityType}">
                    <attribute name="documentid"/>
                    <attribute name="filetype"/>
                    <attribute name="relativelocation"/>
                    <attribute name="fullname"/>
                    <order attribute="relativelocation" descending="false"/>
                    <filter type="and">
                        <condition attribute="isrecursivefetch" operator="eq" value="0"/>
                        <condition attribute="filetype" operator="null"/>
                        <condition attribute="relativelocation" operator="eq" value="${escapedRelativeUrl}"/>
                    </filter>` +
      (contextPage && contextPage.entityId && contextPage.entityTypeName
        ? `<link-entity name="${contextPage.entityTypeName}" from="${contextPage.entityTypeName}id" to="regardingobjectid" alias="bb">
                        <filter type="and">
                            <condition attribute="${contextPage.entityTypeName}id" operator="eq" uitype="${contextPage.entityTypeName}" value="${contextPage.entityId}"/>
                        </filter>
                    </link-entity>`
        : "") +
      `</entity>
            </fetch >`;
    const subfoldersFetchQuery =
      "?fetchXml=" + encodeURIComponent(subfoldersFetchXml);
    context.webAPI
      .retrieveMultipleRecords(entityType, subfoldersFetchQuery)
      .then(async (result) => {
        let childFolders: IFolder[] = [];

        if (result.entities) {
          childFolders = result.entities
            .filter((e) => e.filetype == "folder")
            .map((e) => {
              return {
                path: e.relativelocation,
                key: e.relativelocation,
                name: e.fullname,
                children: [],
              } as IFolder;
            });

          await Promise.all(
            childFolders.map(
              async (c) =>
                (c.children = await retrieveSubFoldersRecursive(
                  context,
                  c.path
                ))
            )
          );
        }
        resolve(childFolders);
      })
      .catch(() => {
        resolve([]);
      });
  });
};

const findSubfolderRecursive = (
  folder: IFolder,
  pathToFind: string
): IFolder | null => {
  let result: IFolder | null = null;
  if (folder.path == pathToFind) {
    result = folder;
  } else {
    folder.children?.forEach((s) => {
      if (!result) result = findSubfolderRecursive(s, pathToFind);
    });
  }

  return result;
};

const ensureSubfolders = (
  folder: IFolder,
  folderContent: IFileSystemItem[]
): boolean => {
  let subfoldersChanged = false;
  const subfolders = folderContent.filter((f) => f.filetype === "folder");

  subfolders.forEach((s) => {
    if (!folder.children?.find((e) => e.path == s.relativelocation)) {
      subfoldersChanged = true;
      folder.children?.push({
        path: s.relativelocation,
        key: s.relativelocation,
        name: s.fullname,
        children: [],
      });
    }
  });
  if (subfoldersChanged) {
    folder.children?.sort((a, b) => {
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    });
  }
  return subfoldersChanged;
};

const refreshSubfoldersRecursive = (
  currentFolder: IFolder,
  refreshedSubfolders: IFolder[]
): boolean => {
  let updated = false;
  const newFolders: IFolder[] = [];
  const removedFolders: IFolder[] = [];

  refreshedSubfolders.forEach((f) => {
    const existingFolder = currentFolder.children?.find((c) => f.key == c.key);
    if (!existingFolder) {
      newFolders.push(f);
    }
  });

  currentFolder.children?.forEach((c) => {
    const refreshedFolder = refreshedSubfolders.find((f) => f.key == c.key);
    if (refreshedFolder && refreshedFolder.children) {
      // The recursive call goes first so that it is not skipped once a
      // previous sibling has already reported a change.
      updated =
        refreshSubfoldersRecursive(c, refreshedFolder.children) || updated;
    } else {
      removedFolders.push(c);
    }
  });

  if (newFolders.length > 0 || removedFolders.length > 0) {
    removedFolders.forEach((c) =>
      currentFolder.children?.splice(currentFolder.children?.indexOf(c), 1)
    );
    currentFolder.children?.push(...newFolders);

    currentFolder.children?.sort((a, b) => {
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    });
    updated = true;
  }
  return updated;
};

/**
 * Function that initilizes properties of the full file explorer control.
 */
export const initFullFileExplorerProps = (
  context: ComponentFramework.Context<IInputs>,
  controlCache: { [index: string]: any }
): IFullFileExplorerProps => {
  const dataSet = context.parameters.documentsDataSet;
  const contextPage = (context as any).page;
  // The folder structure is cached per record, so that the tree of one record
  // is never shown for another one when the control instance is reused.
  const folderStructureKey = `${FOLDER_STRUCTURE_KEY}_${
    contextPage?.entityId ?? ""
  }`;
  let folderStructure = controlCache[folderStructureKey] as IFolder;

  // The primary sort expression is read without removing it from the dataset.
  const sortExpression =
    dataSet.sorting && dataSet.sorting.length > 0
      ? dataSet.sorting[0]
      : { name: "", sortDirection: 0 };

  const currentFolderContent = dataSet.sortedRecordIds.map((recordId) => {
    const record = dataSet.records[recordId];
    const itemData = {} as IFileSystemItem;

    itemData["isSharedLocation"] =
      record.getValue("locationid") === SHARED_LOCATION_GUID;
    itemData.reference = (record as any)._entityReference;
    itemData.key = record.getRecordId();
    itemData.path = record.getFormattedValue("relativelocation");
    dataSet.columns.forEach((c) => {
      itemData[c.name] = record.getFormattedValue(c.name);
      if (c.name === "ischeckedout") {
        itemData[c.name] = record.getValue(c.name);
      }
    });

    return itemData;
  });

  const relativelocationCondition = dataSet.filtering
    .getFilter()
    ?.conditions?.filter(
      (condition) => condition.attributeName == "relativelocation"
    );

  const currentFolderPath =
    !relativelocationCondition || relativelocationCondition.length == 0
      ? ""
      : (relativelocationCondition[0].value as string);

  if (folderStructure) {
    const currentFolder =
      currentFolderPath === ""
        ? folderStructure
        : findSubfolderRecursive(folderStructure, currentFolderPath);

    if (
      currentFolder &&
      ensureSubfolders(currentFolder, currentFolderContent)
    ) {
      dataSet.refresh();
    }

    retrieveSubFoldersRecursive(context, folderStructure.path).then(
      (refreshedSubfolders) => {
        if (refreshSubfoldersRecursive(folderStructure, refreshedSubfolders)) {
          dataSet.refresh();
        }
      }
    );
  }

  const defaultViewType = context.parameters.defaultViewType?.raw;

  return {
    hideFoldersPane: context.parameters.hideFoldersPane
      ? context.parameters.hideFoldersPane.raw
      : false,
    defaultViewType:
      defaultViewType !== undefined && defaultViewType !== null
        ? (+defaultViewType as ViewType)
        : ViewType.Tiles,
    rememberViewType: context.parameters.rememberViewType?.raw ?? true,
    columns: dataSet.columns
      .filter((c) => !c.isHidden)
      .map((c) => {
        return {
          name: c.name,
          displayName: c.displayName,
          isPrimary: c.isPrimary,
          isSortable: !c.disableSorting,
          visualSizeFactor: c.visualSizeFactor,
          renderIcon: c.name === "fullname",
          isSorted: sortExpression?.name == c.name,
          isSortedDescending: sortExpression?.sortDirection == 1,
        };
      }),
    openRecord: (reference: any) => {
      dataSet.openDatasetItem(reference as ComponentFramework.EntityReference);
    },
    selectRecords: (ids: string[]) => {
      dataSet.setSelectedRecordIds(ids);
    },
    selectedRecordsKeys: dataSet.getSelectedRecordIds(),
    getFolderStructure: (): Promise<IFolder | null> => {
      const locationEntityName = "sharepointdocumentlocation";
      const locationFetchXml = `<fetch mapping="logical">
                    <entity name="${locationEntityName}">
                        <attribute name="name" /> 
                        <attribute name="relativeurl" />
                        <attribute name="sitecollectionid" />
                        <attribute name="sharepointdocumentlocationid" />
                        <filter type="and">
                            ${
                              contextPage && contextPage.entityId
                                ? `<condition attribute="regardingobjectid" operator="eq" value="${contextPage.entityId}" />`
                                : `<condition attribute="regardingobjectid" operator="null" />`
                            }
                            <condition attribute="statecode" operator="eq" value="0" />
                            <condition attribute="statuscode" operator = "eq" value="1" />
                            <condition attribute="sitecollectionid" operator="not-null" value="true" />
                            <condition attribute="absoluteurl" operator="null" />
                        </filter>
                        <filter type="or">
                            <condition attribute="servicetype" operator="eq" value="0" />
                        </filter>
                        </entity>
                    </fetch>`;
      const locationFetchQuery =
        "?fetchXml=" + encodeURIComponent(locationFetchXml);

      return new Promise<IFolder | null>((resolve) => {
        if (folderStructure) {
          resolve(folderStructure);
        } else {
          context.webAPI
            .retrieveMultipleRecords(locationEntityName, locationFetchQuery)
            .then(async (result) => {
              const sharepointLocation =
                result && result.entities && result.entities.length > 0
                  ? result.entities[0]
                  : null;
              if (sharepointLocation) {
                controlCache[folderStructureKey] = folderStructure = {
                  name: sharepointLocation.name,
                  path: sharepointLocation.relativeurl,
                  key: sharepointLocation.relativeurl,
                  children: await retrieveSubFoldersRecursive(
                    context,
                    sharepointLocation.relativeurl
                  ),
                };
                resolve(folderStructure);
              } else {
                // No active document location (e.g. document management is
                // not enabled for the table or the folder is not created yet).
                resolve(null);
              }
            })
            .catch(() => resolve(null));
        }
      });
    },
    currentFolderContent,
    setSorting: (column: string, ascending: boolean) => {
      if (!dataSet.sorting) {
        dataSet.sorting = [];
      }
      // Sorting by a column replaces all sort expressions of the view, as in the standard grid.
      while (dataSet.sorting.length > 0) {
        dataSet.sorting.pop();
      }
      dataSet.sorting.push({ name: column, sortDirection: ascending ? 0 : 1 });
      dataSet.refresh();
    },
    setCurrentFolder: (path: string): void => {
      const dataFilter = dataSet.filtering.getFilter() ?? { conditions: [] };
      const locationConditionId = dataFilter.conditions.findIndex(
        (item) => item.attributeName == "relativelocation"
      );
      if (path == "" || (folderStructure && folderStructure.path == path)) {
        if (locationConditionId > -1) {
          dataFilter.conditions.splice(locationConditionId, 1);
        }
      } else {
        if (locationConditionId == -1) {
          dataFilter.conditions.push({
            attributeName: "relativelocation",
            value: path,
            conditionOperator: 0,
          });
        } else {
          dataFilter.conditions[locationConditionId].value = path;
        }
      }
      dataSet.filtering.setFilter(dataFilter);
      dataSet.refresh();
    },
    currentFolderPath,
  };
};
