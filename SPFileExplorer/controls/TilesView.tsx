import * as React from "react";
import { useEffect, useState } from "react";
import {
  TilesList,
  ITilesGridItem,
  TilesGridMode,
  ITilesGridItemCellProps,
} from "@fluentui/react-experiments/lib/TilesList";
import { Tile, TileSize } from "@fluentui/react-experiments/lib/Tile";
import { ISelection, SelectionZone } from "@fluentui/react/lib/Selection";
import { initializeFileTypeIcons } from "@fluentui/react-file-type-icons";

import { FileItemIcon } from "./FileItemIcon";
import { IFileSystemItem } from "./IFileSystemItem";
import { IStrings } from "./Strings";

export interface ITileViewProp {
  items: any[];
  tileSize?: TileSize;
  selection?: ISelection;
  isSelectable?: boolean;
  openFileItem: (item: IFileSystemItem) => void;
  /**
   * Returns the URL of the thumbnail of an item (the file icon is shown if not specified).
   */
  getThumbnailUrl?: (item: IFileSystemItem) => string | undefined;
  /**
   * Opens the context menu of an item.
   */
  onItemContextMenu?: (item: IFileSystemItem, ev: React.MouseEvent<HTMLElement>) => void;
  strings?: IStrings;
}
initializeFileTypeIcons();

interface ITileCellProps {
  item: IFileSystemItem;
  index: number;
  props: ITileViewProp;
}

const TileCell = ({ item, index, props }: ITileCellProps) => {
  const thumbnailUrl = props.getThumbnailUrl?.(item);
  const [failedUrl, setFailedUrl] = useState<string | undefined>();
  const showThumbnail = !!thumbnailUrl && thumbnailUrl !== failedUrl;

  return (
    <div
      className="tileCell"
      onContextMenu={
        props.onItemContextMenu
          ? (ev) => {
              ev.preventDefault();
              props.onItemContextMenu?.(item, ev);
            }
          : undefined
      }
    >
      <Tile
        role="listitem"
        key={item.key}
        title={item.fullname}
        aria-posinset={index + 1}
        aria-setsize={props.items ? props.items.length : 0}
        selection={props.selection}
        selectionIndex={index}
        isSelectable={true}
        invokeSelection={true}
        background={
          showThumbnail ? (
            <img
              className="tileThumbnail"
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              onError={() => setFailedUrl(thumbnailUrl)}
            />
          ) : undefined
        }
        showBackgroundFrame={showThumbnail}
        foreground={
          showThumbnail ? undefined : (
            <FileItemIcon
              isFolder={item.filetype === "folder"}
              isCheckedOut={item.ischeckedout == 1}
              isSharedLocation={item.isSharedLocation}
              extension={item.filetype}
              size={props.tileSize}
              className={`tileIcon ${props.tileSize}`}
              strings={props.strings}
            />
          )
        }
        showForegroundFrame={!showThumbnail}
        itemName={item.fullname}
        itemActivity={item.modified}
        tileSize={props.tileSize}
        onClick={() => props.openFileItem(item)}
      />
    </div>
  );
};

export const TilesView = (props: ITileViewProp) => {
  useEffect(() => {
    //Quick fix for incorrect initial width of the List component
    window.dispatchEvent(new Event("resize"));
  }, [props.tileSize]);

  const getTileCells = (items: any[]): ITilesGridItem<any>[] => {
    return items?.map((item) => {
      const gridItem: ITilesGridItem<any> = {
        key: item.key,
        content: item,
        onRenderCell: renderDocumentCell,
      };
      return gridItem;
    });
  };

  const renderDocumentCell = (
    cellProps: ITilesGridItemCellProps<any>
  ): JSX.Element => {
    const item = cellProps.item;
    const itemIndex =
      props && props.items
        ? props.items.map((i) => i.key).indexOf(item.key)
        : -1;

    return <TileCell key={item.key} item={item} index={itemIndex} props={props} />;
  };

  const tilesList = (
    <TilesList
      role="list"
      items={[
        {
          items: getTileCells(props.items),
          key: "grid",
          mode: TilesGridMode.fill,
          minRowHeight: props.tileSize === "large" ? 180 : 150,
          spacing: 10,
        },
      ]}
    />
  );

  return (
    <div data-is-scrollable className="tilesView">
      {props.selection ? (
        <SelectionZone selection={props.selection}>{tilesList}</SelectionZone>
      ) : (
        tilesList
      )}
    </div>
  );
};
