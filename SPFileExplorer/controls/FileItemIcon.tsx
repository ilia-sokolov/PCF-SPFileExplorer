import * as React from "react";
import { FontIcon } from "@fluentui/react/lib/Icon";
import {
  FileIconType,
  getFileTypeIconProps,
  initializeFileTypeIcons,
} from "@fluentui/react-file-type-icons";

import { Icon } from "@fluentui/react";

initializeFileTypeIcons();

/**
 * File icon control properties interface
 */
export interface IFileItemIconProps {
  /**
   * Class name of the icon.
   */
  className?: string;
  /**
   * Sise of the icon ( "small", "medium" or "large")
   */
  size?: string;
  /**
   * File extension.
   */
  extension?: string;
  /**
   * Is the file item is folder?
   */
  isFolder?: boolean;
  /**
   * Is the file checked out?
   */
  isCheckedOut?: boolean;
  /**
   * Is the file locatino is shared?
   */
  isSharedLocation?: boolean;
}

export const FileItemIcon = (props: IFileItemIconProps) => {
  return (
    <span className={props.className}>
      <Icon
        {...getFileTypeIconProps({
          type: props.isFolder ? FileIconType.folder : undefined,
          extension: !props.isFolder ? props.extension : undefined,
          size: props.size === "large" ? 64 : props.size === "small" ? 16 : 48,
          imageFileType: "svg",
        })}
      />
      {(props.isCheckedOut || props.isSharedLocation) && (
        <span
          className="tileIcon-modifier"
          title={props.isCheckedOut ? "Checked out" : "Shared"}
        >
          <FontIcon
            iconName={props.isCheckedOut ? "ArrowTallDownRight" : "Contact"}
          />
        </span>
      )}
    </span>
  );
};
