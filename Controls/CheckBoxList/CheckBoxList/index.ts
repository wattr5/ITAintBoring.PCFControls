/*
css source for onoff switch: https://proto.io/freebies/onoff/
*/

import {IInputs, IOutputs} from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
type DataSet = ComponentFramework.PropertyTypes.DataSet;
// Define const here
const RowRecordId:string = "rowRecId";
// Style name of Load More Button
const LoadMoreButton_Hidden_Style = "LoadMoreButton_Hidden_Style";
export class CheckBoxList implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    // Cached context object for the latest updateView
    private contextObj: ComponentFramework.Context<IInputs>;
    // Div element created as part of this control's main container
    private mainContainer: HTMLDivElement;
    // Table element created as part of this control's table
    private dataTable: HTMLTableElement;
    // Button element created as part of this control
    private loadPageButton: HTMLButtonElement;
	
	private optionsMapping: string;
	private yesOption: string | null;
	private noOption: string | null;
	
    private gridEntityName: string;
    /**
     * Empty constructor.
     */
    constructor() {
    }
    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If control is marked control-type='standard', it receives an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		
		
        this.contextObj = context;
        // Need to track container resize so that control could get the available width. The available height won't be provided even this is true
        context.mode.trackContainerResize(true);
        // Create main table container div. 
        this.mainContainer = document.createElement("div");
        this.mainContainer.classList.add("SimpleTable_MainContainer_Style");
        // Create data table container div. 
        this.dataTable = document.createElement("table");
        this.dataTable.classList.add("SimpleTable_Table_Style");
		
        // Create data table container div. 
		/*
        this.loadPageButton = document.createElement("button");
        this.loadPageButton.setAttribute("type", "button");
        this.loadPageButton.innerText = context.resources.getString("PCF_TSTableGrid_LoadMore_ButtonLabel");
        this.loadPageButton.classList.add(LoadMoreButton_Hidden_Style);
        this.loadPageButton.classList.add("LoadMoreButton_Style");
		*/
        //this.loadPageButton.addEventListener("click", this.onLoadMoreButtonClick.bind(this));
        // Adding the main table and loadNextPage button created to the container DIV.
        this.mainContainer.appendChild(this.dataTable);
        //this.mainContainer.appendChild(this.loadPageButton);
        container.appendChild(this.mainContainer);
		
		this.ResetOptionMappings(context);
    }
	
	private ResetOptionMappings(context: ComponentFramework.Context<IInputs>)
	{
		this.optionsMapping = context.parameters.optionsMapping.raw;
		var regEx = new RegExp("True:(.+?);");
		var match = regEx.exec(this.optionsMapping);
		this.yesOption = (match != null && match.length > 1) ? match[1] : "True";
		regEx = new RegExp("False:(.+?);");
		match = regEx.exec(this.optionsMapping);
		this.noOption = (match != null && match.length > 1) ? match[1] : "False";
	}
    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.contextObj = context;
		this.ResetOptionMappings(context);
        //this.toggleLoadMoreButtonWhenNeeded(context.parameters.tableGrid);
        if (!context.parameters.tableGrid.loading) {
            // Get sorted columns on View
            let columnsOnView = this.getSortedColumnsOnView(context);
            if (!columnsOnView || columnsOnView.length === 0) {
                return;
            }
            let columnWidthDistribution = this.getColumnWidthDistribution(context, columnsOnView);
            while (this.dataTable.firstChild) {
                this.dataTable.removeChild(this.dataTable.firstChild);
            }
            this.dataTable.appendChild(this.createTableHeader(columnsOnView, columnWidthDistribution));
            this.dataTable.appendChild(this.createTableBody(columnsOnView, columnWidthDistribution, context.parameters.tableGrid));
            this.dataTable.parentElement!.style.height = window.innerHeight - this.dataTable.offsetTop - 70 + "px";
        }
    }
    /** 
     * It is called by the framework prior to a control receiving new data. 
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }
    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. canceling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
    }
    /**
     * Get sorted columns on view
     * @param context 
     * @return sorted columns object on View
     */
    private getSortedColumnsOnView(context: ComponentFramework.Context<IInputs>): DataSetInterfaces.Column[] {
        if (!context.parameters.tableGrid.columns) {
            return [];
        }
        let columns = context.parameters.tableGrid.columns
            .filter(function (columnItem: DataSetInterfaces.Column) {
                // some column are supplementary and their order is not > 0
                return columnItem.order >= 0
            }
            );
        // Sort those columns so that they will be rendered in order
        columns.sort(function (a: DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
            return a.order - b.order;
        });
        return columns;
    }
    /**
     * Get column width distribution
     * @param context context object of this cycle
     * @param columnsOnView columns array on the configured view
     * @returns column width distribution
     */
    private getColumnWidthDistribution(context: ComponentFramework.Context<IInputs>, columnsOnView: DataSetInterfaces.Column[]): string[] {
        let widthDistribution: string[] = [];
        // Considering need to remove border & padding length
        let totalWidth: number = context.mode.allocatedWidth - 250;
        let widthSum = 0;
        columnsOnView.forEach(function (columnItem) {
            widthSum += columnItem.visualSizeFactor;
        });
        let remainWidth: number = totalWidth;
        columnsOnView.forEach(function (item, index) {
            let widthPerCell = "";
            if (index !== columnsOnView.length - 1) {
                let cellWidth = Math.round((item.visualSizeFactor / widthSum) * totalWidth);
                remainWidth = remainWidth - cellWidth;
                widthPerCell = cellWidth + "px";
            }
            else {
                widthPerCell = remainWidth + "px";
            }
            widthDistribution.push(widthPerCell);
        });
        return widthDistribution;
    }
    private createTableHeader(columnsOnView: DataSetInterfaces.Column[], widthDistribution: string[]): HTMLTableSectionElement {
        let tableHeader: HTMLTableSectionElement = document.createElement("thead");
        let tableHeaderRow: HTMLTableRowElement = document.createElement("tr");
        tableHeaderRow.classList.add("SimpleTable_TableRow_Style");
        columnsOnView.forEach(function (columnItem, index) {
            let tableHeaderCell = document.createElement("th");
            tableHeaderCell.classList.add("SimpleTable_TableHeader_Style");
            let innerDiv = document.createElement("div");
            innerDiv.classList.add("SimpleTable_TableCellInnerDiv_Style");
            innerDiv.style.maxWidth = widthDistribution[index];
            innerDiv.innerText = columnItem.displayName;
            tableHeaderCell.appendChild(innerDiv);
            tableHeaderRow.appendChild(tableHeaderCell);
        });
        tableHeader.appendChild(tableHeaderRow);
        return tableHeader;
    }
	
	private GetValue(optionValue: string | null)
	{
		  if(optionValue == "True") return true;
		  if(optionValue == "False") return false;
		  else return optionValue;
	}
	
    private createTableBody(columnsOnView: DataSetInterfaces.Column[], widthDistribution: string[], gridParam: DataSet): HTMLTableSectionElement {
        let tableBody: HTMLTableSectionElement = document.createElement("tbody");
        this.gridEntityName = gridParam.getTargetEntityType();
        if (gridParam.sortedRecordIds.length > 0) {

            for (let currentRecordId of gridParam.sortedRecordIds) {
                let tableRecordRow: HTMLTableRowElement = document.createElement("tr");
                tableRecordRow.classList.add("SimpleTable_TableRow_Style");
                let component = this;
                tableRecordRow.addEventListener("dblclick", this.onRowClick.bind(this));
                // Set the recordId on the row dom
                tableRecordRow.setAttribute(RowRecordId, gridParam.records[currentRecordId].getRecordId());
                columnsOnView.forEach(function (columnItem, index) {
                    let tableRecordCell = document.createElement("td");
                    tableRecordCell.classList.add("SimpleTable_TableCell_Style");
                    if (index == 0) {

                        let innerDiv = document.createElement("div");
                        innerDiv.classList.add("SimpleTable_TableCellInnerDiv_Style");
                        innerDiv.style.maxWidth = widthDistribution[index];
                        innerDiv.innerText = gridParam.records[currentRecordId].getFormattedValue(columnItem.name);
                        tableRecordCell.appendChild(innerDiv);

                    }
                    else {
                        let innerDiv = document.createElement("div");
                        innerDiv.classList.add("onoffswitch");
                        innerDiv.style.maxWidth = widthDistribution[index];
                        let innerCheckbox = document.createElement("input");
                        innerCheckbox.id = "checkbox" + currentRecordId;
                        innerCheckbox.setAttribute("type", "checkbox");
                        innerCheckbox.setAttribute("name", "checkbox" + currentRecordId);
                        innerCheckbox.classList.add("onoffswitch-checkbox");
                        innerCheckbox.checked = gridParam.records[currentRecordId].getValue(columnItem.name) == component.GetValue(component.yesOption);
                        innerDiv.appendChild(innerCheckbox);
                        let innerLabel: HTMLLabelElement = document.createElement("label");
                        innerLabel.classList.add("onoffswitch-label");
                        innerLabel.setAttribute("for", innerCheckbox.id);
                        innerLabel.setAttribute(RowRecordId, currentRecordId);
                        innerLabel.setAttribute("attributeName", columnItem.name);
                        innerDiv.appendChild(innerLabel);
                        let innerSpan = document.createElement("span");
                        innerSpan.classList.add("onoffswitch-inner");
                        innerLabel.appendChild(innerSpan);
                        let innerSpan1 = document.createElement("span");
                        innerSpan1.classList.add("onoffswitch-switch");
                        innerLabel.appendChild(innerSpan1);

                        tableRecordCell.appendChild(innerDiv);
                        innerLabel.addEventListener("click", component.onLabelClick.bind(component));
                    }
                    /*
                        <div class="onoffswitch">
                        <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="myonoffswitch" checked>
                        <label class="onoffswitch-label" for="myonoffswitch">
                            <span class="onoffswitch-inner"></span>
                            <span class="onoffswitch-switch"></span>
                        </label>
                    </div>
                    */


                    tableRecordRow.appendChild(tableRecordCell);
                });
                tableBody.appendChild(tableRecordRow);
            }
        }
        else {
            let tableRecordRow: HTMLTableRowElement = document.createElement("tr");
            let tableRecordCell: HTMLTableCellElement = document.createElement("td");
            tableRecordCell.classList.add("No_Record_Style");
            tableRecordCell.colSpan = columnsOnView.length;
            tableRecordCell.innerText = this.contextObj.resources.getString("PCF_TSTableGrid_No_Record_Found");
            tableRecordRow.appendChild(tableRecordCell)
            tableBody.appendChild(tableRecordRow);
        }
        return tableBody;
    }

    /**
     * Row Click Event handler for the associated row when being clicked
     * @param event
     */
    private onLabelClick(event: Event): void {
        let rowRecordId = (event.currentTarget as HTMLLabelElement).getAttribute(RowRecordId);
        if (rowRecordId) {
            let attributeName = (event.currentTarget as HTMLLabelElement).getAttribute("attributeName");
            if (attributeName) {
                var data: any = {};
                let checkBox: HTMLInputElement = <HTMLInputElement>document.getElementById("checkbox" + rowRecordId);
                data[attributeName] = (checkBox.checked == true) ? this.GetValue(this.noOption) : this.GetValue(this.yesOption); //in the onclick it's still the old value which is being switched
                this.contextObj.webAPI.updateRecord(this.gridEntityName, rowRecordId, data);
            }
        }
    }
    /**
     * Row Click Event handler for the associated row when being clicked
     * @param event
     */
    private onRowClick(event: Event): void {
        let rowRecordId = (event.currentTarget as HTMLTableRowElement).getAttribute(RowRecordId);
        if (rowRecordId) {
            let entityReference = this.contextObj.parameters.tableGrid.records[rowRecordId].getNamedReference();
            let entityFormOptions = {
                entityName: entityReference.entityType!,
                entityId: entityReference.id,
            }
            this.contextObj.navigation.openForm(entityFormOptions);
        }
    }
    /**
     * Toggle 'LoadMore' button when needed
     */
    private toggleLoadMoreButtonWhenNeeded(gridParam: DataSet): void {
        if (gridParam.paging.hasNextPage && this.loadPageButton.classList.contains(LoadMoreButton_Hidden_Style)) {
            this.loadPageButton.classList.remove(LoadMoreButton_Hidden_Style);
        }
        else if (!gridParam.paging.hasNextPage && !this.loadPageButton.classList.contains(LoadMoreButton_Hidden_Style)) {
            this.loadPageButton.classList.add(LoadMoreButton_Hidden_Style);
        }
    }
    /**
     * 'LoadMore' Button Event handler when load more button clicks
     * @param event
     */
    private onLoadMoreButtonClick(event: Event): void {
        this.contextObj.parameters.tableGrid.paging.loadNextPage();
        this.toggleLoadMoreButtonWhenNeeded(this.contextObj.parameters.tableGrid);
    }
}