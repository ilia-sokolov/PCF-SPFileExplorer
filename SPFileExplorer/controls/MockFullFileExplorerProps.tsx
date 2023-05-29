import { IFileSystemItem } from "./IFileSystemItem";
import { IFileViewColumn } from "./IFileViewColumn";
import { IFolder } from "./IFolder";
import { IFullFileExplorerProps } from "./IFullFileExplorerProps";

const MOCK_SHAREPOINT_URL = "https://mock.sharepoint.com/documents";

const mockFileStructure: any = {
  name: "Documents on SharePoint Site",
  path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52`,
  key: "9307182d-e6e8-4202-3333-000000000000",
  children: [
    {
      name: "Contracts",
      path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Contracts`,
      key: "9307182d-e6e8-4202-3333-000000000001",
      modified: "07/09/2023 01:20 PM",
      sharepointmodifiedby: "Aaron Reid",

      children: [
        {
          name: "Long-term Contracts",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Contracts/Long-term Contracts`,
          key: "9307182d-e6e8-4202-3333-000000000002",
          modified: "07/09/2023 01:20 PM",
          sharepointmodifiedby: "Annie Lindqvist",
          children: [
            {
              name: "Contoso Frame Agreement 2022.pdf",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Contracts/LongTermContracts/Contoso Frame Agreement 2022.pdf`,
              key: "9307182d-e6e8-4202-3333-000000000003",
              modified: "07/09/2023 01:20 PM",
              sharepointmodifiedby: "Annie Lindqvist",
            },
          ],
        },
        {
          name: "AdventureWorks - Bilateral agreement 2021.pdf",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Contracts/AdventureWorks - Bilateral agreement 2021.pdf`,
          key: "9307182d-e6e8-4202-3333-000000000004",
          modified: "10/10/2022 12:02 PM",
          sharepointmodifiedby: "Roko Kolar",
        },
      ],
    },
    {
      name: "Projects",
      key: "9307182d-e6e8-4202-3333-000000000005",
      path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects`,
      modified: "01/10/2023 01:20 PM",
      sharepointmodifiedby: "Annie Lindqvist",
      children: [
        {
          name: "Digital Transformation",
          key: "9307182d-e6e8-4202-3333-000000000006",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation`,
          modified: "01/10/2023 01:20 PM",
          sharepointmodifiedby: "Annie Lindqvist",
          children: [
            {
              name: "Preliminary Analysis.docx",
              key: "9307182d-e6e8-4202-3333-000000000007",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Preliminary Analysis.docx`,
              modified: "09/09/2022 02:25 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Initial Estimation.xlsx",
              key: "9307182d-e6e8-4202-3333-000000000008",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Initial Estimation.xlsx`,
              modified: "10/09/2022 12:20 AM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Requirements Matrix.xlsx",
              key: "9307182d-e6e8-4202-3333-000000000009",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Requirements Matrix.xlsx`,
              modified: "14/09/2022 02:51 PM",
              sharepointmodifiedby: "Annie Lindqvist",
            },
            {
              name: "Security Risks Evaluation.docx",
              key: "9307182d-e6e8-4202-3333-000000000010",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Security Risks Evaluation.docx`,
              modified: "21/09/2022 03:20 PM",
              sharepointmodifiedby: "Annie Lindqvist",
            },
            {
              name: "Phase 1 - Statement of Work.docx",
              key: "9307182d-e6e8-4202-3333-000000000011",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Phase 1 - Statement of Work.docx`,
              modified: "01/10/2022 01:20 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Testing Plan.pdf",
              key: "9307182d-e6e8-4202-3333-000000000012",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Testing Plan.pdf`,
              modified: "04/10/2022 01:32 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Technical Specification.pdf",
              key: "9307182d-e6e8-4202-3333-000000000013",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Technical Specification.pdf`,
              modified: "19/10/2022 03:47 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Risks Analysis.docx",
              key: "9307182d-e6e8-4202-3333-000000000014",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Risks Analysis.docx`,
              modified: "12/11/2022 11:28 AM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Requirement Specification.xlsx",
              key: "9307182d-e6e8-4202-3333-000000000015",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Digital Transformation/Requirement Specification.xlsx`,
              modified: "01/10/2023 01:20 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
          ],
        },
        {
          name: "Migration",
          key: "9307182d-e6e8-4202-3333-000000000016",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Migration`,
          modified: "09/09/2022 05:20 PM",
          sharepointmodifiedby: "Annie Lindqvist",
          children: [
            {
              name: "Requirement Specification.docx",
              key: "9307182d-e6e8-4202-3333-000000000017",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Migration/Requirement Specification.docx`,
              modified: "01/18/2022 03:19 PM",
              sharepointmodifiedby: "Annie Lindqvist",
            },
            {
              name: "Initial Estimation.xlsx",
              key: "9307182d-e6e8-4202-3333-000000000018",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Migration/Initial Estimation.xlsx`,
              modified: "03/11/2022 09:07 AM",
              sharepointmodifiedby: "Aaron Reid",
            },
            {
              name: "Testing Plan (draft).pdf",
              key: "9307182d-e6e8-4202-3333-000000000019",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Projects/Migration/Testing Plan (draft).pdf`,
              modified: "09/09/2022 05:20 PM",
              ischeckedout: true,
              sharepointmodifiedby: "Annie Lindqvist",
            },
          ],
        },
      ],
    },
    {
      name: "Memos",
      key: "9307182d-e6e8-4202-3333-000000000020",
      path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Memos`,
      modified: "06/06/2023 02:11 PM",
      sharepointmodifiedby: "Aaron Reid",
      children: [
        {
          name: "20220110 - Memo.docx",
          key: "9307182d-e6e8-4202-3333-000000000021",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Memos/20220110 - Memo.docx`,
          modified: "01/10/2022 10:05 AM",
          sharepointmodifiedby: "Aaron Reid",
        },
        {
          name: "20230606 - Memo.docx",
          key: "9307182d-e6e8-4202-3333-000000000022",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Memos/20230606 - Memo.docx`,
          modified: "06/06/2023 02:11 PM",
          sharepointmodifiedby: "Aaron Reid",
        },
      ],
    },
    {
      name: "Reports",
      key: "9307182d-e6e8-4202-3333-000000000023",
      path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports`,
      modified: "03/08/2023 01:05 PM",
      sharepointmodifiedby: "Annie Lindqvist",
      children: [
        {
          name: "2021",
          key: "9307182d-e6e8-4202-3333-000000000024",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2021`,
          modified: "05/07/2021 09:34 AM",
          sharepointmodifiedby: "Roko Kolar",
          children: [
            {
              name: "Turnover 2021 (Final).pptx",
              key: "9307182d-e6e8-4202-3333-000000000025",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2021/Turnover 2021 (Final).pptx`,
              modified: "01/02/2021 06:41 PM",
              sharepointmodifiedby: "Roko Kolar",
            },
            {
              name: "Financial 2021.xlsx",
              key: "9307182d-e6e8-4202-3333-000000000026",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2021/Financial 2021.xlsx`,
              modified: "05/07/2021 09:34 AM",
              sharepointmodifiedby: "Annie Lindqvist",
            },
          ],
        },
        {
          name: "2022",
          key: "9307182d-e6e8-4202-3333-000000000027",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2022`,
          modified: "11/11/2022 04:21 PM",
          sharepointmodifiedby: "Annie Lindqvist",
          children: [
            {
              name: "Audit Q3 2022 (Final).pptx",
              key: "9307182d-e6e8-4202-3333-000000000028",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2022/Audit Q3 2022 (Final).pptx`,
              sharepointmodifiedby: "Annie Lindqvist",
              modified: "07/11/2022 11:45 AM",
            },
            {
              name: "Financial 2022 (Draft).xlsx",
              key: "9307182d-e6e8-4202-3333-000000000029",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2022/Financial 2022 (Draft).xlsx`,
              sharepointmodifiedby: "Annie Lindqvist",
              modified: "11/11/2022 04:21 PM",
              ischeckedout: true,
            },
          ],
        },
        {
          name: "2023",
          key: "9307182d-e6e8-4202-3333-000000000030",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2023`,
          modified: "03/08/2023 01:05 PM",
          sharepointmodifiedby: "Annie Lindqvist",
          children: [
            {
              name: "Financial 2023.pptx",
              key: "9307182d-e6e8-4202-3333-000000000031",
              path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Reports/2023/Financial 2023.pptx`,
              modified: "03/08/2023 01:05 PM",
              sharepointmodifiedby: "Aaron Reid",
            },
          ],
        },
      ],
    },
    {
      name: "Pictures",
      key: "9307182d-e6e8-4202-3333-000000000032",
      path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures`,
      modified: "02/05/2022 10:05 PM",
      sharepointmodifiedby: "Annie Lindqvist",
      children: [
        {
          name: "20221001_182000.png",
          key: "9307182d-e6e8-4202-3333-000000000033",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221001_182000.png`,
          modified: "10/01/2022 06:20 PM",
          sharepointmodifiedby: "Aaron Reid",
        },
        {
          name: "20221001_182400.png",
          key: "9307182d-e6e8-4202-3333-000000000034",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221001_182400.png`,
          modified: "10/01/2022 06:24 PM",
          sharepointmodifiedby: "Annie Lindqvist",
        },
        {
          name: "20221001_182800.png",
          key: "9307182d-e6e8-4202-3333-000000000035",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221001_182800.png`,
          modified: "10/01/2022 06:28 PM",
          sharepointmodifiedby: "Roko Kolar",
        },
        {
          name: "20221001_200200.png",
          key: "9307182d-e6e8-4202-3333-000000000036",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221001_200200.png`,
          modified: "10/01/2022 08:02 PM",
          sharepointmodifiedby: "Roko Kolar",
        },
        {
          name: "20221102_133432.png",
          key: "9307182d-e6e8-4202-3333-000000000037",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221102_133432.png`,
          modified: "11/02/2022 01:34 PM",
          sharepointmodifiedby: "Annie Lindqvist",
        },
        {
          name: "20221102_145332.png",
          key: "9307182d-e6e8-4202-3333-000000000038",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221102_145332.png`,
          modified: "11/02/2022 02:53 PM",
          sharepointmodifiedby: "Annie Lindqvist",
        },
        {
          name: "20221102_161502.png",
          key: "9307182d-e6e8-4202-3333-000000000039",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20221102_161502.png`,
          modified: "11/02/2022 04:15 PM",
          sharepointmodifiedby: "Aaron Reid",
        },
        {
          name: "20220205_191302.png",
          key: "9307182d-e6e8-4202-3333-000000000040",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20220205_191302.png`,
          modified: "02/05/2022 07:13 PM",
          sharepointmodifiedby: "Roko Kolar",
        },
        {
          name: "20220205_193004.png",
          key: "9307182d-e6e8-4202-3333-000000000041",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20220205_193004.png`,
          modified: "02/05/2022 07:30 PM",
          sharepointmodifiedby: "Roko Kolar",
        },
        {
          name: "20220205_202104.png",
          key: "9307182d-e6e8-4202-3333-000000000042",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20220205_202104.png`,
          modified: "02/05/2022 09:15 PM",
          sharepointmodifiedby: "Annie Lindqvist",
        },
        {
          name: "20220205_211504.mp4",
          key: "9307182d-e6e8-4202-3333-000000000043",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20220205_211504.mp4`,
          modified: "02/05/2022 09:15 PM",
          sharepointmodifiedby: "Aaron Reid",
        },
        {
          name: "20220205_220504.mp4",
          key: "9307182d-e6e8-4202-3333-000000000044",
          path: `${MOCK_SHAREPOINT_URL}/Account_4FA38AE04D0EEA11A813000D3A1BBD52/Pictures/20220205_220504.mp4`,
          modified: "02/05/2022 10:05 PM",
          sharepointmodifiedby: "Aaron Reid",
        },
      ],
    },
  ],
};

const mockColumns: IFileViewColumn[] = [
  {
    name: "fullname",
    displayName: "Name",
    isPrimary: true,
    renderIcon: true,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
  {
    name: "modified",
    displayName: "Modified",
    isPrimary: false,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
  {
    name: "sharepointmodifiedby",
    displayName: "Modified by",
    isPrimary: false,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
  {
    name: "locationname",
    displayName: "Location",
    isPrimary: false,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
  {
    name: "relativelocation",
    displayName: "Path",
    isPrimary: false,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
  {
    name: "servicetype",
    displayName: "Source",
    isPrimary: false,
    isSortable: true,
    isSorted: false,
    isSortedDescending: false,
  },
];

const getFolderFromMock: (mockItem: any) => IFolder = (mockItem: any) => {
  const folder: IFolder = {
    key: mockItem.key,
    name: mockItem.name,
    path: mockItem.path,
    children: mockItem.children
      ?.filter((m: any) => m.name.indexOf(".") < 0)
      .map((m: any) => getFolderFromMock(m)),
  };
  return folder;
};

const findFolderRecursively: (mockItem: any, path: string) => any = (
  mockItem: any,
  path: string
): any => {
  let matchItem: any = null;
  if (mockItem.path == path) {
    matchItem = mockItem;
  } else {
    mockItem.children?.forEach((m: any) => {
      const matchChildren = findFolderRecursively(m, path);
      if (matchChildren && !matchItem) {
        matchItem = matchChildren;
      }
    });
  }

  return matchItem;
};

let refreshMockComponent: () => void;
let sortColumn: string | null = null;
let isSorAscending: boolean | null = null;

const getFolderContent: (path: string) => IFileSystemItem[] = (
  path: string
): IFileSystemItem[] => {
  const folder = findFolderRecursively(mockFileStructure, path);
  return folder
    ? folder.children
        .map((m: any) => {
          return {
            id: m.key,
            fullname: m.name,
            key: m.key,
            modified: m.modified,
            locationname: mockFileStructure.name,
            servicetype: "SharePoint",
            path: m.path,
            sharepointmodifiedby: m.sharepointmodifiedby,
            relativelocation: m.path.replace(`${MOCK_SHAREPOINT_URL}/`, ""),
            filetype:
              m.name.indexOf(".") < 0 ? "folder" : m.name.split(".").pop(),
            reference: m.key,
          };
        })
        .sort((a: any, b: any) => {
          let result = 0;
          if (sortColumn) {
            result =
              a[sortColumn] < b[sortColumn]
                ? -1
                : a[sortColumn] > b[sortColumn]
                ? 1
                : 0;
            if (!isSorAscending && isSorAscending != null) {
              result = -1 * result;
            }
          }
          return result;
        })
    : [];
};

const mockFullFileExplorerProps: IFullFileExplorerProps = {
  columns: mockColumns,
  currentFolderPath: mockFileStructure.path,
  selectedRecordsKeys: [],
  currentFolderContent: getFolderContent(mockFileStructure.path),
  getFolderStructure: function (): Promise<IFolder> {
    return new Promise<IFolder>((resolve) => {
      resolve(getFolderFromMock(mockFileStructure));
    });
  },
  setCurrentFolder: function (path: string): void {
    mockFullFileExplorerProps.currentFolderPath = path;
    mockFullFileExplorerProps.currentFolderContent = getFolderContent(path);
    if (refreshMockComponent) {
      refreshMockComponent();
    }
  },
  selectRecords: function (ids: string[]): void {
    mockFullFileExplorerProps.selectedRecordsKeys = ids;
  },

  openRecord: function (id: string): void {
    const record = mockFullFileExplorerProps.currentFolderContent.find(
      (m) => m.id === id
    );
    if (record) {
      if (record.filetype == "folder") {
        mockFullFileExplorerProps.setCurrentFolder(record.path);
      } else {
        alert(`File ${record.fullname} has been opened`);
      }
    }
  },

  setSorting: function (column: string, ascending: boolean): void {
    sortColumn = column;
    isSorAscending = ascending;

    mockFullFileExplorerProps.setCurrentFolder(
      mockFullFileExplorerProps.currentFolderPath
    );
  },
};

/**
 * Function that initializes mock properties of the full file explorer control.
 */
export const initMockFullFileExplorerProps = (
  refreshComponent: () => void
): IFullFileExplorerProps => {
  refreshMockComponent = refreshComponent;
  return mockFullFileExplorerProps;
};
