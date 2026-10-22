import * as React from "react";
import {IInputs, IOutputs} from "./generated/ManifestTypes";
import FullFileExplorer from "./controls/FullFileExplorer";
import { MockFullFileExplorer } from "./controls/MockFullFileExplorerProps";
import { ALL_ITEMS_PAGE_SIZE, initFullFileExplorerProps } from "./controls/FullFileExplorerProps";
import { getStrings, IStrings } from "./controls/Strings";

export class SPFileExplorer implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private _controlCache: {[index: string]: any} = {};
    private _strings: IStrings;
    private _lastElement: React.ReactElement = React.createElement(React.Fragment);

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(context: ComponentFramework.Context<IInputs>): void
    {
        this._strings = getStrings((key) => context.resources.getString(key));
        if(this._isSandbox()){
            context.mode.trackContainerResize(true);
        }
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement
    {
        const dataSet = context.parameters.documentsDataSet;
        if (dataSet.paging != null
            && dataSet.paging.pageSize != ALL_ITEMS_PAGE_SIZE
            && dataSet.paging.hasNextPage) {
            // All documents of the folder are loaded before the control is rendered.
            dataSet.paging.setPageSize(ALL_ITEMS_PAGE_SIZE);
            dataSet.paging.loadNextPage();
            return this._lastElement;
        }

        const style: React.CSSProperties = {
            minHeight: `${context.parameters.minHeight?.raw ? context.parameters.minHeight.raw : 350}px`,
        };

        let explorer: React.ReactElement;
        if (this._isSandbox()) {
            //Control height is set to ensure correct representation of the control
            style.overflow = "hidden";
            style.height = context.mode.allocatedHeight > 0 ? `${context.mode.allocatedHeight - 2}px` : "500px";
            explorer = React.createElement(MockFullFileExplorer, { strings: this._strings });
        } else {
            const explorerProperties = initFullFileExplorerProps(context, this._controlCache);

            // The key forces a fresh component (and folder tree) when the control is reused for another
            // record or when another document location is selected.
            const recordKey = `${(context as any).page?.entityId ?? ""}_${explorerProperties.locationKey ?? ""}`;
            explorer = React.createElement(FullFileExplorer,
                { ...explorerProperties, strings: this._strings, key: recordKey });
        }

        this._lastElement = React.createElement("div", { className: "spFileExplorerContainer", style }, explorer);
        return this._lastElement;
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs
    {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void
    {
        // The platform unmounts the React element returned by updateView.
    }

    /**
     * Mock data is used only in the local test harness (pcf-start), so that the control works
     * on every Dataverse host (sovereign clouds, custom domains, on-premises).
     */
    private _isSandbox(): boolean
    {
        const hostname = window?.location?.hostname?.toLowerCase();
        return hostname === "localhost" || hostname === "127.0.0.1";
    }
}
