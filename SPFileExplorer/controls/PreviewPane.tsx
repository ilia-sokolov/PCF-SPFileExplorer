import * as React from "react";
import { IconButton } from "@fluentui/react/lib/Button";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react/lib/CommandBar";
import { IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { IFileSystemItem } from "./IFileSystemItem";
import { ItemThumbnail } from "./ItemThumbnail";
import { IStrings } from "./Strings";

export interface IPreviewPaneProps {
  /**
   * Item to preview; a hint is shown if not specified.
   */
  item?: IFileSystemItem;
  /**
   * URL of the preview image of the item.
   */
  imageUrl?: string;
  /**
   * URL of the full preview (Office for the web), shown in a frame instead of the preview image.
   */
  fullPreviewUrl?: string;
  /**
   * Actions of the item, shown in a command bar below the preview.
   */
  actions: IContextualMenuItem[];
  strings: IStrings;
  onClose: () => void;
}

/**
 * Pane that shows a preview of the selected item over its full height, with the actions of the item below.
 */
export const PreviewPane = (props: IPreviewPaneProps) => {
  const { item, strings } = props;
  // The pane is narrow, so the actions are shown as icons with their names as tooltips.
  const commands: ICommandBarItemProps[] = props.actions.map((action) => ({
    key: action.key,
    text: action.text,
    title: action.text,
    ariaLabel: action.text,
    iconOnly: true,
    iconProps: action.iconProps,
    onClick: () => {
      action.onClick?.();
    },
  }));
  return (
    <div className="previewPane" role="complementary" aria-label={strings.Preview}>
      <div className="previewHeader">
        <span className="previewTitle" title={item?.fullname}>
          {item ? item.fullname : strings.Preview}
        </span>
        <IconButton
          iconProps={{ iconName: "Cancel" }}
          title={strings.Close}
          ariaLabel={strings.Close}
          onClick={props.onClose}
        />
      </div>
      {!item ? (
        <div className="previewHint">{strings.SelectFileToPreview}</div>
      ) : (
        <>
          <div className="previewContent">
            {props.fullPreviewUrl ? (
              <iframe
                // A new frame for each file, so that the previous document is not shown while loading.
                key={props.fullPreviewUrl}
                className="previewFrame"
                src={props.fullPreviewUrl}
                title={item.fullname}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            ) : (
              <div className="previewImage">
                <ItemThumbnail
                  url={props.imageUrl}
                  className="large"
                  iconProps={{
                    isFolder: item.filetype === "folder",
                    extension: item.filetype,
                    size: "large",
                    className: "tileIcon large",
                    strings,
                  }}
                />
              </div>
            )}
          </div>
          {commands.length > 0 && (
            <CommandBar
              className="previewCommands"
              items={commands}
              ariaLabel={strings.FileActions}
              overflowButtonProps={{ ariaLabel: strings.MoreActions, title: strings.MoreActions }}
            />
          )}
        </>
      )}
    </div>
  );
};
