import * as React from "react";
import { useState } from "react";
import { Dialog, DialogFooter, DialogType } from "@fluentui/react/lib/Dialog";
import { DefaultButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { TextField } from "@fluentui/react/lib/TextField";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { isValidFolderName } from "./FileLinks";
import { formatString, IStrings } from "./Strings";

export interface INewFolderDialogProps {
  /**
   * Name of the folder in which the new folder is created.
   */
  parentName: string;
  strings: IStrings;
  /**
   * Creates the folder. Resolves with an error message, or undefined on success.
   */
  onCreate: (name: string) => Promise<string | undefined>;
  onDismiss: () => void;
}

/**
 * Dialog that asks for the name of a new folder and creates it.
 */
export const NewFolderDialog = (props: INewFolderDialogProps) => {
  const { strings } = props;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!isValidFolderName(name)) {
      setError(strings.InvalidFolderName);
      return;
    }
    setCreating(true);
    setError(undefined);
    const result = await props.onCreate(name.trim());
    setCreating(false);
    if (result) {
      setError(result);
    } else {
      props.onDismiss();
    }
  };

  return (
    <Dialog
      hidden={false}
      onDismiss={creating ? undefined : props.onDismiss}
      dialogContentProps={{
        type: DialogType.normal,
        title: strings.NewFolder,
        subText: formatString(strings.NewFolderTitle, props.parentName),
      }}
      modalProps={{ isBlocking: true }}
    >
      <TextField
        label={strings.FolderName}
        value={name}
        autoFocus={true}
        disabled={creating}
        errorMessage={error}
        onChange={(_e, value) => {
          setName(value ?? "");
          setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !creating) {
            create();
          }
        }}
      />
      <DialogFooter>
        {creating && <Spinner size={SpinnerSize.small} />}
        <PrimaryButton
          text={strings.Create}
          disabled={creating || !name.trim()}
          onClick={create}
        />
        <DefaultButton text={strings.Cancel} disabled={creating} onClick={props.onDismiss} />
      </DialogFooter>
    </Dialog>
  );
};
