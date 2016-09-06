var app = new angular.module("mainApp", ["angucomplete-alt"]);

app.controller("MasterDetailController", function($scope, $http){
	//Load items into this
	$scope.listOfItems = [];

	//Load docs into this
	$scope.listOfDocuments = [];

	//Set this when user selects item from dropdown
	$scope.selectedItemId = null;

	$scope.itemSelected = function(selected) {
		if ((selected !== undefined) && (selected !== null)){
			var selectedItemSpId = selected.description;
      		//window.alert('You have selected ' + selectedItemSpId);
    		$scope.selectItemDocuments(selectedItemSpId);
		}
    };	

	//List Ids
	$scope.itemListId = null;
	$scope.documentListId = null;

	$scope.init = function(){

		//List URL
		var urlItems = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('Items')/Items?$top=5000";

		//Get items
		$http({
				method: 'GET',
				url: urlItems,
				headers: { "Accept": "application/json;odata=verbose" }
			}).success(function (data, status, headers, config) {
				$scope.listOfItems = data.d.results;
			}).error(function (data, status, headers, config) {
				alert("Keep Trying!");
			});

		//Get list ids
		$scope.getListId('Items');
	    $scope.getListId('ChangeDocuments');
	}

	$scope.getListId = function(listName){
		var urlItemList = _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('"+listName+"')";
		$http({
				method: 'GET',
				url: urlItemList,
				headers: { "Accept": "application/json;odata=verbose" }
			}).success(function (data, status, headers, config) {
				var itemData = data.d;
				//Determine id to populate
				if (listName == "Items"){
					$scope.itemListId = itemData.Id;	
				}
				else{
					$scope.documentListId = itemData.Id;	
				}				
			}).error(function (data, status, headers, config) {
				alert("Could not get reference to list.");
			});
	}

	$scope.addItem = function(){
		$scope.openModal($scope.itemListId, 'Add New Item', 'insert');
	}
	$scope.addDocument = function(){
		$scope.openModal($scope.documentListId, 'Add New Document', 'upload');	
	}

	//Get docs for item
	$scope.loadDocuments = function() {

		//get selected item id from scope
		var id = $scope.selectedItemId;

		//Get reference to the list
		var url = _spPageContextInfo.webServerRelativeUrl;
		var context = new SP.ClientContext(url);
        var oList = context.get_web().get_lists().getByTitle('ChangeDocuments');

        //Set up query for list
        var camlQuery = new SP.CamlQuery();
    	camlQuery.set_viewXml('<View><Query><Where><Eq><FieldRef Name=\'Items\' LookupId=\'TRUE\'/><Value Type=\'LookupMulti\'>' + id + '</Value></Eq></Where></Query></View>');
    	var collListItem = oList.getItems(camlQuery);        
  			
		//run the query		
		//context.load(collListItem);
		context.load(collListItem, "Include(Id, Title, DocumentType, EncodedAbsUrl, FileDirRef, FileRef, Modified)");
		context.executeQueryAsync(
			function () {
				//success
				var listItemEnumerator = collListItem.getEnumerator();
				var items = [];

				while (listItemEnumerator.moveNext()) {
					
					//build items array
					var oListItem = listItemEnumerator.get_current();

					//Format Modified Date
					var modifiedDate = oListItem.get_item('Modified');
					var fmtModified = modifiedDate.format('dd MMM yyyy, hh:ss');

					//alert(modifiedDate);

					items.push({
				        Id: oListItem.get_id(),
				        Title: oListItem.get_item('Title'),
				        DocType: oListItem.get_item('DocumentType'),
				        FileLink: oListItem.get_item('EncodedAbsUrl'),
				        Modified: fmtModified
				    });
			   	}

			   	$scope.listOfDocuments = items;

			   	//update scope
			   	$scope.$apply();

			},           
			function (sender, args)   
			{
				//failure
				alert(args.get_message());
			});		
	}
	$scope.selectItemDocuments = function (val) {
	    //$scope.selectedItemId = val.Id;
	    $scope.selectedItemId = val;
	    $scope.loadDocuments();
	}
	$scope.openModal = function (listId, windowTitle, formType){ 

		//set Url and Height based on type of modal
		var formUrl = (formType == 'insert') ? "/_layouts/15/listform.aspx?PageType=8&ListId={"+listId+"}&RootFolder=&IsDlg=1" : "/_layouts/15/Upload.aspx?List={"+listId+"}&RootFolder=&IsDlg=1";
		var height  = (formType == 'insert') ? 320 : 600;

		var options = {
            url: _spPageContextInfo.webAbsoluteUrl+formUrl,
            width: 600,
            height: height,
            allowMaximize: true,
            title: windowTitle,
            showClose: true,         
    		dialogReturnValueCallback: RefreshOnDialogClose
        };
        var dialog = SP.UI.ModalDialog.showModalDialog(options);
    }

	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () { $scope.init() });

});