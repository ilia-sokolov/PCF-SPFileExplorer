import path = require("path");
import { IInputs } from "../generated/ManifestTypes";
import { IFileSystemItem } from "./IFileSystemItem";
import { IFolder } from "./IFolder";
import { IFullFileExplorerProps } from "./IFullFileExplorerProps";
import { IResourceStrings } from "../IResourceStrings";

export const ALL_ITEMS_PAGE_SIZE = 5000;

const SHARED_LOCATION_GUID = "17DE0DBB-153C-4C1A-B98A-223B3EA10125";
const FOLDER_STRUCTURE_KEY = "FolderStructure";
const ALL_DOCUMENTS_CACHE_KEY = "AllDocumentsCache";
const CURRENT_FOLDER_PATH_KEY = "CurrentFolderPath";
const SORT_STATE_KEY = "ClientSideSortState";

const buildFolderTreeFromDocuments = (
  rootPath: string,
  documents: IFileSystemItem[]
): IFolder[] => {
  const folderMap: { [path: string]: IFolder } = {};
  
  // Extract unique folder paths from documents
  documents.forEach((doc) => {
    const docPath = doc.relativelocation || doc.path;
    if (docPath && docPath !== rootPath) {
      // Only process paths that start with the root path + "/"
      if (docPath.startsWith(rootPath + '/')) {
        // Remove the root path prefix to get relative path
        const relativePath = docPath.substring(rootPath.length + 1);
        const pathParts = relativePath.split('/').filter((p: string) => p);
        let currentPath = '';
        
        pathParts.forEach((part: string, index: number) => {
          const fullPath = rootPath + '/' + (currentPath ? currentPath + '/' : '') + part;
          currentPath = currentPath ? currentPath + '/' + part : part;
          
          // Only create folder if it's not the document itself (folders don't have extensions typically)
          if (doc.filetype === 'folder' || index < pathParts.length - 1) {
            if (!folderMap[fullPath]) {
              folderMap[fullPath] = {
                path: fullPath,
                key: fullPath,
                name: part,
                children: []
              };
            }
          }
        });
      }
    }
  });

  // Build hierarchical structure - only get direct children of root
  const buildHierarchy = (parentPath: string): IFolder[] => {
    const children: IFolder[] = [];
    
    Object.values(folderMap).forEach((folder) => {
      const folderParentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
      if (folderParentPath === parentPath) {
        folder.children = buildHierarchy(folder.path);
        children.push(folder);
      }
    });
    
    return children.sort((a, b) => a.name.localeCompare(b.name));
  };
  
  return buildHierarchy(rootPath);
};


/**
 * Function that initilizes properties of the full file explorer control.
 */
export const initFullFileExplorerProps = (
  context: ComponentFramework.Context<IInputs>,
  controlCache: { [index: string]: any },
  resources: IResourceStrings,
  notifyOutputChanged: () => void
): IFullFileExplorerProps => {
  const dataSet = context.parameters.documentsDataSet;
  let folderStructure = controlCache[FOLDER_STRUCTURE_KEY] as IFolder;
  const useClientSideFiltering = (context.parameters as any).useClientSideFiltering?.raw ?? false;

  // Get sort expression - use client-side cache in client-side mode, otherwise use dataset
  let sortExpression: { name: string; sortDirection: number };
  if (useClientSideFiltering && controlCache[SORT_STATE_KEY]) {
    sortExpression = controlCache[SORT_STATE_KEY] as { name: string; sortDirection: number };
  } else {
    sortExpression =
      dataSet.sorting && dataSet.sorting.length > 0
        ? (dataSet.sorting.pop() as { name: string; sortDirection: number })
        : { name: "", sortDirection: 0 };
  }

  // Build complete document list from dataset
  const buildDocumentList = (): IFileSystemItem[] => {

    return dataSet.sortedRecordIds.map((recordId, index) => {
      const record = dataSet.records[recordId];
      const itemData = {} as IFileSystemItem;

      itemData["isSharedLocation"] =
        record.getValue("locationid") === SHARED_LOCATION_GUID;
      itemData.reference = (record as any)._entityReference;
      itemData.key = record.getRecordId();
      itemData.path = record.getFormattedValue("relativelocation");

      // Read all column values
      dataSet.columns.forEach((c) => {
        itemData[c.name] = record.getFormattedValue(c.name);
        if (c.name === "ischeckedout") {
          itemData[c.name] = record.getValue(c.name);
        }
      });

      // FIX for Problem C: Extract base folder name from relativelocation path
      const fullPath = itemData.relativelocation || itemData.path || "";

      // Simple approach: Split path and remove first segment (base folder)
      const pathParts = fullPath.split('/');
      if (pathParts.length > 1) {
        // Remove first part (base folder) and rejoin
        itemData.relativelocationDisplay = pathParts.slice(1).join('/');
      } else {
        // Single segment or empty - use as is
        itemData.relativelocationDisplay = fullPath;
      }

      return itemData;
    });
  };

  // Cache all documents for client-side filtering
  // Only cache when we have data and it's not still loading more pages
  const hasAllData = !dataSet.paging?.hasNextPage;
  if (useClientSideFiltering) {
    // Always update cache with current data
    const currentDocs = buildDocumentList();
    
    if (!controlCache[ALL_DOCUMENTS_CACHE_KEY]) {
      // First time - initialize cache
      controlCache[ALL_DOCUMENTS_CACHE_KEY] = currentDocs;
    } else if (hasAllData && currentDocs.length > (controlCache[ALL_DOCUMENTS_CACHE_KEY] as IFileSystemItem[]).length) {
      // Update cache if we got more data
      controlCache[ALL_DOCUMENTS_CACHE_KEY] = currentDocs;
    }
  }

  // Get current folder path - use cache for client-side, filter for server-side
  let currentFolderPath: string;
  
  if (useClientSideFiltering) {
    // CLIENT-SIDE: Read from cache, default to root folder path
    currentFolderPath = controlCache[CURRENT_FOLDER_PATH_KEY];
    
    // If not set and we have folder structure, use root folder path
    if (!currentFolderPath && folderStructure) {
      currentFolderPath = folderStructure.path;
      controlCache[CURRENT_FOLDER_PATH_KEY] = currentFolderPath;
    }
    
    currentFolderPath = currentFolderPath || "";
  } else {
    // SERVER-SIDE: Read from dataset filter
    const relativelocationCondition = dataSet.filtering
      .getFilter()
      ?.conditions?.filter(
        (condition) => condition.attributeName == "relativelocation"
      );
    
    currentFolderPath =
      !relativelocationCondition || relativelocationCondition.length == 0
        ? ""
        : (relativelocationCondition[0].value as string);
  }

  // Helper function to sort documents client-side
  const sortDocuments = (documents: IFileSystemItem[], sortColumn: string, sortAscending: boolean): IFileSystemItem[] => {
    if (!sortColumn) {
      return documents;
    }

    const sorted = [...documents].sort((a, b) => {
      const aValue = a[sortColumn as keyof IFileSystemItem] as string || "";
      const bValue = b[sortColumn as keyof IFileSystemItem] as string || "";

      // Handle numeric sorting for certain fields
      if (sortColumn === "size" || sortColumn === "filesize") {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortAscending ? aNum - bNum : bNum - aNum;
      }

      // String comparison for all other fields
      const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortAscending ? comparison : -comparison;
    });

    return sorted;
  };

  // Determine current folder content based on filtering mode
  let currentFolderContent: IFileSystemItem[];

  if (useClientSideFiltering && controlCache[ALL_DOCUMENTS_CACHE_KEY] && hasAllData) {
    // CLIENT-SIDE: Pass ALL documents to React component
    // React will filter them internally based on currentFolderPath
    currentFolderContent = controlCache[ALL_DOCUMENTS_CACHE_KEY] as IFileSystemItem[];

    // FIX for Problem B: Apply client-side sorting if sort state exists
    if (sortExpression && sortExpression.name) {
      currentFolderContent = sortDocuments(
        currentFolderContent,
        sortExpression.name,
        sortExpression.sortDirection === 0
      );
    }

  } else {
    // SERVER-SIDE: Use documents from dataset (already filtered by server)
    currentFolderContent = buildDocumentList();
  }

  // Rebuild folder structure from all loaded documents if we have a root folder
  if (folderStructure && dataSet.sortedRecordIds.length > 0) {
    // Get all documents from the dataset (not just current folder)
    const allDocuments = dataSet.sortedRecordIds.map((recordId) => {
      const record = dataSet.records[recordId];
      return {
        relativelocation: record.getFormattedValue("relativelocation"),
        filetype: record.getFormattedValue("filetype"),
        path: record.getFormattedValue("relativelocation"),
      } as any;
    });
    
    // Rebuild the folder tree from documents
    folderStructure.children = buildFolderTreeFromDocuments(
      folderStructure.path,
      allDocuments
    );
  }

  // Check for dataset errors
  let error: { message: string; code?: string } | undefined;
  if (dataSet.error) {
    error = {
      message: dataSet.errorMessage || 'An error occurred loading documents',
      code: dataSet.error ? String(dataSet.error) : undefined
    };
  }

  return {
    hideFoldersPane: context.parameters.hideFoldersPane
      ? context.parameters.hideFoldersPane.raw
      : false,
    columns: dataSet.columns
      .filter((c) => !c.isHidden)
      .map((c) => {
        const col = {
          name: c.name,
          displayName: c.displayName,
          isPrimary: c.isPrimary,
          isSortable: !c.disableSorting,
          visualSizeFactor: c.visualSizeFactor,
          renderIcon: c.name === "fullname",
          isSorted: sortExpression?.name == c.name,
          isSortedDescending: sortExpression?.sortDirection == 1,
        };
        return col;
      }),
    openRecord: (reference: any) => {
      dataSet.openDatasetItem(reference as ComponentFramework.EntityReference);
    },
    selectRecords: (ids: string[]) => {
      dataSet.setSelectedRecordIds(ids);
    },
    selectedRecordsKeys: dataSet.getSelectedRecordIds(),
    getFolderStructure: (): Promise<IFolder> => {
      const contextPage = (context as any).page;
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

      return new Promise<IFolder>((resolve) => {
        if (folderStructure) {
          resolve(folderStructure);
        } else {
          context.webAPI
            .retrieveMultipleRecords(locationEntityName, locationFetchQuery)
            .then((result) => {
              const sharepointLocation =
                result && result.entities && result.entities.length > 0
                  ? result.entities[0]
                  : null;
              if (sharepointLocation) {
                // Get all documents to build folder structure
                const allDocuments = dataSet.sortedRecordIds.map((recordId) => {
                  const record = dataSet.records[recordId];
                  return {
                    relativelocation: record.getFormattedValue("relativelocation"),
                    filetype: record.getFormattedValue("filetype"),
                    path: record.getFormattedValue("relativelocation"),
                  } as any;
                });
                
                controlCache[FOLDER_STRUCTURE_KEY] = folderStructure = {
                  name: sharepointLocation.name,
                  path: sharepointLocation.relativeurl,
                  key: sharepointLocation.relativeurl,
                  children: buildFolderTreeFromDocuments(
                    sharepointLocation.relativeurl,
                    allDocuments
                  ),
                };
                resolve(folderStructure);
              }
            });
        }
      });
    },
    currentFolderContent,
    setSorting: (column: string, ascending: boolean) => {
      // FIX for Problem B: Handle sorting differently based on mode
      if (useClientSideFiltering) {
        // CLIENT-SIDE: Store sort state in cache and trigger re-render
        controlCache[SORT_STATE_KEY] = {
          name: column,
          sortDirection: ascending ? 0 : 1
        };
        // Use notifyOutputChanged to trigger re-render without fetching from server
        notifyOutputChanged();
      } else {
        // SERVER-SIDE: Use dataset sorting and refresh from server
        if (!dataSet.sorting) {
          dataSet.sorting = [];
        }
        if (dataSet.sorting.length > 0) {
          dataSet.sorting.pop();
        }
        dataSet.sorting.push({ name: column, sortDirection: ascending ? 0 : 1 });
        dataSet.refresh();
      }
    },
    setCurrentFolder: (path: string): void => {
      if (useClientSideFiltering) {
        // FIX for Problem A: Store path in cache and trigger re-render WITHOUT fetching from server
        controlCache[CURRENT_FOLDER_PATH_KEY] = path;
        // Use notifyOutputChanged to trigger updateView without server fetch
        // This allows React to re-filter the cached documents client-side
        notifyOutputChanged();
      } else {
        // SERVER-SIDE: Set filter and fetch from server
        const existingFilter = dataSet.filtering.getFilter();
        const dataFilter = existingFilter ?? {
          conditions: [],
          filterOperator: 0
        };
        const locationConditionId = dataFilter.conditions.findIndex(
          (item) => item.attributeName == "relativelocation"
        );

        if (locationConditionId == -1) {
          dataFilter.conditions.push({
            attributeName: "relativelocation",
            value: path,
            conditionOperator: 0,
          });
        } else {
          dataFilter.conditions[locationConditionId].value = path;
        }

        dataSet.filtering.setFilter(dataFilter);
        dataSet.refresh();
      }
    },
    currentFolderPath,
    resources,
    error,
  };
};
