import * as React from "react";
import { useEffect } from "react";
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

export interface ITileViewProp {
  items: any[];
  tileSize?: TileSize;
  selection?: ISelection;
  isSelectable?: boolean;
  openFileItem: (item: IFileSystemItem) => void;
}
initializeFileTypeIcons();

export const TilesView = (props: ITileViewProp) => {
  useEffect(() => {
    //Quick fix for incorrect initial width of the List component
    window.dispatchEvent(new Event("resize"));
  }, []);

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

    return (
      <Tile
        role="listitem"
        key={item.key}
        title={item.fullname}
        aria-posinset={item.key}
        selection={props.selection}
        selectionIndex={itemIndex}
        isSelectable={true}
        invokeSelection={true}
        foreground={
          <FileItemIcon
            isFolder={item.filetype === "folder"}
            isCheckedOut={item.ischeckedout == 1}
            isSharedLocation={item.isSharedLocation}
            extension={item.filetype}
            size={props.tileSize}
            className={`tileIcon ${props.tileSize}`}
          />
        }
        showForegroundFrame={true}
        itemName={item.fullname}
        itemActivity={item.modified}
        tileSize={props.tileSize}
        onClick={() => props.openFileItem(item)}
      />
    );
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
