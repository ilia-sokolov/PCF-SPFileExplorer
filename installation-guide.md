# How to install the control

Before you start, make sure that SharePoint integration is set up and document management is enabled for the tables where you want to use the control (see [Prerequisites](/README.md#prerequisites)).

To use the control, download [the solution](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Solution/BAMU-SharePoint-File-Explorer.zip "SharePoint File Explorer solution") and [import it into your environment](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/import-update-export-solutions "How to import solution article")

You can use the control for table views and for associated grids (on forms).

> **Tip:** The control shows whatever the view returns. Use a view whose filter does not contain the condition **Is Recursive Fetch** equals **Yes**, otherwise folders are not shown and the files of all subfolders are listed together.

## Set SharePoint File Explorer for a table view

1. Open the **Default Solution**.
   ![Open the Default Solution](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-1.png)
2. Navigate to the **SharePoint Document** table.
   ![Open SharePoint Document table](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-2.png)
3. Go to **Views**.
   ![Go to Views](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-3.png)
4. Select the view for which you want to use the control and click **Edit**.
   ![Edit view](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-4.png)
5. Click **Switch to classic** mode.
   ![Switch to classic](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-5.png)
6. In the **Common Tasks** section, click **Custom Controls**.
   ![Click Custom Controls](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-6.png)
7. In the popup, click **Add Control**.
   ![Click Add Control](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-7.png)
8. From the list, select the **SharePoint File Explorer** control and click **Add**.
   ![Select SharePoint File Explorer](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-8.png)
9. Choose **Web**, **Phone** and **Tablet** to use this control as the default for all client types. Optionally, configure the [properties of the control](/README.md#configuration) and click **OK** to submit the changes.
    ![Devices selection](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-9.png)
10. Click **Save and Close**.
    ![Click Save and Close](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-10.png)
11. Go back to the view and click **Save and Publish**.
    ![Publish view](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-11.png)

## Set SharePoint File Explorer for an associated grid
1. Open the solution that contains the form of the table that you want to adjust.
   ![Open the Default Solution](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-1.png)
2. Navigate to the table.
   ![Open table](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-12.png)
3. Go to **Forms**.
   ![Navigate to forms](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-13.png)
4. Select the form that you want to modify and click **Edit**.
   ![Open the forms](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-14.png)
5. Add a new documents subgrid (related table **Documents (Regarding)**) or select an existing one.
   ![Add subgrid](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-15.png)
6. Click on **Component** in **Components** section of the properties and click **Get more components**.
   ![Add subgrid](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-16.png)
7. In **Built by others** tab select **SharePoint File Explorer** component and click **Add**.
   ![Add subgrid](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-17.png)
8. Configure the [properties of the control](/README.md#configuration) (**Minimum Height**, **Hide folder tree**, **Default view**, **Remember selected view** and **Enable drag and drop upload (experimental)**) and click **Done**. If the control is rendered too small on the tab, increase **Minimum Height**.
   ![Add subgrid](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-18.png)
9. Click **Save and Publish**.
    ![Publish view](https://github.com/ilia-sokolov/PCF-SPFileExplorer/raw/master/Media/installation-step-19.png)