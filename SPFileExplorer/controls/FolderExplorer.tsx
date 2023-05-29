import * as React from "react";
import { useState } from "react";
import { ISearchBoxProps, SearchBox } from "@fluentui/react/lib/SearchBox";
import { FolderExplorerItem } from "./FolderExplorerItem";
import { IFolder } from "./IFolder";

/**
 * Interface for folder explorer properties.
 */
export interface IFolderExplorerProps {
  /**
   * Root folder item settings.
   */
  rootItem: IFolder;
  /**
   * Hide search box for users.
   */
  hideSearchBox?: boolean;
  /**
   * Search box properties.
   */
  searchBoxProps?: ISearchBoxProps;
}

interface IFolderExplorerState {
  filterText?: string;
  folderItems: IFolder[];
}

const FolderExplorer = (props: IFolderExplorerProps) => {
  const [state, setState] = useState<IFolderExplorerState>({
    folderItems: [props.rootItem],
  });

  const seachFolderItems = (filterText: string, folder: IFolder): IFolder[] => {
    let items: IFolder[] = [];
    if (filterText) {
      if (
        folder.name
          .toLocaleLowerCase()
          .indexOf(filterText.toLocaleLowerCase()) >= 0
      ) {
        const resultItem = Object.assign({}, folder);
        resultItem.children = undefined;
        items.push(resultItem);
      }
      folder.children?.forEach((c) => {
        items = items.concat(seachFolderItems(filterText, c));
      });
    }
    return items;
  };

  const onFilterTextChanged = (newFilterText: string | undefined) => {
    setState({
      filterText: newFilterText,
      folderItems: newFilterText
        ? seachFolderItems(newFilterText, props.rootItem)
        : [props.rootItem],
    });
  };

  return (
    <div
      className={
        props.hideSearchBox ? "folderNavPanel no-searchbox" : "folderNavPanel"
      }
    >
      {!props.hideSearchBox && (
        <SearchBox
          {...props.searchBoxProps}
          placeholder="Filter folder by name"
          underlined={true}
          className="foldersSearchBox"
          onSearch={onFilterTextChanged}
          onChange={(e, value) => onFilterTextChanged(value)}
        ></SearchBox>
      )}
      {state.folderItems && state.folderItems.length > 0 ? (
        <ul className="folderNav">
          {state.folderItems?.map((folderItem) => (
            <FolderExplorerItem {...folderItem} />
          ))}
        </ul>
      ) : (
        <div className="folderNavEmpty">
          {state.filterText
            ? "Your search returned no results."
            : "There are no folders to show."}
        </div>
      )}
    </div>
  );
};

export default FolderExplorer;
