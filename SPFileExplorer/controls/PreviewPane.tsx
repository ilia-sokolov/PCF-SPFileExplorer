import * as React from "react";
import { ActionButton, DefaultButton, IconButton } from "@fluentui/react/lib/Button";
import { IContextualMenuItem } from "@fluentui/react/lib/ContextualMenu";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { IFileSystemItem } from "./IFileSystemItem";
import { IFileViewColumn } from "./IFileViewColumn";
import { ItemThumbnail } from "./ItemThumbnail";
import { IStrings } from "./Strings";

export interface IPreviewPaneProps {
  /**
   * Item to preview; a hint is shown if not specified.
   */
  item?: IFileSystemItem;
  /**
   * Columns of the view shown as details of the item.
   */
  columns: IFileViewColumn[];
  /**
   * URL of the preview image of the item.
   */
  imageUrl?: string;
  /**
   * URL of the full preview (Microsoft Graph), shown in a frame.
   */
  fullPreviewUrl?: string;
  /**
   * Indicates that the full preview is being loaded.
   */
  fullPreviewLoading?: boolean;
  /**
   * Shows the full preview; not specified if it is not available.
   */
  onShowFullPreview?: () => void;
  /**
   * Indicates that the user has to sign in to Microsoft 365 for previews.
   */
  signInRequired?: boolean;
  onSignIn?: () => void;
  /**
   * Actions of the item, shown as buttons.
   */
  actions: IContextualMenuItem[];
  strings: IStrings;
  onClose: () => void;
}

/**
 * Pane that shows a preview, the details and the actions of the selected item.
 */
export const PreviewPane = (props: IPreviewPaneProps) => {
  const { item, strings } = props;
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
        <div className="previewBody">
          {props.fullPreviewUrl ? (
            <iframe
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
          {props.fullPreviewLoading && <Spinner size={SpinnerSize.small} />}
          {props.onShowFullPreview && !props.fullPreviewUrl && !props.fullPreviewLoading && (
            <DefaultButton
              className="previewButton"
              text={strings.ShowFullPreview}
              onClick={props.onShowFullPreview}
            />
          )}
          {props.signInRequired && props.onSignIn && (
            <div className="previewSignIn">
              <span>{strings.SignInHint}</span>
              <DefaultButton text={strings.SignIn} onClick={props.onSignIn} />
            </div>
          )}
          <div className="previewActions">
            {props.actions.map((action) => (
              <ActionButton
                key={action.key}
                iconProps={action.iconProps}
                text={action.text}
                onClick={() => action.onClick?.()}
              />
            ))}
          </div>
          <div className="previewDetails">
            <div className="previewDetailsTitle">{strings.Details}</div>
            {props.columns
              .filter((c) => item[c.name])
              .map((c) => (
                <div className="previewDetail" key={c.name}>
                  <div className="previewDetailLabel">{c.displayName}</div>
                  <div className="previewDetailValue">{String(item[c.name])}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
