import * as React from "react";
import { useEffect, useState } from "react";
import { FileItemIcon, IFileItemIconProps } from "./FileItemIcon";

export interface IItemThumbnailProps {
  /**
   * URL of the thumbnail image; the icon is shown if not specified or if the image cannot be loaded.
   */
  url?: string;
  /**
   * Properties of the file icon used as fallback.
   */
  iconProps: IFileItemIconProps;
  className?: string;
}

/**
 * Thumbnail image of a file with the file type icon as fallback.
 */
export const ItemThumbnail = (props: IItemThumbnailProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [props.url]);

  if (!props.url || failed) {
    return <FileItemIcon {...props.iconProps} />;
  }
  return (
    <span className={`itemThumbnail ${props.className ?? ""}`}>
      <img src={props.url} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
};
