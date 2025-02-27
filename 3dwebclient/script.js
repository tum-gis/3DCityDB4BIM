/*
 * 3DCityDB-Web-Map-Client
 * http://www.3dcitydb.org/
 * 
 * Copyright 2015 - 2017
 * Chair of Geoinformatics
 * Technical University of Munich, Germany
 * https://www.gis.bgu.tum.de/
 * 
 * The 3DCityDB-Web-Map-Client is jointly developed with the following
 * cooperation partners:
 * 
 * virtualcitySYSTEMS GmbH, Berlin <http://www.virtualcitysystems.de/>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *     
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**-----------------------------------------Separate Line-------------------------------------------------**/
/**----------------------------------- added start ----------------------------------- */
import {bimRequestor} from '../ThirdParty/Study-Project/BimserverGltfRequestor.js';
let bimCityTable = null; // import bimCityTable from '../ThirdParty/Study-Project/bimCityTable.js';
import AttributeProcessor from '../ThirdParty/Study-Project/AttributeProcessor.js';
import queryMap from '../ThirdParty/Study-Project/queryMap.js';
import { insertSplashInfoHelp, getSplashWindowFromUrl } from './utils/SplashController.js';

document.addEventListener("DOMContentLoaded", function(event) {
    document.querySelector('#remove-layer-button').addEventListener('click', removeSelectedLayer);
    document.querySelector('#add-layer-button').addEventListener('click', addNewLayer);
    document.querySelector('#save-settings-button').addEventListener('click', saveLayerSettings);
    document.querySelector('#remove-imagery-button').addEventListener('click', removeImageryProvider);
    document.querySelector('#add-wms-button').addEventListener('click', addWebMapServiceProvider);
    document.querySelector('#remove-terrain-button').addEventListener('click', removeTerrainProvider);
    document.querySelector('#add-terrain-button').addEventListener('click', addTerrainProvider);
    document.querySelector('#generate-scene-button').addEventListener('click', showSceneLink);
    document.querySelector('#hide-object-button').addEventListener('click', hideSelectedObjects);
    document.querySelector('#clear-highlight-button').addEventListener('click', clearhighlight);
    document.querySelector('#show-object-button').addEventListener('click', showHiddenObjects);
    document.querySelector('#screenshot-button').addEventListener('click', createScreenshot);
    document.querySelector('#print-view-button').addEventListener('click', printCurrentview);
    document.querySelector('#shadows-button').addEventListener('click', toggleShadows);
    document.querySelector('#terrain-shadows-button').addEventListener('click', toggleTerrainShadows);
    document.querySelector('#layerDataTypeDropdown').addEventListener('change', layerDataTypeDropdownOnchange);
    document.querySelector('#citydb_showinexternalmaps').addEventListener('change', showInExternalMaps);
    
    document.querySelector('#bim-login-button').addEventListener('click', loginBimserver);
    document.querySelector('#bim-logout-button').addEventListener('click', logoutBimserver);
    document.querySelector('#bim-insert-button').addEventListener('click', insertBimModel);
    document.querySelector('#bim-query-type').addEventListener('change', changeBimQueryType);

    // came with 1.8.1
    document.querySelector('#thematicDataSourceDropdown').addEventListener('change', thematicDataSourceAndTableTypeDropdownOnchange);
    document.querySelector('#tableTypeDropdown').addEventListener('change', thematicDataSourceAndTableTypeDropdownOnchange);
    document.querySelector('#list-highlighted-button').addEventListener('mouseover', listHighlightedObjects);
    document.querySelector('#list-hidden-button').addEventListener('mouseover', listHiddenObjects);
    document.querySelector('#citydb_highlightinglist').addEventListener('change', flyToClickedObject);
    document.querySelector('#citydb_hiddenlist').addEventListener('change', flyToClickedObject);
    

});
/**----------------------------------- added end ------------------------------------- */
/*---------------------------------  set globe variables  ----------------------------------------*/
// BingMapsAPI Key for Bing Imagery Layers and Geocoder
// If this is not valid, the Bing Imagery Layers will be removed and the Bing Geocoder will be replaced with OSM Nominatim
var bingToken = CitydbUtil.parse_query_string('bingToken', window.location.href);
if (Cesium.defined(bingToken) && bingToken !== "") {
    Cesium.BingMapsApi.defaultKey = bingToken;
}

// Define clock to be animated per default
var clock = new Cesium.Clock({
    shouldAnimate: true
});

// create 3Dcitydb-web-map instance
var shadows = CitydbUtil.parse_query_string('shadows', window.location.href);
var terrainShadows = CitydbUtil.parse_query_string('terrainShadows', window.location.href);

var cesiumViewerOptions = {
    selectedImageryProviderViewModel: Cesium.createDefaultImageryProviderViewModels()[1],
    timeline: true,
    animation: true,
    fullscreenButton: false,
    shadows: (shadows == "true"),
    terrainShadows: parseInt(terrainShadows),
    clockViewModel: new Cesium.ClockViewModel(clock)
}

// If neither BingMapsAPI key nor ionToken is present, use the OpenStreetMap Geocoder Nominatim
var ionToken = CitydbUtil.parse_query_string('ionToken', window.location.href);
if (Cesium.defined(ionToken) && ionToken !== "") {
    Cesium.Ion.defaultAccessToken = ionToken;
}
if ((!Cesium.defined(Cesium.BingMapsApi.defaultKey) || Cesium.BingMapsApi.defaultKey === "")
    && (!Cesium.defined(ionToken) || ionToken === "")) {
    cesiumViewerOptions.geocoder = new OpenStreetMapNominatimGeocoder();
}

var cesiumViewer = new Cesium.Viewer('cesiumContainer', cesiumViewerOptions);

adjustIonFeatures();

navigationInitialization('cesiumContainer', cesiumViewer);

var cesiumCamera = cesiumViewer.scene.camera;
var webMap = new WebMap3DCityDB(cesiumViewer);

// set default input parameter value and bind the view and model
var addLayerViewModel = {
    url: "",
    name: "",
    layerDataType: "",
    gltfVersion: "",
    thematicDataUrl: "",
    thematicDataSource: "",
    tableType: "",
    // googleSheetsApiKey: "",
    // googleSheetsRanges: "",
    // googleSheetsClientId: "",
    cityobjectsJsonUrl: "",
    minLodPixels: "",
    maxLodPixels: "",
    maxSizeOfCachedTiles: 200,
    maxCountOfVisibleTiles: 200
};
Cesium.knockout.track(addLayerViewModel);
Cesium.knockout.applyBindings(addLayerViewModel, document.getElementById('citydb_addlayerpanel'));

var addWmsViewModel = {
    name: '',
    iconUrl: '',
    tooltip: '',
    url: '',
    layers: '',
    additionalParameters: '',
    proxyUrl: '/proxy/'
};
Cesium.knockout.track(addWmsViewModel);
Cesium.knockout.applyBindings(addWmsViewModel, document.getElementById('citydb_addwmspanel'));

var addTerrainViewModel = {
    name: '',
    iconUrl: '',
    tooltip: '',
    url: ''
};
Cesium.knockout.track(addTerrainViewModel);
Cesium.knockout.applyBindings(addTerrainViewModel, document.getElementById('citydb_addterrainpanel'));

var addSplashWindowModel = {
    url: '',
    showOnStart: ''
};
Cesium.knockout.track(addSplashWindowModel);
Cesium.knockout.applyBindings(addSplashWindowModel, document.getElementById('citydb_addsplashwindow'));

/*---------------------------------  Load Configurations and Layers  ----------------------------------------*/

intiClient();

// Store clicked entities
var clickedEntities = {};

var clockElementClicked = false;
function intiClient() {
    // adjust cesium navigation help popup for splash window
    insertSplashInfoHelp();
    // read splash window from url
    getSplashWindowFromUrl();

    // init progress indicator gif
    document.getElementById('loadingIndicator').style.display = 'none';

    // activate mouseClick Events		
    webMap.activateMouseClickEvents(true);
    webMap.activateMouseMoveEvents(true);
    webMap.activateViewChangedEvent(true);

    // add Copyrights, TUM, 3DCityDB or more...
    var creditDisplay = cesiumViewer.scene.frameState.creditDisplay;

    var citydbCreditLogo = new Cesium.Credit('<a href="https://www.3dcitydb.org/" target="_blank"><img src="https://3dcitydb.org/3dcitydb/fileadmin/public/logos/3dcitydb_logo.png" title="3DCityDB"></a>');
    creditDisplay.addDefaultCredit(citydbCreditLogo);

    var tumCreditLogo = new Cesium.Credit('<a href="https://www.gis.bgu.tum.de/en/home/" target="_blank">© 2018 Chair of Geoinformatics, TU Munich</a>');
    creditDisplay.addDefaultCredit(tumCreditLogo);

    // activate debug mode
    var debugStr = CitydbUtil.parse_query_string('debug', window.location.href);
    if (debugStr == "true") {
        cesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
        cesiumViewer.cesiumInspector.viewModel.dropDownVisible = false;
    }

    // set title of the web page
    var titleStr = CitydbUtil.parse_query_string('title', window.location.href);
    if (titleStr) {
        document.title = titleStr;
    }

    // It's an extended Geocoder widget which can also be used for searching object by its gmlid.
    cesiumViewer.geocoder.viewModel._searchCommand.beforeExecute.addEventListener(function (info) {
        var callGeocodingService = info.args[0];
        if (callGeocodingService != true) {
            var gmlId = cesiumViewer.geocoder.viewModel.searchText;
            info.cancel = true;
            cesiumViewer.geocoder.viewModel.searchText = "Searching now.......";
            zoomToObjectById(gmlId, function () {
                cesiumViewer.geocoder.viewModel.searchText = gmlId;
            }, function () {
                cesiumViewer.geocoder.viewModel.searchText = gmlId;
                cesiumViewer.geocoder.viewModel.search.call(this, true);
            });
        }
    });

    // inspect the status of the showed and cached tiles	
    inspectTileStatus();

    // display current infos of active layer in the main menu
    observeActiveLayer();

    // Zoom to desired camera position and load layers if encoded in the url...	
    zoomToDefaultCameraPosition().then(function (info) {
        var layers = getLayersFromUrl();
        loadLayerGroup(layers);

        var basemapConfigString = CitydbUtil.parse_query_string('basemap', window.location.href);
        if (basemapConfigString) {
            var viewMoModel = Cesium.queryToObject(Object.keys(Cesium.queryToObject(basemapConfigString))[0]);
            for (key in viewMoModel) {
                addWmsViewModel[key] = viewMoModel[key];
            }
            addWebMapServiceProvider();
        }
        
        var cesiumWorldTerrainString = CitydbUtil.parse_query_string('cesiumWorldTerrain', window.location.href);
        if(cesiumWorldTerrainString === "true") {
            // if the Cesium World Terrain is given in the URL --> activate, else other terrains
            cesiumViewer.terrainProvider = Cesium.createWorldTerrain();
            var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
            baseLayerPickerViewModel.selectedTerrain = baseLayerPickerViewModel.terrainProviderViewModels[1];
        } else {
            var terrainConfigString = CitydbUtil.parse_query_string('terrain', window.location.href);
            if (terrainConfigString) {
                var viewMoModel = Cesium.queryToObject(Object.keys(Cesium.queryToObject(terrainConfigString))[0]);
                for (key in viewMoModel) {
                    addTerrainViewModel[key] = viewMoModel[key];
                }
                addTerrainProvider();
            }
        }
    });

    // jump to a timepoint
    var dayTimeStr = CitydbUtil.parse_query_string('dayTime', window.location.href);
    if (dayTimeStr) {
        var julianDate = Cesium.JulianDate.fromIso8601(decodeURIComponent(dayTimeStr));
        var clock = cesiumViewer.cesiumWidget.clock;
        clock.currentTime = julianDate;
        clock.shouldAnimate = false;
    }

    // add a calendar picker in the timeline using the JS library flatpickr
    var clockElement = document.getElementsByClassName("cesium-animation-blank")[0];
    flatpickr(clockElement, {
        enableTime: true,
        defaultDate: Cesium.JulianDate.toDate(cesiumViewer.clock.currentTime),
        enableSeconds: true
    });
    clockElement.addEventListener("change", function () {
        var dateValue = clockElement.value;
        var cesiumClock = cesiumViewer.clock;
        cesiumClock.shouldAnimate = false; // stop the clock
        cesiumClock.currentTime = Cesium.JulianDate.fromIso8601(dateValue.replace(" ", "T") + "Z");
        // update timeline also
        var cesiumTimeline = cesiumViewer.timeline;
        var lowerBound = Cesium.JulianDate.addHours(cesiumViewer.clock.currentTime, -12, new Object());
        var upperBound = Cesium.JulianDate.addHours(cesiumViewer.clock.currentTime, 12, new Object());
        cesiumTimeline.updateFromClock(); // center the needle in the timeline
        cesiumViewer.timeline.zoomTo(lowerBound, upperBound);
        cesiumViewer.timeline.resize();
    });
    clockElement.addEventListener("click", function () {
        if (clockElementClicked) {
            clockElement._flatpickr.close();
        }
        clockElementClicked = !clockElementClicked;
    });

    // Bring the cesium navigation help popup above the compass
    var cesiumNavHelp = document.getElementsByClassName("cesium-navigation-help")[0];
    cesiumNavHelp.style.zIndex = 99999;

    // If the web client has a layer, add an onclick event to the home button to fly to this layer
    var cesiumHomeButton = document.getElementsByClassName("cesium-button cesium-toolbar-button cesium-home-button")[0];
    cesiumHomeButton.onclick = function () {
        zoomToDefaultCameraPosition();
    }
}

function observeActiveLayer() {
    var observable = Cesium.knockout.getObservable(webMap, '_activeLayer');

    observable.subscribe(function (selectedLayer) {
        if (Cesium.defined(selectedLayer)) {
            document.getElementById(selectedLayer.id).childNodes[0].checked = true;

            updateAddLayerViewModel(selectedLayer);
        }
    });

    function updateAddLayerViewModel(selectedLayer) {
        addLayerViewModel.url = selectedLayer.url;
        addLayerViewModel.name = selectedLayer.name;
        addLayerViewModel.layerDataType = selectedLayer.layerDataType;
        addLayerViewModel.gltfVersion = selectedLayer.gltfVersion;
        addLayerViewModel.thematicDataUrl = selectedLayer.thematicDataUrl;
        addLayerViewModel.thematicDataSource = selectedLayer.thematicDataSource;
        addLayerViewModel.tableType = selectedLayer.tableType;
        // addLayerViewModel.googleSheetsApiKey = selectedLayer.googleSheetsApiKey;
        // addLayerViewModel.googleSheetsRanges = selectedLayer.googleSheetsRanges;
        // addLayerViewModel.googleSheetsClientId = selectedLayer.googleSheetsClientId;
        addLayerViewModel.cityobjectsJsonUrl = selectedLayer.cityobjectsJsonUrl;
        addLayerViewModel.minLodPixels = selectedLayer.minLodPixels;
        addLayerViewModel.maxLodPixels = selectedLayer.maxLodPixels;
        addLayerViewModel.maxSizeOfCachedTiles = selectedLayer.maxSizeOfCachedTiles;
        addLayerViewModel.maxCountOfVisibleTiles = selectedLayer.maxCountOfVisibleTiles;
    }
}

function adjustIonFeatures() {
    // If neither BingMapsAPI key nor ion access token is present, remove Bing Maps from the Imagery Providers
    if (!Cesium.defined(Cesium.BingMapsApi.defaultKey) || Cesium.BingMapsApi.defaultKey === "") {
        var imageryProviders = cesiumViewer.baseLayerPicker.viewModel.imageryProviderViewModels;
        var i = 0;
        while (i < imageryProviders.length) {
            if (imageryProviders[i].name.indexOf("Bing Maps") !== -1) {
                //imageryProviders[i]._creationCommand.canExecute = false;
                imageryProviders.remove(imageryProviders[i]);
            } else {
                i++;
            }
        }
        console.warn("Please enter your Bing Maps API token using the URL-parameter \"bingToken=<your-token>\" and refresh the page if you wish to use Bing Maps.");

        // Set default imagery to ESRI World Imagery
        cesiumViewer.baseLayerPicker.viewModel.selectedImagery = imageryProviders[3];

        // Disable auto-complete of OSM Geocoder due to OSM usage limitations
        // see https://operations.osmfoundation.org/policies/nominatim/#unacceptable-use
        cesiumViewer._geocoder._viewModel.autoComplete = false;
    }

    // Remove Cesium World Terrain from the Terrain Providers
//        var terrainProviders = cesiumViewer.baseLayerPicker.viewModel.terrainProviderViewModels;
//        i = 0;
//        while (i < terrainProviders.length) {
//            if (terrainProviders[i].name.indexOf("Cesium World Terrain") !== -1) {
//                //terrainProviders[i]._creationCommand.canExecute = false;
//                terrainProviders.remove(terrainProviders[i]);
//            } else {
//                i++;
//            }
//        }
//        console.log("Due to invalid or missing ion access token from user, Cesium World Terrain has been removed.");

    // Set default imagery to an open-source terrain
    // cesiumViewer.baseLayerPicker.viewModel.selectedTerrain = terrainProviders[0];
    console.warn("Please enter your ion access token using the URL-parameter \"ionToken=<your-token>\" and refresh the page if you wish to use ion features.");
}

/*---------------------------------  methods and functions  ----------------------------------------*/

function inspectTileStatus() {
    setInterval(function () {
        var cachedTilesInspector = document.getElementById('citydb_cachedTilesInspector');
        var showedTilesInspector = document.getElementById('citydb_showedTilesInspector');
        var layers = webMap._layers;
        var numberOfshowedTiles = 0;
        var numberOfCachedTiles = 0;
        var numberOfTasks = 0;
        var tilesLoaded = true;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layers[i].active) {
                if (layer instanceof CitydbKmlLayer) {
                    numberOfshowedTiles = numberOfshowedTiles + Object.keys(layers[i].citydbKmlTilingManager.dataPoolKml).length;
                    numberOfCachedTiles = numberOfCachedTiles + Object.keys(layers[i].citydbKmlTilingManager.networklinkCache).length;
                    numberOfTasks = numberOfTasks + layers[i].citydbKmlTilingManager.taskNumber;
                }
                if (layer instanceof Cesium3DTilesDataLayer) {
                    numberOfshowedTiles = numberOfshowedTiles + layer._tileset._selectedTiles.length;
                    numberOfCachedTiles = numberOfCachedTiles + layer._tileset._statistics.numberContentReady;
                    tilesLoaded = layer._tileset._tilesLoaded;
                }
            }
        }
        showedTilesInspector.innerHTML = 'Number of showed Tiles: ' + numberOfshowedTiles;
        cachedTilesInspector.innerHTML = 'Number of cached Tiles: ' + numberOfCachedTiles;

        var loadingTilesInspector = document.getElementById('citydb_loadingTilesInspector');
        if (numberOfTasks > 0 || !tilesLoaded) {
            loadingTilesInspector.style.display = 'block';
        } else {
            loadingTilesInspector.style.display = 'none';
        }
    }, 200);
}

function getLayersFromUrl() {
    var index = 0;
    var nLayers = new Array();
    var layerConfigString = CitydbUtil.parse_query_string('layer_' + index, window.location.href);
    while (layerConfigString) {
        var layerConfig = Cesium.queryToObject(Object.keys(Cesium.queryToObject(layerConfigString))[0]);
        var options = {
            url: layerConfig.url,
            name: layerConfig.name,
            layerDataType: Cesium.defaultValue(layerConfig.layerDataType, "COLLADA/KML/glTF"),
            gltfVersion: Cesium.defaultValue(layerConfig.gltfVersion, "2.0"),
            thematicDataUrl: Cesium.defaultValue(layerConfig.spreadsheetUrl, ""),
            thematicDataSource: Cesium.defaultValue(layerConfig.thematicDataSource, "GoogleSheets"),
            tableType: Cesium.defaultValue(layerConfig.tableType, "Horizontal"),
            // googleSheetsApiKey: Cesium.defaultValue(layerConfig.googleSheetsApiKey, ""),
            // googleSheetsRanges: Cesium.defaultValue(layerConfig.googleSheetsRanges, ""),
            // googleSheetsClientId: Cesium.defaultValue(layerConfig.googleSheetsClientId, ""),
            cityobjectsJsonUrl: Cesium.defaultValue(layerConfig.cityobjectsJsonUrl, ""),
            active: (layerConfig.active == "true"),
            minLodPixels: Cesium.defaultValue(layerConfig.minLodPixels, 140),
            maxLodPixels: Cesium.defaultValue(layerConfig.maxLodPixels == -1 ? Number.MAX_VALUE : layerConfig.maxLodPixels, Number.MAX_VALUE),
            maxSizeOfCachedTiles: layerConfig.maxSizeOfCachedTiles,
            maxCountOfVisibleTiles: layerConfig.maxCountOfVisibleTiles
        }

        if (['kml', 'kmz', 'json', 'czml'].indexOf(CitydbUtil.get_suffix_from_filename(layerConfig.url)) > -1 && options.layerDataType === "COLLADA/KML/glTF") {
            nLayers.push(new CitydbKmlLayer(options));
        } else {
            nLayers.push(new Cesium3DTilesDataLayer(options));
        }

        index++;
        layerConfigString = CitydbUtil.parse_query_string('layer_' + index, window.location.href);
    }
    return nLayers;
}

function listHighlightedObjects() {
    var highlightingListElement = document.getElementById("citydb_highlightinglist");

    emptySelectBox(highlightingListElement, function() {
        var highlightedObjects = webMap.getAllHighlightedObjects();
        for (var i = 0; i < highlightedObjects.length; i++) {
            var option = document.createElement("option");
            option.text = highlightedObjects[i];
            highlightingListElement.add(option);
            highlightingListElement.selectedIndex = 0;
        }
    });
}

function listHiddenObjects() {
    var hidddenListElement = document.getElementById("citydb_hiddenlist");

    emptySelectBox(hidddenListElement, function() {
        var hiddenObjects = webMap.getAllHiddenObjects();
        for (var i = 0; i < hiddenObjects.length; i++) {
            var option = document.createElement("option");
            option.text = hiddenObjects[i];
            hidddenListElement.add(option);
            hidddenListElement.selectedIndex = 0;
        }
    });
}

function emptySelectBox(selectElement, callback) {
    for (var i = selectElement.length - 1; i >= 0; i--) {
        selectElement.remove(1);
    }

    callback();
}

function flyToClickedObject() { //changed: replaced parameter obj by 'this'
    // The web client stores clicked or ctrlclicked entities in a dictionary clickedEntities with {id, entity} as KVP.
    // The function flyTo from Cesium Viewer will be first employed to fly to the selected entity.
    // NOTE: This flyTo function will fail if the target entity has been unloaded (e.g. user has moved camera away).
    // In this case, the function zoomToObjectById shall be used instead.
    // NOTE: This zoomToObjectById function requires a JSON file containing the IDs and coordinates of objects.
    cesiumViewer.flyTo(clickedEntities[this.value]).then(function (result) {
        if (!result) {
            zoomToObjectById(this.value);
        }
    }).otherwise(function (error) {
        zoomToObjectById(this.value);
    });

    this.selectedIndex = 0;
}

function saveLayerSettings() {
    var activeLayer = webMap.activeLayer;
    applySaving('url', activeLayer);
    applySaving('name', activeLayer);
    applySaving('layerDataType', activeLayer);
    applySaving('gltfVersion', activeLayer);
    applySaving('thematicDataUrl', activeLayer);
    applySaving('thematicDataSource', activeLayer);
    applySaving('tableType', activeLayer);
    // applySaving('googleSheetsApiKey', activeLayer);
    // applySaving('googleSheetsRanges', activeLayer);
    // applySaving('googleSheetsClientId', activeLayer);
    applySaving('cityobjectsJsonUrl', activeLayer);
    applySaving('minLodPixels', activeLayer);
    applySaving('maxLodPixels', activeLayer);
    applySaving('maxSizeOfCachedTiles', activeLayer);
    applySaving('maxCountOfVisibleTiles', activeLayer);
    console.log(activeLayer);

    // Update Data Source
    thematicDataSourceAndTableTypeDropdownOnchange();

    // update GUI:
    var nodes = document.getElementById('citydb_layerlistpanel').childNodes;
    for (var i = 0; i < nodes.length; i += 3) {
        var layerOption = nodes[i];
        if (layerOption.id == activeLayer.id) {
            layerOption.childNodes[2].innerHTML = activeLayer.name;
        }
    }

    document.getElementById('loadingIndicator').style.display = 'block';
    var promise = activeLayer.reActivate();
    Cesium.when(promise, function (result) {
        document.getElementById('loadingIndicator').style.display = 'none';
    }, function (error) {
        CitydbUtil.showAlertWindow("OK", "Error", error.message);
        document.getElementById('loadingIndicator').style.display = 'none';
    })

    function applySaving(propertyName, activeLayer) {
        var newValue = addLayerViewModel[propertyName];
        if (propertyName === 'maxLodPixels' && newValue == -1) {
            newValue = Number.MAX_VALUE;
        }
        if (Cesium.isArray(newValue)) {
            activeLayer[propertyName] = newValue[0];
        } else {
            activeLayer[propertyName] = newValue;
        }
    }
}

function loadLayerGroup(_layers) {
    if (_layers.length == 0)
        return;

    document.getElementById('loadingIndicator').style.display = 'block';
    _loadLayer(0);

    function _loadLayer(index) {
        var promise = webMap.addLayer(_layers[index]);
        Cesium.when(promise, function (addedLayer) {
            console.log(addedLayer);
            addEventListeners(addedLayer);
            addLayerToList(addedLayer);
            if (index < (_layers.length - 1)) {
                index++;
                _loadLayer(index);
            } else {
                webMap._activeLayer = _layers[0];
                document.getElementById('loadingIndicator').style.display = 'none';

                // show/hide glTF version based on the value of Layer Data Type
                layerDataTypeDropdownOnchange();

                thematicDataSourceAndTableTypeDropdownOnchange();
            }
        }).otherwise(function (error) {
            CitydbUtil.showAlertWindow("OK", "Error", error.message);
            console.log(error.stack);
            document.getElementById('loadingIndicator').style.display = 'none';
        });
    }
}

function addLayerToList(layer) {
    var radio = document.createElement('input');
    radio.type = "radio";
    radio.name = "dummyradio";
    radio.onchange = function (event) {
        var targetRadio = event.target;
        var layerId = targetRadio.parentNode.id;
        webMap.activeLayer = webMap.getLayerbyId(layerId);
        console.log(webMap.activeLayer);
    };

    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = "id";
    checkbox.checked = layer.active;
    checkbox.onchange = function (event) {
        var checkbox = event.target;
        var layerId = checkbox.parentNode.id;
        var citydbLayer = webMap.getLayerbyId(layerId);
        if (checkbox.checked) {
            console.log("Layer " + citydbLayer.name + " is visible now!");
            citydbLayer.activate(true);
        } else {
            console.log("Layer " + citydbLayer.name + " is not visible now!");
            citydbLayer.activate(false);
        }
    };

    var label = document.createElement('label')
    label.appendChild(document.createTextNode(layer.name));

    var layerOption = document.createElement('div');
    layerOption.id = layer.id;
    layerOption.appendChild(radio);
    layerOption.appendChild(checkbox);
    layerOption.appendChild(label);

    label.ondblclick = function (event) {
        event.preventDefault();
        var layerId = event.target.parentNode.id;
        var citydbLayer = webMap.getLayerbyId(layerId);
        citydbLayer.zoomToStartPosition();
    }

    var layerlistpanel = document.getElementById("citydb_layerlistpanel")
    layerlistpanel.appendChild(layerOption);
}

function addEventListeners(layer) {

    function auxClickEventListener(object) {
        var objectId;
        var targetEntity;
        if (layer instanceof CitydbKmlLayer) {
            targetEntity = object.id;
            objectId = targetEntity.name;
        } else if (layer instanceof Cesium3DTilesDataLayer) {
            console.log(object);
            if (!(object._content instanceof Cesium.Batched3DModel3DTileContent))
                return;

            var featureArray = object._content._features;
            if (!Cesium.defined(featureArray))
                return;
            var objectId = featureArray[object._batchId].getProperty("id");
            if (!Cesium.defined(objectId))
                return;

            targetEntity = new Cesium.Entity({
                id: objectId
            });
            cesiumViewer.selectedEntity = targetEntity;
        }

        // Save this clicked object for later use (such as zooming using ID)
        clickedEntities[objectId] = targetEntity;

        return [objectId ,targetEntity];
    }

    layer.registerEventHandler("CLICK", function (object) {
        var res = auxClickEventListener(object);
        createInfoTable(res[0], res[1], layer);
    });

    layer.registerEventHandler("CTRLCLICK", function (object) {
        auxClickEventListener(object);
    });
}

function zoomToDefaultCameraPosition() {
    var deferred = Cesium.when.defer();
    var latitudeStr = CitydbUtil.parse_query_string('latitude', window.location.href);
    var longitudeStr = CitydbUtil.parse_query_string('longitude', window.location.href);
    var heightStr = CitydbUtil.parse_query_string('height', window.location.href);
    var headingStr = CitydbUtil.parse_query_string('heading', window.location.href);
    var pitchStr = CitydbUtil.parse_query_string('pitch', window.location.href);
    var rollStr = CitydbUtil.parse_query_string('roll', window.location.href);

    if (latitudeStr && longitudeStr && heightStr && headingStr && pitchStr && rollStr) {
        var cameraPostion = {
            latitude: parseFloat(latitudeStr),
            longitude: parseFloat(longitudeStr),
            height: parseFloat(heightStr),
            heading: parseFloat(headingStr),
            pitch: parseFloat(pitchStr),
            roll: parseFloat(rollStr)
        }
        return flyToCameraPosition(cameraPostion);
    } else {
        return zoomToDefaultCameraPosition_expired();
    }

    return deferred;
}

function zoomToDefaultCameraPosition_expired() {
    var deferred = Cesium.when.defer();
    var cesiumCamera = cesiumViewer.scene.camera;
    var latstr = CitydbUtil.parse_query_string('lat', window.location.href);
    var lonstr = CitydbUtil.parse_query_string('lon', window.location.href);

    if (latstr && lonstr) {
        var lat = parseFloat(latstr);
        var lon = parseFloat(lonstr);
        var range = 800;
        var heading = 6;
        var tilt = 49;
        var altitude = 40;

        var rangestr = CitydbUtil.parse_query_string('range', window.location.href);
        if (rangestr)
            range = parseFloat(rangestr);

        var headingstr = CitydbUtil.parse_query_string('heading', window.location.href);
        if (headingstr)
            heading = parseFloat(headingstr);

        var tiltstr = CitydbUtil.parse_query_string('tilt', window.location.href);
        if (tiltstr)
            tilt = parseFloat(tiltstr);

        var altitudestr = CitydbUtil.parse_query_string('altitude', window.location.href);
        if (altitudestr)
            altitude = parseFloat(altitudestr);

        var _center = Cesium.Cartesian3.fromDegrees(lon, lat);
        var _heading = Cesium.Math.toRadians(heading);
        var _pitch = Cesium.Math.toRadians(tilt - 90);
        var _range = range;
        cesiumCamera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, _range),
            orientation: {
                heading: _heading,
                pitch: _pitch,
                roll: 0
            },
            complete: function () {
                deferred.resolve("fly to the desired camera position");
            }
        });
    } else {
        // default camera postion
        deferred.resolve("fly to the default camera position");
        ;
    }
    return deferred;
}

function flyToCameraPosition(cameraPosition) {
    var deferred = Cesium.when.defer();
    var cesiumCamera = cesiumViewer.scene.camera;
    var longitude = cameraPosition.longitude;
    var latitude = cameraPosition.latitude;
    var height = cameraPosition.height;
    cesiumCamera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
            heading: Cesium.Math.toRadians(cameraPosition.heading),
            pitch: Cesium.Math.toRadians(cameraPosition.pitch),
            roll: Cesium.Math.toRadians(cameraPosition.roll)
        },
        complete: function () {
            deferred.resolve("fly to the desired camera position");
        }
    });
    return deferred;
}

// Creation of a scene link for sharing with other people..
function showSceneLink() {
    var sceneLink = generateLink();
    CitydbUtil.showAlertWindow("OK", "Scene Link", '<a href="' + sceneLink + '" style="color:#c0c0c0" target="_blank">' + sceneLink + '</a>');
}

function generateLink() {
    var cameraPosition = getCurrentCameraPostion();
    var projectLink = location.protocol + '//' + location.host + location.pathname + '?';

    var clock = cesiumViewer.cesiumWidget.clock;
    if (!clock.shouldAnimate) {
        var currentJulianDate = clock.currentTime;
        projectLink = projectLink + Cesium.objectToQuery({"dayTime": Cesium.JulianDate.toIso8601(currentJulianDate, 0)}) + '&';
    }

    projectLink = projectLink +
            'title=' + document.title +
            '&shadows=' + cesiumViewer.shadows +
            '&terrainShadows=' + (isNaN(cesiumViewer.terrainShadows) ? 0 : cesiumViewer.terrainShadows) +
            '&latitude=' + cameraPosition.latitude +
            '&longitude=' + cameraPosition.longitude +
            '&height=' + cameraPosition.height +
            '&heading=' + cameraPosition.heading +
            '&pitch=' + cameraPosition.pitch +
            '&roll=' + cameraPosition.roll +
            '&' + layersToQuery();
    var basemap = basemapToQuery();
    if (basemap != null) {
        projectLink = projectLink + '&' + basemap;
    }

    var terrain = terrainToQuery();
    if (terrain != null) {
        projectLink = projectLink + '&' + terrain;
    }

    var splashWindow = splashWindowToQuery();
    if (splashWindow != null) {
        projectLink = projectLink + '&' + splashWindow;
    }

    return projectLink;
}

function getCurrentCameraPostion() {
    var cesiumCamera = cesiumViewer.scene.camera;
    var position = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cesiumCamera.position);
    var latitude = Cesium.Math.toDegrees(position.latitude);
    var longitude = Cesium.Math.toDegrees(position.longitude);
    var height = position.height;
    var heading = Cesium.Math.toDegrees(cesiumCamera.heading);
    var pitch = Cesium.Math.toDegrees(cesiumCamera.pitch);
    var roll = Cesium.Math.toDegrees(cesiumCamera.roll);
    return {
        latitude: latitude,
        longitude: longitude,
        height: height,
        heading: heading,
        pitch: pitch,
        roll: roll
    }
}

function layersToQuery() {
    var layerGroupObject = new Object();
    var layers = webMap._layers;
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var layerConfig = {
            url: layer.url,
            name: layer.name,
            layerDataType: layer.layerDataType,
            gltfVersion: layer.gltfVersion,
            active: layer.active,
            spreadsheetUrl: layer.thematicDataUrl,
            thematicDataSource: layer.thematicDataSource,
            tableType: layer.tableType,
            // googleSheetsApiKey: layer.googleSheetsApiKey,
            // googleSheetsRanges: layer.googleSheetsRanges,
            // googleSheetsClientId: layer.googleSheetsClientId,
            cityobjectsJsonUrl: layer.cityobjectsJsonUrl,
            minLodPixels: layer.minLodPixels,
            maxLodPixels: layer.maxLodPixels == -1 ? Number.MAX_VALUE : layer.maxLodPixels,
            maxSizeOfCachedTiles: layer.maxSizeOfCachedTiles,
            maxCountOfVisibleTiles: layer.maxCountOfVisibleTiles,
        }
        layerGroupObject["layer_" + i] = Cesium.objectToQuery(layerConfig);
    }

    return Cesium.objectToQuery(layerGroupObject)
}

function basemapToQuery() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var baseLayerProviderFunc = baseLayerPickerViewModel.selectedImagery.creationCommand();
    if (baseLayerProviderFunc instanceof Cesium.WebMapServiceImageryProvider) {
        return Cesium.objectToQuery({
            basemap: Cesium.objectToQuery(addWmsViewModel)
        });
    } else {
        return null;
    }
}

function terrainToQuery() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var baseLayerProviderFunc = baseLayerPickerViewModel.selectedTerrain.creationCommand();
    if (baseLayerProviderFunc instanceof Cesium.CesiumTerrainProvider) {
        if (baseLayerPickerViewModel.selectedTerrain.name.indexOf("Cesium World Terrain") !== -1) {
            return "cesiumWorldTerrain=true";
        }
        return Cesium.objectToQuery({
            terrain: Cesium.objectToQuery(addTerrainViewModel)
        });
    } else {
        return null;
    }
}

function splashWindowToQuery() {
    if (addSplashWindowModel.url) {
        return Cesium.objectToQuery({
            splashWindow: Cesium.objectToQuery(addSplashWindowModel)
        });
    }
    return null;
}

// Clear Highlighting effect of all highlighted objects
function clearhighlight() {
    var layers = webMap._layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].active) {
            layers[i].unHighlightAllObjects();
        }
    }
    cesiumViewer.selectedEntity = undefined;
}
;

// hide the selected objects
function hideSelectedObjects() {
    var layers = webMap._layers;
    var objectIds;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].active) {
            objectIds = Object.keys(layers[i].highlightedObjects);
            layers[i].hideObjects(objectIds);
        }
    }
}
;

// show the hidden objects
function showHiddenObjects() {
    var layers = webMap._layers;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].active) {
            layers[i].showAllObjects();
        }
    }
}
;

function zoomToObjectById(gmlId, callBackFunc, errorCallbackFunc) {
    gmlId = gmlId.trim();
    var activeLayer = webMap._activeLayer;
    if (Cesium.defined(activeLayer)) {
        var cityobjectsJsonData = activeLayer.cityobjectsJsonData;
        if (!cityobjectsJsonData) {
            if (Cesium.defined(errorCallbackFunc)) {
                errorCallbackFunc.call(this);
            }
        } else {
            var obj = cityobjectsJsonData[gmlId];
        }
        if (obj) {
            var lon = (obj.envelope[0] + obj.envelope[2]) / 2.0;
            var lat = (obj.envelope[1] + obj.envelope[3]) / 2.0;
            flyToMapLocation(lat, lon, callBackFunc);
        } else {
            // TODO
            var thematicDataUrl = webMap.activeLayer.thematicDataUrl;
            webmap._activeLayer.dataSourceController.fetchData(gmlId, function (result) {
                if (!result) {
                    if (Cesium.defined(errorCallbackFunc)) {
                        errorCallbackFunc.call(this);
                    }
                } else {
                    var centroid = result["CENTROID"];
                    if (centroid) {
                        var res = centroid.match(/\(([^)]+)\)/)[1].split(",");
                        var lon = parseFloat(res[0]);
                        var lat = parseFloat(res[1]);
                        flyToMapLocation(lat, lon, callBackFunc);
                    } else {
                        if (Cesium.defined(errorCallbackFunc)) {
                            errorCallbackFunc.call(this);
                        }
                    }
                }
            }, 1000);

            // var promise = fetchDataFromGoogleFusionTable(gmlId, thematicDataUrl);
            // Cesium.when(promise, function (result) {
            //     var centroid = result["CENTROID"];
            //     if (centroid) {
            //         var res = centroid.match(/\(([^)]+)\)/)[1].split(",");
            //         var lon = parseFloat(res[0]);
            //         var lat = parseFloat(res[1]);
            //         flyToMapLocation(lat, lon, callBackFunc);
            //     } else {
            //         if (Cesium.defined(errorCallbackFunc)) {
            //             errorCallbackFunc.call(this);
            //         }
            //     }
            // }, function () {
            //     if (Cesium.defined(errorCallbackFunc)) {
            //         errorCallbackFunc.call(this);
            //     }
            // });
        }
    } else {
        if (Cesium.defined(errorCallbackFunc)) {
            errorCallbackFunc.call(this);
        }
    }
}
;

function flyToMapLocation(lat, lon, callBackFunc) {
    var cesiumWidget = webMap._cesiumViewerInstance.cesiumWidget;
    var scene = cesiumWidget.scene;
    var camera = scene.camera;
    var canvas = scene.canvas;
    var globe = scene.globe;
    var clientWidth = canvas.clientWidth;
    var clientHeight = canvas.clientHeight;
    camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000),
        complete: function () {
            var intersectedPoint = globe.pick(camera.getPickRay(new Cesium.Cartesian2(clientWidth / 2, clientHeight / 2)), scene);
            var terrainHeight = Cesium.Ellipsoid.WGS84.cartesianToCartographic(intersectedPoint).height;
            var center = Cesium.Cartesian3.fromDegrees(lon, lat, terrainHeight);
            var heading = Cesium.Math.toRadians(0);
            var pitch = Cesium.Math.toRadians(-50);
            var range = 100;
            camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
            if (Cesium.defined(callBackFunc)) {
                callBackFunc.call(this);
            }
        }
    })
}

function addNewLayer() {
    var _layers = new Array();
    var options = {
        url: addLayerViewModel.url.trim(),
        name: addLayerViewModel.name.trim(),
        layerDataType: addLayerViewModel.layerDataType.trim(),
        gltfVersion: addLayerViewModel.gltfVersion.trim(),
        thematicDataUrl: addLayerViewModel.thematicDataUrl.trim(),
        thematicDataSource: addLayerViewModel.thematicDataSource.trim(),
        tableType: addLayerViewModel.tableType.trim(),
        // googleSheetsApiKey: addLayerViewModel.googleSheetsApiKey.trim(),
        // googleSheetsRanges: addLayerViewModel.googleSheetsRanges.trim(),
        // googleSheetsClientId: addLayerViewModel.googleSheetsClientId.trim(),
        cityobjectsJsonUrl: addLayerViewModel.cityobjectsJsonUrl.trim(),
        minLodPixels: addLayerViewModel.minLodPixels,
        maxLodPixels: addLayerViewModel.maxLodPixels == -1 ? Number.MAX_VALUE : addLayerViewModel.maxLodPixels,
        maxSizeOfCachedTiles: addLayerViewModel.maxSizeOfCachedTiles,
        maxCountOfVisibleTiles: addLayerViewModel.maxCountOfVisibleTiles
    }
    
    // since Cesium 3D Tiles also require name.json in the URL, it must be checked first
    var layerDataTypeDropdown = document.getElementById("layerDataTypeDropdown");
    if (layerDataTypeDropdown.options[layerDataTypeDropdown.selectedIndex].value === 'Cesium 3D Tiles') {
        _layers.push(new Cesium3DTilesDataLayer(options));
    } else if (['kml', 'kmz', 'json', 'czml'].indexOf(CitydbUtil.get_suffix_from_filename(options.url)) > -1) {
        _layers.push(new CitydbKmlLayer(options));
    }

    loadLayerGroup(_layers);
}

function removeSelectedLayer() {
    var layer = webMap.activeLayer;
    if (Cesium.defined(layer)) {
        var layerId = layer.id;
        document.getElementById(layerId).remove();
        webMap.removeLayer(layerId);
        // update active layer of the globe webMap
        var webMapLayers = webMap._layers;
        if (webMapLayers.length > 0) {
            webMap.activeLayer = webMapLayers[0];
        } else {
            webMap.activeLayer = undefined;
        }
    }
}

function addWebMapServiceProvider() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var wmsProviderViewModel = new Cesium.ProviderViewModel({
        name: addWmsViewModel.name.trim(),
        iconUrl: addWmsViewModel.iconUrl.trim(),
        tooltip: addWmsViewModel.tooltip.trim(),
        creationFunction: function () {
            return new Cesium.WebMapServiceImageryProvider({
                url: new Cesium.Resource({url: addWmsViewModel.url.trim(), proxy: addWmsViewModel.proxyUrl.trim().length == 0 ? null : new Cesium.DefaultProxy(addWmsViewModel.proxyUrl.trim())}),
                layers: addWmsViewModel.layers.trim(),
                parameters: Cesium.queryToObject(addWmsViewModel.additionalParameters.trim())
            });
        }
    });
    baseLayerPickerViewModel.imageryProviderViewModels.push(wmsProviderViewModel);
    baseLayerPickerViewModel.selectedImagery = wmsProviderViewModel;
}

function removeImageryProvider() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var selectedImagery = baseLayerPickerViewModel.selectedImagery;
    baseLayerPickerViewModel.imageryProviderViewModels.remove(selectedImagery);
    baseLayerPickerViewModel.selectedImagery = baseLayerPickerViewModel.imageryProviderViewModels[0];
}

function addTerrainProvider() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var demProviderViewModel = new Cesium.ProviderViewModel({
        name: addTerrainViewModel.name.trim(),
        iconUrl: addTerrainViewModel.iconUrl.trim(),
        tooltip: addTerrainViewModel.tooltip.trim(),
        creationFunction: function () {
            return new Cesium.CesiumTerrainProvider({
                url: addTerrainViewModel.url.trim()
            });
        }
    })
    baseLayerPickerViewModel.terrainProviderViewModels.push(demProviderViewModel);
    baseLayerPickerViewModel.selectedTerrain = demProviderViewModel;
}

function removeTerrainProvider() {
    var baseLayerPickerViewModel = cesiumViewer.baseLayerPicker.viewModel;
    var selectedTerrain = baseLayerPickerViewModel.selectedTerrain;
    baseLayerPickerViewModel.terrainProviderViewModels.remove(selectedTerrain);
    baseLayerPickerViewModel.selectedTerrain = baseLayerPickerViewModel.terrainProviderViewModels[0];
}

// Source: https://stackoverflow.com/questions/4825683/how-do-i-create-and-read-a-value-from-cookie
function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(c_name + "="); //changed
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            var c_end = document.cookie.indexOf(";", c_start); //changed
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function setCookie(c_name, value) {
    createCookie(c_name, value);
}

function createScreenshot() {
    cesiumViewer.render();
    var imageUri = cesiumViewer.canvas.toDataURL();
    var imageWin = window.open("");
    imageWin.document.write("<html><head>" +
            "<title>" + imageUri + "</title></head><body>" +
            '<img src="' + imageUri + '"width="100%">' +
            "</body></html>");
    return imageWin;
}

function printCurrentview() {
    var imageWin = createScreenshot();
    imageWin.document.close();
    imageWin.focus();
    imageWin.print();
    imageWin.close();
}

function toggleShadows() {
    cesiumViewer.shadows = !cesiumViewer.shadows;
    if (!cesiumViewer.shadows) {
        cesiumViewer.terrainShadows = Cesium.ShadowMode.DISABLED;
    }
}

function toggleTerrainShadows() {
    if (cesiumViewer.terrainShadows == Cesium.ShadowMode.ENABLED) {
        cesiumViewer.terrainShadows = Cesium.ShadowMode.DISABLED;
    } else {
        cesiumViewer.terrainShadows = Cesium.ShadowMode.ENABLED;
        if (!cesiumViewer.shadows) {
            CitydbUtil.showAlertWindow("OK", "Switching on terrain shadows now", 'Please note that shadows for 3D models will also be switched on.',
                    function () {
                        toggleShadows();
                    });
        }
    }
}

function createInfoTable(gmlid, cesiumEntity, citydbLayer) {
    var thematicDataUrl = citydbLayer.thematicDataUrl;
    cesiumEntity.description = "Loading feature information...";

    citydbLayer.dataSourceController.fetchData(gmlid, function (kvp) {
        if (!kvp) {
            cesiumEntity.description = 'No feature information found';
        } else {
            console.log(kvp);
            var html = '<table class="cesium-infoBox-defaultTable" style="font-size:10.5pt"><tbody>';
            for (var key in kvp) {
                html += '<tr><td>' + key + '</td><td>' + kvp[key] + '</td></tr>';
            }
            html += '</tbody></table>';

            cesiumEntity.description = html;
        }
    }, 1000);

    // fetchDataFromGoogleFusionTable(gmlid, thematicDataUrl).then(function (kvp) {
    //     console.log(kvp);
    //     var html = '<table class="cesium-infoBox-defaultTable" style="font-size:10.5pt"><tbody>';
    //     for (var key in kvp) {
    //         html += '<tr><td>' + key + '</td><td>' + kvp[key] + '</td></tr>';
    //     }
    //     html += '</tbody></table>';
    //
    //     cesiumEntity.description = html;
    // }).otherwise(function (error) {
    //     cesiumEntity.description = 'No feature information found';
    // });
}

function fetchDataFromGoogleSpreadsheet(gmlid, thematicDataUrl) {
    var kvp = {};
    var deferred = Cesium.when.defer();

    var spreadsheetKey = thematicDataUrl.split("/")[5];
    var metaLink = 'https://spreadsheets.google.com/feeds/worksheets/' + spreadsheetKey + '/public/full?alt=json-in-script';

    Cesium.jsonp(metaLink).then(function (meta) {
        console.log(meta);
        var feedCellUrl = meta.feed.entry[0].link[1].href;
        feedCellUrl += '?alt=json-in-script&min-row=1&max-row=1';
        Cesium.jsonp(feedCellUrl).then(function (cellData) {
            var feedListUrl = meta.feed.entry[0].link[0].href;
            feedListUrl += '?alt=json-in-script&sq=gmlid%3D';
            feedListUrl += gmlid;
            Cesium.jsonp(feedListUrl).then(function (listData) {
                for (var i = 1; i < cellData.feed.entry.length; i++) {
                    var key = cellData.feed.entry[i].content.$t;
                    var value = listData.feed.entry[0]['gsx$' + key.toLowerCase().replace(/_/g, '')].$t;
                    kvp[key] = value;
                }
                deferred.resolve(kvp);
            }).otherwise(function (error) {
                deferred.reject(error);
            });
        }).otherwise(function (error) {
            deferred.reject(error);
        });
    }).otherwise(function (error) {
        deferred.reject(error);
    });

    return deferred.promise;
}

function fetchDataFromGoogleFusionTable(gmlid, thematicDataUrl) {
    var kvp = {};
    var deferred = Cesium.when.defer();

    var tableID = CitydbUtil.parse_query_string('docid', thematicDataUrl);
    var sql = "SELECT * FROM " + tableID + " WHERE GMLID = '" + gmlid + "'";
    var apiKey = "AIzaSyAm9yWCV7JPCTHCJut8whOjARd7pwROFDQ";
    var queryLink = "https://www.googleapis.com/fusiontables/v2/query";
    new Cesium.Resource({url: queryLink, queryParameters: {sql: sql, key: apiKey}}).fetch({responseType: 'json'}).then(function (data) {
        console.log(data);
        var columns = data.columns;
        var rows = data.rows;
        for (var i = 0; i < columns.length; i++) {
            var key = columns[i];
            var value = rows[0][i];
            kvp[key] = value;
        }
        console.log(kvp);
        deferred.resolve(kvp);
    }).otherwise(function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
}


function showInExternalMaps() {
    var mapOptionList = document.getElementById('citydb_showinexternalmaps');
    var selectedIndex = mapOptionList.selectedIndex;
    mapOptionList.selectedIndex = 0;

    var selectedEntity = cesiumViewer.selectedEntity;
    if (!Cesium.defined(selectedEntity))
        return;

    var selectedEntityPosition = selectedEntity.position;
    var wgs84OCoordinate;

    if (!Cesium.defined(selectedEntityPosition)) {
        var boundingSphereScratch = new Cesium.BoundingSphere();
        cesiumViewer._dataSourceDisplay.getBoundingSphere(selectedEntity, false, boundingSphereScratch);
        wgs84OCoordinate = Cesium.Ellipsoid.WGS84.cartesianToCartographic(boundingSphereScratch.center);
    } else {
        wgs84OCoordinate = Cesium.Ellipsoid.WGS84.cartesianToCartographic(selectedEntityPosition._value);

    }
    var lat = Cesium.Math.toDegrees(wgs84OCoordinate.latitude);
    var lon = Cesium.Math.toDegrees(wgs84OCoordinate.longitude);
    var mapLink = "";

    switch (selectedIndex) {
        case 1:
            //mapLink = 'https://www.mapchannels.com/dualmaps7/map.htm?lat=' + lat + '&lng=' + lon + '&z=18&slat=' + lat + '&slng=' + lon + '&sh=-150.75&sp=-0.897&sz=1&gm=0&bm=2&panel=s&mi=1&md=0';
            //mapLink = 'https://www.google.com/maps/embed/v1/streetview?location=' + lat + ',' + lon + '&key=' + 'AIzaSyBRXHXasDb8PGOXCfQP7r7xQiAQXo3eIQs';
            //mapLink = 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + lat + ',' + lon + '&fov=90&heading=235&pitch=10' + '&key=AIzaSyBRXHXasDb8PGOXCfQP7r7xQiAQXo3eIQs';
            mapLink = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + lat + ',' + lon;
            break;
        case 2:
            mapLink = 'https://www.openstreetmap.org/index.html?lat=' + lat + '&lon=' + lon + '&zoom=20';
            break;
        case 3:
            mapLink = 'https://www.bing.com/maps/default.aspx?v=2&cp=' + lat + '~' + lon + '&lvl=19&style=o';
            break;
        case 4:
            mapLink = 'https://www.mapchannels.com/dualmaps7/map.htm?x=' + lon + '&y=' + lat + '&z=16&gm=0&ve=4&gc=0&bz=0&bd=0&mw=1&sv=1&sva=1&svb=0&svp=0&svz=0&svm=2&svf=0&sve=1';
            break;
        default:
        //	do nothing...
    }

    window.open(mapLink);
}

function layerDataTypeDropdownOnchange() {
    var layerDataTypeDropdown = document.getElementById("layerDataTypeDropdown");
    if (layerDataTypeDropdown.options[layerDataTypeDropdown.selectedIndex].value !== "COLLADA/KML/glTF") {
        document.getElementById("gltfVersionDropdownRow").style.display = "none";
    } else {
        document.getElementById("gltfVersionDropdownRow").style.display = "";
    }
    addLayerViewModel["layerDataType"] = layerDataTypeDropdown.options[layerDataTypeDropdown.selectedIndex].value;
}

function thematicDataSourceAndTableTypeDropdownOnchange() {
    var thematicDataSourceDropdown = document.getElementById("thematicDataSourceDropdown");
    var selectedThematicDataSource = thematicDataSourceDropdown.options[thematicDataSourceDropdown.selectedIndex].value;

    var tableTypeDropdown = document.getElementById("tableTypeDropdown");
    var selectedTableType = tableTypeDropdown.options[tableTypeDropdown.selectedIndex].value;

    addLayerViewModel["thematicDataSource"] = selectedThematicDataSource;
    addLayerViewModel["tableType"] = selectedTableType;

    // if (selectedThematicDataSource == "GoogleSheets") {
    //     document.getElementById("rowGoogleSheetsApiKey").style.display = "table-row";
    //     document.getElementById("rowGoogleSheetsRanges").style.display = "table-row";
    //     document.getElementById("rowGoogleSheetsClientId").style.display = "table-row";
    // } else {
    //     document.getElementById("rowGoogleSheetsApiKey").style.display = "none";
    //     document.getElementById("rowGoogleSheetsRanges").style.display = "none";
    //     document.getElementById("rowGoogleSheetsClientId").style.display = "none";
    // }

    var options = {
        // name: "",
        // type: "",
        // provider: "",
        uri: addLayerViewModel.thematicDataUrl,
        tableType: selectedTableType,
        // ranges: addLayerViewModel.googleSheetsRanges,
        // apiKey: addLayerViewModel.googleSheetsApiKey,
        // clientId: addLayerViewModel.googleSheetsClientId
    };
    // Mashup Data Source Service
    if (webMap && webMap._activeLayer) {
        webMap._activeLayer.dataSourceController = new DataSourceController(selectedThematicDataSource, options);
    }
}

/******************************* added start ************************/

/**
 * Function for adding glTF model to map 
 * @param {string} modelUrl download URL for glTF model
 * @param {pos} pos coordinates for location of model
 */
function addGltfModel(modelUrl, pos) {
    const viewer = webMap._cesiumViewerInstance;
    const modelPosition = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]);
    const heading = 113;
    const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0);
    // Shouldn't be added directly to the viewer
    var entity = viewer.entities.add({
        position : modelPosition,
        orientation: Cesium.Transforms.headingPitchRollQuaternion(modelPosition, hpr),
        model : {
            uri : modelUrl,
            heightReference : Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
        name: 'BIMServer-Model'
    });
    entity.description = `<table class='cesium-infoBox-defaultTable' style='font-size:10.5pt'><tbody><tr><td>Longitude</td><td>${Math.round(pos[0] * 1000000) / 1000000}</td></tr><tr><td>Latitude</td><td>${Math.round(pos[1] * 1000000) / 1000000}</td></tr><tr><td>Heading</td><td>${heading}</td></tr></tbody></table><p>Move model: Arrow keys</p><p>Rotate model: ctrl + left/right arrow key`
};
/**
 * - gets values from input boxes
 * - changes layout of BIMserver panel
 * - logs in to BIMserver
 */
function loginBimserver() {
    const url = document.getElementById('bim-url').value; // "http://localhost:8080/bimserver/";
    const user = document.getElementById('bim-user').value; // "tobias.krauth@tum.de";
    const pw = document.getElementById('bim-pw').value;
    const bimTable = document.getElementById('bim-table').value; // '../ThirdParty/Study-Project/bimCityTable.js'
    
    import(bimTable)
    .then((table)=>bimCityTable = table.default)
    .catch((error)=>{throw new Error(error)});
    bimRequestor.login(url, user, pw, addGltfModel)
    .then(()=>{
        document.getElementById('bim-login-alert').style.display = 'none';
        document.getElementById('bim-insert-button').style.display = 'block';
        document.getElementById('bim-login-input').style.display = 'none';
        document.getElementById('bim-query-type-table').style.display = 'block';
        document.getElementById('bim-query-type').value = 'predefinedQuery';
        document.getElementById('bim-query-predefined').style.display = 'table';
    })
    .catch(()=>{
        document.getElementById('bim-login-alert').style.display = 'block';
    });

    document.addEventListener('keydown', moveModel);
}
/**
 * - logout from bimserver
 * - removes added models
 * - restructures BIMserver panel for login
 */
function logoutBimserver() {
    bimRequestor.logout();
    webMap._cesiumViewerInstance.entities.removeAll();
    showHiddenObjects();

    document.getElementById('bim-login-alert').style.display = 'none';
    document.getElementById('bim-insert-button').style.display = 'none';
    document.getElementById('bim-login-input').style.display = 'table';
    document.getElementById('bim-query-type-table').style.display = 'none';
    document.getElementById('bim-query-predefined').style.display = 'none';
    document.getElementById('bim-query-write').style.display = 'none';

    document.removeEventListener('keydown', moveModel);
}
/**
 * Function that adds the model and connects AttributeProcessor, BimserverGltfRequestor and script.js
 */
function insertBimModel() {
    const activeLayer = webMap._activeLayer;
    if (!activeLayer) throw new Error('No active Layer');

    const selectedBuildings = Object.keys(activeLayer.highlightedObjects);
    const thematicDataUrl = activeLayer.thematicDataUrl;
    if (selectedBuildings.length !== 1 ) throw new Error('Select exactly 1 Building!');

    let bimQuery = null;
    switch (document.getElementById('bim-query-type').value) {
        case 'writeQuery':
            bimQuery = document.getElementById('bim-query-write').value;
            if(!bimRequestor.verifyQuery(bimQuery)) throw new Error('Query not valid json');
            break;
        case 'predefinedQuery':
            [...document.querySelectorAll('#bim-query-predefined input')].forEach((checkbox)=>{if(checkbox.checked) bimQuery = checkbox.value});
            bimQuery = JSON.stringify(queryMap.get(bimQuery));
            break;
        default:
            throw new Error('Select query type');
    }
    bimRequestor.query = bimQuery;
    const clickedGmlId = selectedBuildings[0];
    let tableEntry = bimCityTable.filter(entry => entry.relatedGmlIds.includes(clickedGmlId));
    if (tableEntry.length !== 1) throw new Error('No model in BIM-server'); 
    const attributeProcessor = new AttributeProcessor(activeLayer);
    activeLayer.dataSourceController.fetchDataPromise(tableEntry[0].relatedGmlIds)
        .then((attributes) => {
            const bBoxes = attributes.map((building) => building.BBOX);
            const center = attributeProcessor.getCenter(bBoxes);
            bimRequestor.getGltf(tableEntry[0].model, center);
            // Zum Umformen:
            let relatedGmlIds = {};
            tableEntry[0].relatedGmlIds.forEach(gmlId => {
                relatedGmlIds[gmlId] = {alpha: 1, blue: 0, green: 0.4, red: 0.4}; // sollte eig blau sein
            });
            activeLayer.highlight(relatedGmlIds);
            hideSelectedObjects();
        })
        .catch((e) => {
            throw new Error(e);
        });
}
/**
 * restructures html according to chosen BIMserver query type
 */
function changeBimQueryType() {
    const predefinedQuery = document.getElementById('bim-query-predefined');
    const writeQuery = document.getElementById('bim-query-write');
    switch (document.getElementById('bim-query-type').value) {
        case 'writeQuery':
            predefinedQuery.style.display = 'none';
            writeQuery.style.display = "";
            break;
        case 'predefinedQuery':
            writeQuery.style.display = 'none';
            predefinedQuery.style.display = 'table';
            break;
        default:
            throw new Error('Select query type');
    }
}
/**
 * Enables moving added models in the map with arrow keys
 */
function moveModel(event) {
    const selectedEntity = webMap._cesiumViewerInstance.selectedEntity;
    if ([37, 38, 39, 40].includes(event.keyCode) && selectedEntity.name === 'BIMServer-Model') {
        let entityPos = Cesium.Cartographic.fromCartesian(selectedEntity.position._value);
        let entityHpr = Cesium.Transforms.fixedFrameToHeadingPitchRoll(selectedEntity.computeModelMatrix(Cesium.JulianDate.now()));
        let entityOldDescription = selectedEntity.description._value;
        let oldLongLatHeading = entityOldDescription.match(/(-?\d+\.?\d*)(?=<)/g);
        switch (event.keyCode) {
            case 37:
                // alert('Left key pressed');
                if(event.ctrlKey) {
                    entityHpr.heading -= Cesium.Math.toRadians(2.0);
                    if (entityHpr.heading < -Cesium.Math.PI) entityHpr.heading += Cesium.Math.TWO_PI;
                    selectedEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartographic.toCartesian(entityPos), entityHpr);
                    selectedEntity.description = entityOldDescription.replace('>' + oldLongLatHeading[2] + '<', '>' + Math.round(Cesium.Math.toDegrees(entityHpr.heading)) + '<');
                } else {
                    entityPos.longitude -= 0.0000001;
                    selectedEntity.position = Cesium.Cartographic.toCartesian(entityPos);
                    selectedEntity.description = entityOldDescription.replace(oldLongLatHeading[0], Math.round(Cesium.Math.toDegrees(entityPos.longitude)*1000000)/1000000);
                }
                break;
            case 38:
                // alert('Up key pressed');
                entityPos.latitude += 0.0000001;
                selectedEntity.position = Cesium.Cartographic.toCartesian(entityPos);
                selectedEntity.description = entityOldDescription.replace(oldLongLatHeading[1], Math.round(Cesium.Math.toDegrees(entityPos.latitude)*1000000)/1000000);
                break;
            case 39:
                // alert('Right key pressed');
                if(event.ctrlKey) {
                    entityHpr.heading += Cesium.Math.toRadians(2.0);
                    if (entityHpr.heading > Cesium.Math.PI) entityHpr.heading -= Cesium.Math.TWO_PI;
                    selectedEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartographic.toCartesian(entityPos), entityHpr);
                    selectedEntity.description = entityOldDescription.replace('>' + oldLongLatHeading[2] + '<', '>' + Math.round(Cesium.Math.toDegrees(entityHpr.heading)) + '<');
                } else {
                entityPos.longitude += 0.0000001;
                selectedEntity.position = Cesium.Cartographic.toCartesian(entityPos);
                selectedEntity.description = entityOldDescription.replace(oldLongLatHeading[0], Math.round(Cesium.Math.toDegrees(entityPos.longitude)*1000000)/1000000);
                }
                break;
            case 40:
                // alert('Down key pressed');
                entityPos.latitude -= 0.0000001;
                selectedEntity.position = Cesium.Cartographic.toCartesian(entityPos);
                selectedEntity.description = entityOldDescription.replace(oldLongLatHeading[1], Math.round(Cesium.Math.toDegrees(entityPos.latitude)*1000000)/1000000);
                break;
        }
    }
};

/******************* added end *********************************/

// Mobile layouts and functionalities
var mobileController = new MobileController();

export { createCookie, getCookie, setCookie, addSplashWindowModel };