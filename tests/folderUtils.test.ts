import { strict as assert } from "node:assert";
import { test } from "node:test";
import { IFolder } from "../SPFileExplorer/controls/IFolder";
import { findFolder, getParentPaths } from "../SPFileExplorer/controls/folderUtils";

const folderTree: IFolder = {
  name: "Documents",
  key: "documents",
  path: "Documents",
  children: [
    {
      name: "Reports",
      key: "reports",
      path: "Documents/Reports",
      children: [
        {
          name: "2026",
          key: "2026",
          path: "Documents/Reports/2026",
          children: [],
        },
      ],
    },
  ],
};

test("findFolder returns a nested folder and returns undefined when missing", () => {
  assert.equal(
    findFolder(folderTree, "Documents/Reports/2026"),
    folderTree.children?.[0].children?.[0]
  );
  assert.equal(findFolder(folderTree, "Documents/Missing"), undefined);
});

test("getParentPaths returns the selected folder's root-to-leaf path", () => {
  assert.deepEqual(getParentPaths(folderTree, "Documents/Reports/2026"), [
    "Documents",
    "Documents/Reports",
    "Documents/Reports/2026",
  ]);
});

test("getParentPaths returns only the root for an empty or unknown path", () => {
  assert.deepEqual(getParentPaths(folderTree, ""), ["Documents"]);
  assert.deepEqual(getParentPaths(folderTree, "Documents/Missing"), [
    "Documents",
  ]);
});
