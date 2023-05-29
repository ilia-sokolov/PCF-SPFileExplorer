import * as React from "react";
import { useContext } from "react";
import { Icon } from "@fluentui/react/lib/Icon";
import {
  FolderExplorerContext,
  IFolderExplorerContext,
} from "./FolderExplorerContext";
import { IFolder } from "./IFolder";

export interface IFolderExplorerItemProps
  extends React.LiHTMLAttributes<HTMLElement> {
  /**
   * Name of the folder that will be visible to users.
   */
  name: string;
  /**
   * Unique string associated with the folder item.
   */
  key: string;
  /**
   * Folder's path.
   */
  path: string;
  /**
   * Children folders of the folder item.
   */
  children?: IFolder[];
}

export const FolderExplorerItem = (props: IFolder) => {
  const {
    selectedFolderPath,
    setSelectedFolderPath,
    expandedFoldersPaths,
    setExpandedFoldersPaths,
  } = useContext(FolderExplorerContext) as IFolderExplorerContext;

  const updateExpandedFolders = (path: string) => {
    if (expandedFoldersPaths) {
      const updatedExpandedFoldersPaths =
        expandedFoldersPaths.indexOf(path) >= 0
          ? expandedFoldersPaths.filter((i) => i != path)
          : [...expandedFoldersPaths, path];
      setExpandedFoldersPaths(updatedExpandedFoldersPaths);
    } else {
      setExpandedFoldersPaths([path]);
    }
  };

  return (
    <li
      {...props}
      className={
        !expandedFoldersPaths || expandedFoldersPaths.indexOf(props.path) < 0
          ? "folderItem"
          : "is-expanded folderItem"
      }
    >
      <div
        className={
          selectedFolderPath == props.path
            ? "is-selected folderLinkRow"
            : "folderLinkRow"
        }
      >
        {props.children && props.children.length > 0 && (
          <button
            className="folderChevronButton"
            onClick={() => updateExpandedFolders(props.path)}
          >
            <Icon iconName="ChevronDown" />
          </button>
        )}
        <a
          className="folderLink"
          onClick={() => setSelectedFolderPath(props.path)}
        >
          <Icon iconName="FabricFolder" className="folderIcon" /> {props.name}
        </a>
      </div>

      {props.children && props.children.length > 0 && (
        <ul className="folderItems">
          {props.children.map((subfolder) => {
            return <FolderExplorerItem {...subfolder} key={subfolder.path} />;
          })}
        </ul>
      )}
    </li>
  );
};
