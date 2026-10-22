import { IInputs } from "../generated/ManifestTypes";
import { IFileSystemItem } from "./IFileSystemItem";
import { IFolder } from "./IFolder";
import {
  IFullFileExplorerProps,
  IUploadError,
  ViewType,
} from "./IFullFileExplorerProps";

export const ALL_ITEMS_PAGE_SIZE = 5000;

const SHARED_LOCATION_GUID = "17de0dbb-153c-4c1a-b98a-223b3ea10125";
const FOLDER_STRUCTURE_KEY = "FolderStructure";
const LOCATION_KEY = "Location";
const LOCATION_ENTITY_NAME = "sharepointdocumentlocation";
// The whole folder tree is requested again at most once per interval.
const FOLDER_TREE_REFRESH_INTERVAL_MS = 60000;
// Guards the walk up the parent locations against cycles.
const MAX_LOCATION_DEPTH = 10;

interface IFolderTreeCache {
  folder: IFolder;
  locationId: string;
  refreshedAt: number;
  refreshing: boolean;
}

const normalizeId = (id: unknown): string =>
  id ? String(id).replace(/[{}]/g, "").toLowerCase() : "";

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

const retrieveLocation = (
  context: ComponentFramework.Context<IInputs>,
  id: string
): Promise<ComponentFramework.WebApi.Entity | null> =>
  id
    ? context.webAPI
        .retrieveRecord(
          LOCATION_ENTITY_NAME,
          id,
          "?$select=relativeurl,_parentsiteorlocation_value"
        )
        // The parent is a SharePoint site, not a document location.
        .catch(() => null)
    : Promise.resolve(null);

const isParentSite = (location: ComponentFramework.WebApi.Entity): boolean =>
  location[
    "_parentsiteorlocation_value@Microsoft.Dynamics.CRM.lookuplogicalname"
  ] === "sharepointsite";

/**
 * Builds the path of a document location relative to its document library.
 * A location created for a subfolder of another location only stores the name of
 * the subfolder, so the relative URLs of its parent locations are prepended
 * (the document library location itself, whose parent is a site, is not included).
 */
const buildLocationPath = async (
  context: ComponentFramework.Context<IInputs>,
  location: ComponentFramework.WebApi.Entity
): Promise<string> => {
  let path: string = location.relativeurl;
  let current = location;
  for (let depth = 0; depth < MAX_LOCATION_DEPTH && !isParentSite(current); depth++) {
    const parent = await retrieveLocation(
      context,
      current._parentsiteorlocation_value
    );
    if (!parent || isParentSite(parent)) {
      break;
    }
    const grandParent = await retrieveLocation(
      context,
      parent._parentsiteorlocation_value
    );
    if (!grandParent) {
      // The parent is the document library location.
      break;
    }
    path = `${parent.relativeurl}/${path}`;
    current = parent;
  }
  return path;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    // The result is a data URL: "data:<type>;base64,<content>".
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Uploads a file to a folder of a document location with the UploadDocument action.
 * This is the action used by the standard documents grid; it is not publicly documented.
 */
const uploadDocument = async (
  context: ComponentFramework.Context<IInputs>,
  file: File,
  locationId: string,
  folderPath: string
): Promise<void> => {
  const contextPage = (context as any).page;
  const entityTypeName: string = contextPage.entityTypeName;
  const metadata = await context.utils.getEntityMetadata(entityTypeName);
  const primaryIdAttribute: string =
    metadata.PrimaryIdAttribute ?? `${entityTypeName}id`;
  const clientUrl: string =
    contextPage.getClientUrl?.() ?? window.location.origin;

  const response = await fetch(`${clientUrl}/api/data/v9.2/UploadDocument`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify({
      Content: await readFileAsBase64(file),
      Entity: {
        "@odata.type": "Microsoft.Dynamics.CRM.sharepointdocument",
        locationid: locationId,
        title: file.name,
      },
      OverwriteExisting: false,
      ParentEntityReference: {
        "@odata.type": `Microsoft.Dynamics.CRM.${entityTypeName}`,
        [primaryIdAttribute]: normalizeId(contextPage.entityId),
      },
      FolderPath: folderPath,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.error?.message ?? `${response.status} ${response.statusText}`
    );
  }
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
  const recordId = normalizeId(contextPage?.entityId);

  // The primary sort expression is read without removing it from the dataset.
  const sortExpression =
    dataSet.sorting && dataSet.sorting.length > 0
      ? dataSet.sorting[0]
      : { name: "", sortDirection: 0 };

  const recordLocationIds = new Set<string>();
  const currentFolderContent = dataSet.sortedRecordIds.map((id) => {
    const record = dataSet.records[id];
    const itemData = {} as IFileSystemItem;

    const locationId = normalizeId(record.getValue("locationid"));
    itemData["isSharedLocation"] = locationId === SHARED_LOCATION_GUID;
    if (locationId && locationId !== SHARED_LOCATION_GUID) {
      recordLocationIds.add(locationId);
    }
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

  // The grid shows the documents of one document location (selected in the
  // standard location selector). Its id is remembered per record, so that an
  // empty folder (no documents to read the id from) keeps the current tree.
  const locationKey = `${LOCATION_KEY}_${recordId}`;
  if (recordLocationIds.size === 1) {
    controlCache[locationKey] = recordLocationIds.values().next().value;
  }
  const locationId: string = controlCache[locationKey] ?? "";

  // The folder structure is cached per record and location, so that the tree of
  // one record or location is never shown for another one.
  const folderStructureKey = `${FOLDER_STRUCTURE_KEY}_${recordId}_${locationId}`;
  const folderTree = controlCache[folderStructureKey] as
    | IFolderTreeCache
    | undefined;
  const folderStructure = folderTree?.folder;

  if (folderTree && folderStructure) {
    const currentFolder =
      currentFolderPath === ""
        ? folderStructure
        : findSubfolderRecursive(folderStructure, currentFolderPath);

    // Folders of the current folder are taken from the dataset without a query;
    // they are rendered with this update, so no refresh is needed.
    if (currentFolder) {
      ensureSubfolders(currentFolder, currentFolderContent);
    }
  }

  const refreshFolderStructure = (): Promise<boolean> => {
    if (
      !folderTree ||
      !folderStructure ||
      folderTree.refreshing ||
      Date.now() - folderTree.refreshedAt <= FOLDER_TREE_REFRESH_INTERVAL_MS
    ) {
      return Promise.resolve(false);
    }
    folderTree.refreshing = true;
    return retrieveSubFoldersRecursive(context, folderStructure.path)
      .then((refreshedSubfolders) =>
        refreshSubfoldersRecursive(folderStructure, refreshedSubfolders)
      )
      .finally(() => {
        folderTree.refreshedAt = Date.now();
        folderTree.refreshing = false;
      });
  };

  const defaultViewType = context.parameters.defaultViewType?.raw;

  // Files can be uploaded only to the document location of a record.
  const uploadFiles =
    context.parameters.enableUpload?.raw &&
    contextPage?.entityId &&
    contextPage?.entityTypeName
      ? async (
          files: File[],
          folderPath: string,
          onProgress: (uploaded: number) => void
        ): Promise<IUploadError[]> => {
          // The tree may have been loaded after these properties were created.
          const tree = controlCache[folderStructureKey] as
            | IFolderTreeCache
            | undefined;
          if (!tree) {
            return files.map((f) => ({
              fileName: f.name,
              message: "The document location is not loaded.",
            }));
          }
          const rootPath = tree.folder.path;
          // The folder path is relative to the document location.
          const relativeFolderPath =
            folderPath === rootPath
              ? ""
              : folderPath.startsWith(`${rootPath}/`)
              ? folderPath.substring(rootPath.length + 1)
              : folderPath;

          const errors: IUploadError[] = [];
          for (let i = 0; i < files.length; i++) {
            try {
              await uploadDocument(
                context,
                files[i],
                tree.locationId,
                relativeFolderPath
              );
            } catch (e) {
              errors.push({
                fileName: files[i].name,
                message: (e as Error)?.message ?? String(e),
              });
            }
            onProgress(i + 1);
          }
          dataSet.refresh();
          return errors;
        }
      : undefined;

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
    locationKey: locationId,
    uploadFiles,
    refreshFolderStructure,
    getFolderStructure: (): Promise<IFolder | null> => {
      const locationFetchXml = `<fetch mapping="logical">
                    <entity name="${LOCATION_ENTITY_NAME}">
                        <attribute name="name" />
                        <attribute name="relativeurl" />
                        <attribute name="sitecollectionid" />
                        <attribute name="sharepointdocumentlocationid" />
                        <attribute name="parentsiteorlocation" />
                        <order attribute="createdon" descending="false" />
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
            .retrieveMultipleRecords(LOCATION_ENTITY_NAME, locationFetchQuery)
            .then(async (result) => {
              const locations = result?.entities ?? [];
              // The location of the shown documents, otherwise the oldest one.
              const sharepointLocation =
                locations.find(
                  (l) =>
                    normalizeId(l.sharepointdocumentlocationid) === locationId
                ) ?? locations[0];
              if (sharepointLocation) {
                const path = await buildLocationPath(
                  context,
                  sharepointLocation
                );
                const folder: IFolder = {
                  name: sharepointLocation.name,
                  path,
                  key: path,
                  children: await retrieveSubFoldersRecursive(context, path),
                };
                controlCache[folderStructureKey] = {
                  folder,
                  locationId: normalizeId(
                    sharepointLocation.sharepointdocumentlocationid
                  ),
                  refreshedAt: Date.now(),
                  refreshing: false,
                } as IFolderTreeCache;
                resolve(folder);
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
      // The tree may have been loaded after these properties were created.
      const rootFolder = (
        controlCache[folderStructureKey] as IFolderTreeCache | undefined
      )?.folder;
      if (path == "" || (rootFolder && rootFolder.path == path)) {
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
