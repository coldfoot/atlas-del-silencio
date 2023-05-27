const main = {

    colors : {
        'No desierto' : '#19A476',
        'Desierto Moderado' : '#EDAE70',
        'Desierto' : '#EA7885'
    },
    
    dims : {

        top: null,
        bottom: null,
        left: null

    },

    mun_to_estado_dict : {},

    IDhoveredEstado : null,
    IDhoveredMunicipio : null,

    monitoringEstado : false,
    monitoringMunicipio : true

};

Promise.all([

    fetch(
        './data/output/finished-geojsons/level_1_results.geojson'
        //'lv1.json'
        ).then(response => response.json()),
    fetch(
        './data/output/finished-geojsons/level_2_results.geojson'
        //'lv2.json'
        ).then(response => response.json()),
    fetch(
        './data/output/finished-geojsons/zer.geojson'
        //'lv2.json'
        ).then(response => response.json())


]).then( init )

function compute_bbox_venezuela() {
    const bbox_provincias = turf.bbox(main.data.provincias);
    const bbox_zer = turf.bbox(main.zer);

    const poly_provincias = turf.bboxPolygon(bbox_provincias);
    const poly_zer = turf.bboxPolygon(bbox_zer);

    const poly_venezuela = turf.union(poly_provincias, poly_zer);

    return turf.bbox(poly_venezuela);
}

function init(data) {

    //console.log(data);

    main.data = new Data(data[0], data[1]);

    main.zer = data[2];

    main.bboxVenezuela = compute_bbox_venezuela();//turf.bbox(main.data.provincias, main.zer);
    utils.computeCenters('provincias');
    utils.computeCenters('municipios');

    compute_subtotals();

    //main.mapa = new Mapa('.map');

    /*
    main.features = {

        municipios  : new Features('municipios' , ref_to_data = main.data.municipios, ref_to_map = main.mapa),
        provincias : new Features('provincias', ref_to_data = main.data.provincias, ref_to_map = main.mapa)

    }*/
    init_map();

    //main.mapa.initZoom();

    main.controls = new Controls();

    main.searchBar = new SearchBar('#location-search');

    main.card = new Card('card-container', data[0].features, data[1].features);

    main.never_clicked = true;

    //populate_select('provincias');
    //populate_select('municipios');
    //monitor_select('provincias');
    //monitor_select('municipios');

    //animation();


}

const utils = {

    getDims() {

        main.dims.top = +window.getComputedStyle(document.querySelector('.wrapper-top')).height.slice(0,-2);
        main.dims.left = document.querySelector('.wrapper-top').getBoundingClientRect().x;
        main.dims.bottom = +window.getComputedStyle(document.querySelector('.wrapper-text-card-containers')).height.slice(0,-2);

    },

    position_back_button() {

        document.querySelector('button.back-to-main-map').style.setProperty('--top-position', main.dims.top + 'px');
        document.querySelector('button.back-to-main-map').style.setProperty('--left-position', main.dims.left + 'px');

    },

    computeCenters(type) {

        main.data[type].features.forEach(feature => {
            feature.properties.center = turf.center(feature).geometry.coordinates;
        })

    },

    format(n) {
        if (n == null) return 0;
        return new Intl.NumberFormat("es-VE", { style: 'decimal' }).format(n)
    },

    showsBBoxVenezuela() {

        const poly = turf.bboxPolygon(main.bboxVenezuela);

        main.mapa.addSource('bbox-venezuela', { type: 'geojson', data: poly})

        main.mapa.addLayer({
            'id': 'bbox-venezuela',
            'type': 'line',
            'source': 'bbox-venezuela',
            'layout': {},
            'paint': {
                'line-color': 'hotpink',
                'line-width': 5,
            }
        })

    }

}

function init_map() {

    mapboxgl.accessToken = 'pk.eyJ1IjoidGlhZ29tYnAiLCJhIjoiY2thdjJmajYzMHR1YzJ5b2huM2pscjdreCJ9.oT7nAiasQnIMjhUB-VFvmw';

    main.mapa = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/tiagombp/clgxtpl6400eg01p6dtzv8igv', // style URL
        center : [-65, 1], // starting position [lng, lat]
        zoom: 4, // starting zoom
    });

    main.mapa.on('load', map_is_loaded);

    main.popup_estados = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    main.popup_municipios = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

}

function map_is_loaded() {

    load_sources_layers();
    eventsBTNsCategory.monitor();

}

function load_sources_layers() {

    main.mapa.addSource('estados', {
        type: 'geojson',
        data : main.data.provincias,
        'promoteId' : 'name'
    });

    main.mapa.addSource('municipios', {
        type: 'geojson',
        data : main.data.municipios,
        'promoteId' : 'name'
    });

    main.mapa.addSource('zer', {
        type: 'geojson',
        data : main.zer
    });

    main.mapa.addLayer({
        'id': 'municipios',
        'type': 'fill',
        'source': 'municipios',
        'layout': {},
        'paint': {
          'fill-color': [
            'case',

            [
                '==',
                ['get', 'category'],
                'No desierto'
            ],
                main.colors['No desierto'],
                
            [
                '==',
                ['get', 'category'],
                'Desierto'
            ],
                main.colors['Desierto'],

            [
                '==',
                ['get', 'category'],
                'Desierto Moderado'
            ],
                main.colors['Desierto Moderado'],

                'lightgray'

          ],
          'fill-outline-color' : 'transparent',
          'fill-opacity': [
            'case',
            [
                'boolean', 
                ['feature-state', 'hover'], 
                false
            ],
            1,
            .8
          ]
        }
    });

    main.mapa.addLayer({
        'id': 'municipios-border',
        'type': 'line',
        'source': 'municipios',
        'layout': {},
        'paint': {
            'line-color': '#666',
            'line-width': 0,
        }
    }); 

    main.mapa.addLayer({
        'id': 'estados',
        'type': 'fill',
        'source': 'estados',
        'layout': {},
        'paint': {
          'fill-color': 'transparent',
          'fill-outline-color' : 'transparent',
          'fill-opacity': [
            'case',
            [
                'boolean', 
                ['feature-state', 'hover'], 
                false
            ],
            .1,
            0
          ]
        }
    });

    main.mapa.addLayer({
        'id': 'estados-border',
        'type': 'line',
        'source': 'estados',
        'layout': {},
        'paint': {
            'line-color': '#666',
            'line-width': 1,
        }
    }); 

    // antes do 'selected-estado-border', para que este fique acima
    // do 'hover' (caso contrário, quando houver um estado selecionado,
    // passar o mouse sobre esse mesmo estado fará mudar sua borda, criando um efeito estranho)
    main.mapa.addLayer({
        'id': 'estado-border-hover',
        'type': 'line',
        'source': 'estados',
        'layout': {},
        'paint': {
          'line-color': '#666',
          'line-width': [
            'case',
            [
                'boolean', 
                ['feature-state', 'hover'], 
                false
            ],
            4,
            1
        ]
        }
    }); 

    main.mapa.addLayer({
        'id': 'selected-estado-border',
        'type': 'line',
        'source': 'estados',
        'layout': {},
        'paint': {
          'line-color': 'black',
          'line-width': 4
        },
        'filter': ['==', 'estado', '']
    });

    main.mapa.addLayer({
        'id': 'zer',
        'type': 'fill',
        'source': 'zer',
        'layout': {},
        'paint': {
          'fill-color': '#d4d4d5',
          'fill-outline-color' : 'transparent',
        }
    });

    main.mapa.addLayer({
        'id': 'zer-border',
        'type': 'line',
        'source': 'zer',
        'layout': {},
        'paint': {
            'line-color': '#666',
            'line-width': 1,
        }
    }); 

}

function toggle_borders_municipios(toggle) {

    main.mapa.setPaintProperty(
        'municipios-border', 
        'line-width', toggle ? 1 : 0
    );

}

function reset_featureState_estado() {

    if (main.IDhoveredEstado !== null) {
        main.mapa.setFeatureState(
            { source: 'estados', id: main.IDhoveredEstado },
            { hover: false }
        );
    }

    main.IDhoveredEstado = null;

}

function reset_featureState_municipio() {

    if (main.IDhoveredMunicipio !== null) {
        main.mapa.setFeatureState(
            { source: 'municipios', id: main.IDhoveredMunicipio },
            { hover: false }
        );
    }

    main.IDhoveredMunicipio = null;

}

const mouseEventsEstado = {

    hover_move(e) {

        // When the user moves their mouse over the state-fill layer, we'll update the
        // feature state for the feature under the mouse.

        //console.log(e.features, e.features[0], e.features[0].id, main.IDhoveredEstado);

        //'features' will not be shown as an Object key if you log only the event 'e' :/
        // you need to explicitely call e.features
        // this 'id' key was generated when the source was added. it is not within the 'properties' object.
        // we explicitely asked for the 'name' property to be considered as the feature's 'id'.

        if (e.features.length > 0) {
            
            // why?
            if (main.IDhoveredEstado !== null) {

                /*
                main.mapa.removeFeatureState({
                    source: 'estados',
                    id: main.IDhoveredEstado
                });
                */
                main.mapa.setFeatureState(
                    { source: 'estados', id: main.IDhoveredEstado },
                    { hover: false }
                );
            }

            main.IDhoveredEstado = e.features[0].id;

            main.mapa.setFeatureState(
                { source: 'estados', id: main.IDhoveredEstado },
                { hover: true }
            );

            mouseEventsEstado.showPopup(e);

        }

    },

    hover_leave() {
        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        reset_featureState_estado();
        mouseEventsEstado.hidePopup();

    },

    click(e) {

        console.log(e, e.features);
        fit_bounds('provincias', e.features[0].id);

    },

    showPopup(e) {

        // Change the cursor style as a UI indicator.
        main.mapa.getCanvas().style.cursor = 'pointer';

        //console.log(e, e.features[0]);
            
        // Copy coordinates array.
        const coordinates = JSON.parse(e.features[0].properties.center);
        const name = e.features[0].properties.name;

        //console.log(coordinates);
            
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        /*
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }*/
            
        // Populate the popup and set its coordinates
        // based on the feature found.
        main.popup_estados.setLngLat(coordinates).setHTML(name).addTo(main.mapa);

    },

    hidePopup() {
        main.mapa.getCanvas().style.cursor = '';
        main.popup_estados.remove();
    }

}

const mouseEventsMunicipio = {

    hover_move(e) {

        // When the user moves their mouse over the state-fill layer, we'll update the
        // feature state for the feature under the mouse.

        //console.log(e.features, e.features[0], e.features[0].id, main.IDhoveredEstado);

        //'features' will not be shown as an Object key if you log only the event 'e' :/
        // you need to explicitely call e.features
        // this 'id' key was generated when the source was added. it is not within the 'properties' object.
        // we explicitely asked for the 'name' property to be considered as the feature's 'id'.

        if (e.features.length > 0) {
            
            // why?
            if (main.IDhoveredMunicipio !== null) {

                /*
                main.mapa.removeFeatureState({
                    source: 'estados',
                    id: main.IDhoveredEstado
                });
                */
                main.mapa.setFeatureState(
                    { source: 'municipios', id: main.IDhoveredMunicipio },
                    { hover: false }
                );
            }

            main.IDhoveredMunicipio = e.features[0].id;

            main.mapa.setFeatureState(
                { source: 'municipios', id: main.IDhoveredMunicipio },
                { hover: true }
            );

            mouseEventsMunicipio.showPopup(e);

        }

    },

    hover_leave() {
        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        reset_featureState_municipio();
        mouseEventsMunicipio.hidePopup();

    },

    click(e) {

        //console.log(e, e.features);
        fit_bounds('provincias', e.features[0].properties.parent_name);

    },

    showPopup(e) {

        // Change the cursor style as a UI indicator.
        main.mapa.getCanvas().style.cursor = 'pointer';

        //console.log(e, e.features[0]);
            
        // Copy coordinates array.
        const coordinates = JSON.parse(e.features[0].properties.center);
        
        const name = e.features[0].properties.name;
        const category = e.features[0].properties.category;
        const estado = e.features[0].properties.parent_name;
        const pop = e.features[0].properties.population;
        
        const content = `
            <p style="font-weight: bold;">${name}</p>
            <p>Estado: ${estado}</p>
            <p>Población: ${utils.format(pop)}</p>
            <p class="popup-category" style="display: inline-block; background-color: ${main.colors[category]};">${category}</p>
        `

        //console.log(coordinates);
            
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        /*
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }*/
            
        // Populate the popup and set its coordinates
        // based on the feature found.
        main.popup_municipios.setLngLat(coordinates).setHTML(content).addTo(main.mapa);

    },

    hidePopup() {
        main.mapa.getCanvas().style.cursor = '';
        main.popup_municipios.remove();
    }

}

function colorMapCategory(category) {

    if (category == '') {

        main.mapa.setPaintProperty(

            'municipios', 'fill-color', 
            [
                'case',
    
                [
                    '==',
                    ['get', 'category'],
                    'No desierto'
                ],
                    main.colors['No desierto'],
                    
                [
                    '==',
                    ['get', 'category'],
                    'Desierto'
                ],
                    main.colors['Desierto'],
    
                [
                    '==',
                    ['get', 'category'],
                    'Desierto Moderado'
                ],
                    main.colors['Desierto Moderado'],
    
                    'lightgray'
            ])

    } else {

        main.mapa.setPaintProperty(

            'municipios', 'fill-color', 
            [
                'case',
                [
                    '==',
                    ['get', 'category'],
                    category
                ],
    
                main.colors[category],
    
                '#f0e9df'
            ])

    }

}

const eventsBTNsCategory = {

    monitor() {

        const btns = document.querySelector('.btns');

        btns.addEventListener('click', e => this.click(e, this));

        console.log(btns);

    },

    click(e, ref) {

        if (e.target.tagName == 'BUTTON') {

            let cat = e.target.dataset.btnCategory;

            if (e.target.classList.contains('category-selected')) {

                e.target.classList.remove('category-selected');
                
                cat = ''; // to reset the map

            } else {

                document.querySelectorAll('.btn-categories').forEach(btn => btn.classList.remove('category-selected'));
                e.target.classList.add('category-selected');

            }

            colorMapCategory(cat);

        }

    }



}


function monitorEstado(toggle = 'on') {

    main.monitoringEstado = toggle == 'on' ? true : false;
    // toggle: 'on', 'off'
    
    // olha que interessante:
    // o evento do mouse é definido sobre um LAYER, 
    // o featured state é definido para o SOURCE,
    // e podemos usar o featureState para alterar o visual de OUTRA LAYER.

    // 1. evento do mouse sobre LAYER1 é disparado e chama uma função.
    // 2. essa função altera o featureState do feature em questão na própria SOURCE.
    // 3. uma outra layer, LAYER2, definida com formatação condicionada a um featureState é afetada.

    main.mapa[toggle]('mousemove', 'estados', mouseEventsEstado.hover_move)
    main.mapa[toggle]('mouseleave', 'estados', mouseEventsEstado.hover_leave);
    main.mapa[toggle]('click', 'estados', mouseEventsEstado.click);

    if (toggle == 'off') {
        reset_featureState_estado();
        mouseEventsEstado.hidePopup();
    }

}

function monitorMunicipio(toggle = 'on') {

    main.monitoringMunicipio = toggle == 'on' ? true : false;

    //console.log('Monitoring municipios ', toggle);
    // toggle: 'on', 'off'
    
    // olha que interessante:
    // o evento do mouse é definido sobre um LAYER, 
    // o featured state é definido para o SOURCE,
    // e podemos usar o featureState para alterar o visual de OUTRA LAYER.

    // 1. evento do mouse sobre LAYER1 é disparado e chama uma função.
    // 2. essa função altera o featureState do feature em questão na própria SOURCE.
    // 3. uma outra layer, LAYER2, definida com formatação condicionada a um featureState é afetada.

    main.mapa[toggle]('mousemove', 'municipios', mouseEventsMunicipio.hover_move)
    main.mapa[toggle]('mouseleave', 'municipios', mouseEventsMunicipio.hover_leave);
    main.mapa[toggle]('click', 'municipios', mouseEventsMunicipio.click);

    if (toggle == 'off') {
        reset_featureState_municipio();
        mouseEventsMunicipio.hidePopup();
    }

}

function fit_bounds(type, location) {

    colorMapCategory('');

    let bbox;

    if (type == 'provincias') {

        const feature = main.data[type].features.filter(d => d.properties.name == location)[0];

        bbox = turf.bbox(feature);

        toggle_borders_municipios(true);

        monitorEstado('off');
        if (!main.monitoringMunicipio) monitorMunicipio('on');

    }

    if (type == 'venezuela') {

        bbox = main.bboxVenezuela;

        location = '';

        toggle_borders_municipios(false);

        if (!main.monitoringEstado) monitorEstado('on');
        monitorMunicipio('off');

    }

    main.mapa.setFilter(
        'selected-estado-border', 
        [
            '==',
            ['get', 'name'],
            location
        ]
    );

    main.mapa.fitBounds(bbox, {
        padding : {
            top: main.dims.top + 10,
            bottom: main.dims.bottom + 10,
            left: 10,
            right: 10
        }
    })

    main.card.set(type, location);

}



// temporary function while we don't have this info encoded in the data
function compute_subtotals() {

    /*
    function get_unique_provincias_list() {
        return main.data.provincias.features
          .map(d => d.properties.name)
          .filter( (d, i, arr) => arr.indexOf(d) == i ) // get unique values
    }

    const provincias = get_unique_provincias_list();
    console.log(provincias);
    */

    function get_pop(provincia, category) {

        const mun_of_provincia_category = main.data.municipios.features
          .filter(d => d.properties.parent_name == provincia)
          .filter(d => d.properties.category == category)
        ;

        return mun_of_provincia_category
          .map(d => d.properties.population)
          .reduce( (prev, current) => prev + current, 0 )
        ;

    }

    main.data.provincias.features.forEach(provincia => {
        provincia.properties['pop Desierto'] = get_pop(provincia.properties.name, 'Desierto');
        provincia.properties['pop No desierto'] = get_pop(provincia.properties.name, 'No desierto');
        provincia.properties['pop Desierto Moderado'] = get_pop(provincia.properties.name, 'Desierto Moderado');
    })

    //console.log(get_pop(provincias[2], 'No desierto'));

}

class Data {

    provincias;
    municipios;

    constructor(provincias_data, municipios_data) {
        this.provincias = provincias_data;
        this.municipios = municipios_data;
    }

    retrieve_data(type, name) {

        //console.log(type, this[type]);
        const mini_data = this[type].features
          .map(d => d.properties)
          .filter(d => d.name == name)[0];

        return mini_data;

    }

}

/*
class Mapa {

    el = null;
    d3sel = null;
    d3svg = null;
    ref = null;

    original_viewbox;

    features;

    proj = null;

    h;
    w;

    center = [-70.7, 6.6];

    zoom;

    flag_zoom_to_feature = false;

    constructor(ref) {

        this.el = document.querySelector(ref);
        //this.d3sel = d3.select(ref);
        this.ref = ref;
        this.d3svg = d3.select(ref);

        const cont = document.querySelector(ref + '-container');

        this.w = +window.getComputedStyle(cont).width.slice(0,-2);
        this.h = +window.getComputedStyle(cont).height.slice(0,-2);

        this.original_viewbox = `0 0 1000 1000`;//${this.w} ${this.h}`;

        this.el.setAttribute('viewBox', this.original_viewbox);

        this.proj = d3.geoMercator()
          .center(this.center)
          //.rotate([10, 0])
          .translate([this.w/2.2, this.h/0.8]) // arrumar um jeito de calcular isso direito
          .scale(4200)

        ;

        d3.select(ref).append('g');
        this.d3sel = d3.select('svg > g');

        this.zoom = d3.zoom().on('zoom', this.handleZoom);

        //this.data = data;
        //this.features = data.features;

    }


    handleZoom = (e) => {
        this.el.classList.add('zoomed');
        this.d3sel
            .attr('transform', e.transform);
    }

    initZoom() {
        //console.log('init');
        d3.select('svg')
            .call(this.zoom);
    }

    reset_zoom() {
        d3.select('svg').call(this.zoom.transform, d3.zoomIdentity);
        this.el.classList.remove('zoomed');
    }

    reset_map() {

        //d3.select('g').transition().duration(1000).attr('transform', '');
        d3.select('svg').transition().duration(300).call(this.zoom.transform, d3.zoomIdentity);
        if (this.flag_zoom_to_feature) this.fit_bounds('reset');
        setTimeout( () => { d3.select('svg').classed('zoomed', false); } , 1000);
    }

    fit_bounds(class_name, name) {

        // class_name = provincias, municipios

        this.reset_zoom();

        const margin = 0.1;//20;

        let viewBox;

        // resets selections
        main.features.municipios.d3sel.classed('selected', false);
        main.features.provincias.d3sel.classed('selected', false);

        if (class_name == 'reset') {

            main.card.update_bread_crumb('venezuela');
            main.card.set('venezuela');
            this.el.dataset.zoomedToProvince = "";

            viewBox = this.original_viewbox;

            this.flag_zoom_to_feature = false;
            this.el.classList.remove('zoomed');
            //document.querySelector('.tooltip').innerHTML = "";

        } else {

            main.card.set(class_name, name);

            this.el.classList.add('zoomed');
            this.flag_zoom_to_feature = true;

            const feat = document.querySelector(`[data-${class_name}="${name}"]`);

            //console.log(class_name, name);
            feat.classList.add('selected');

            // also make the parent provincia selected, so it stays transparent;
            if (class_name == 'municipios') {
                const mun_data = main.data.retrieve_data('municipios', name);
                const provincia = mun_data.parent_name;
                //console.log(mun_data, provincia);
                document.querySelector(`[data-provincias="${provincia}"]`).classList.add('selected');
            } else {

                // when a province was clicked

                // it will always go first through a province, so we will only change this value upon a new province selection. if the user is selecting a municipality within this province, the province name will be kept.
                // or we reset it when the map is reset.
                this.el.dataset.zoomedToProvince = name;
            }


            //document.querySelector('.tooltip').innerHTML = name + ` (${class_name})`;
    
            const bbox = feat.getBBox();
    
            //viewBox = `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + 2*margin} ${bbox.height + 2*margin}`
            viewBox = `${bbox.x - (margin * bbox.width) } ${ bbox.y - (margin * bbox.height)} ${(1+2*margin)*bbox.width} ${(1+2*margin)*bbox.height}`
        
            //console.log(feat, bbox, viewBox);

            console.log('bbox-width ', bbox.width);

        }

        main.mapa.d3svg.transition().duration(500).attr('viewBox', viewBox);

    }

}

class Features {

    ref;
    el;
    d3sel;
    d3ContSel;

    type;

    ref_to_data;
    ref_to_map;

    path_generator;

    constructor(class_name, ref_to_data, ref_to_map) {

        this.ref = '.' + class_name;
        this.ref_to_data = ref_to_data;
        this.ref_to_map = ref_to_map;

        this.type = class_name;

        this.path_generator = d3.geoPath().projection(ref_to_map.proj);

        ref_to_map.d3sel.append('g').classed('container-' + class_name, true);

        this.d3ContSel = d3.select('.container-' + class_name);

        this.d3sel = this.d3ContSel
            .selectAll("path." + class_name)
            .data(ref_to_data.features)
            .join("path")
            .classed(class_name, true)
            .classed('distrito-capital', d => d.properties.parent_name == "Distrito capital")
            .attr('data-type', class_name)
            .attr('data-category', d => d.properties.category)
            .attr('data-' + class_name, d => d.properties.name)
            //.attr('data-parent', d => class_name == 'municipios' ? d.properties.parent_name : '')
            .attr("d", this.path_generator);

        this.d3sel
            .append("title")
            .text(d => d.properties.name)
        ;

        this.d3sel.on('click', function(e) {

            const el_clicked = e.target;
            const type = e.target.dataset.type;

            if (main.never_clicked) {
                main.never_clicked = false;
                document.querySelector('.outer-wrapper').dataset.state = "explore";
            }
            const name = e.target.dataset[type]
            main.mapa.fit_bounds(type, name);
            //document.querySelector('.tooltip').innerHTML = name + ` (Municipio)`;

        });

    }

    change_to_circle() {

        const w = this.ref_to_map.w;

        // const r = d3.scaleSqrt()
        //   .domain([0, max_pop])
        //   .range([1, 20]) 
        // ;

        let r = 10;
        let margin = 5;

        let qde = Math.ceil((w - margin - margin) / ((2 * r) + margin));

        //console.log(qde);

        this.d3sel
            .transition()
            .delay((d,i) => i * 5)//(i % 50) * 100)
            .duration(1000)
            .attrTween('d', function(d, n) {

                const i = n % qde;
                const j = Math.floor(n / qde);

                let x = 50 + (2 * r + margin) * i;

                let y = 200 + (2 * r + margin) * j;

                d.cx = x;
                d.cy = y

                const d_attr = d3.select(this).attr('d');

                d.d = d_attr;

                return flubber.toCircle(d_attr, x, y, r, {maxSegmentLength: 2});

        }) 

    }

    change_to_shape() {

        let r = 10;

        this.d3sel
            .transition()
            //.delay((d,i) => (i % 100) * 100)
            .duration(3000)
            .attrTween('d', function(d, n) {

                let x = d.cx;

                let y = d.cy;

                const d_attr = d.d;

                return flubber.fromCircle (x, y, r, d_attr, {maxSegmentLength: 2});

        })

    }

    hide(op) {
        this.d3ContSel.transition().duration(500).attr('opacity', op);
    }

}
*/

class Card {

    ref;
    el;
    select;

    data;

    title_el;
    pop_el;
    medios_el;

    //breadcrumb_el;

    constructor(ref, data_provincias, data_municipios) {

        this.ref = ref;
        this.el = document.querySelector('.' + ref);
        this.select = document.querySelector('select.info-subtitle');
        //this.breadcrumb_el = document.querySelector('.' + ref + ' .card-breadcrumbs');
        this.title_el = document.querySelector('[data-text="location"]');
        this.pop_el = document.querySelector('[data-text="poblacion"]');
        //this.medios_ = document.querySelector('[data-text="medios"]');
        this.data = {

            'provincias' : data_provincias.map(d => d.properties),
            'municipios' : data_municipios.map(d => d.properties)

        }

        this.monitorSelect();

    }

    set(type, name) {

        this.el.dataset.locationType = type;

        let mini_data;
        
        if (type == 'venezuela') {

            mini_data = {
                name : 'Venezuela',
                population : 33357851
            }
        }
        
        else  mini_data = main.data.retrieve_data(type, name);

        
        //console.log(mini_data);

        this.title_el.innerHTML = mini_data.name;
        this.pop_el.innerHTML = utils.format(mini_data.population);

        // numeric info
        if (type == 'provincias') {

            // texts 

            document.querySelector('[data-text="medios"]').innerText = mini_data.total_medios;
            const medios_types = ['tv', 'print', 'digital', 'radio'];
            medios_types.forEach(medio => {

                let nof_medios = mini_data[medio + "_medios"];

                if (nof_medios == null) nof_medios = 0;

                document.querySelector(`[data-text="${medio}"]`).innerText = nof_medios;

            })

            // mini bar-chart;

            const categories = ['No desierto', 'Desierto', 'Desierto Moderado'];

            const getVariableName = {
                'Desierto' : 'desert_children',
                'No desierto' : 'not_desert_children',
                'Desierto Moderado' : 'moderate_desert_children'
            }

            categories.forEach(category => {

                const pct_pop = (100 * (mini_data['pop ' + category] / mini_data.population)).toFixed(1) + "%";

                const bar = document.querySelector(`[data-bar-category="${category}"]`);
                const label = document.querySelector(`[data-label-category="${category}"]`)

                //bar.style.flexBasis = pct_pop;
                //label.innerText = utils.format(mini_data['pop ' + category]) + " (" + pct_pop + ")";

                label.dataset.popInfo = utils.format(mini_data['pop ' + category]) + " (" + pct_pop + ")";
                bar.dataset.popValue = pct_pop;

                const qty_total = mini_data.desert_children + mini_data.not_desert_children + mini_data.moderate_desert_children;

                const pct_qty = (100 * (mini_data[getVariableName[category]] / qty_total)).toFixed(1) + "%";

                label.dataset.qtyInfo = mini_data[getVariableName[category]] + " (" + pct_qty + ")";
                bar.dataset.qtyValue = pct_qty;

            })

            this.updateBarsAndLabels(this);

        }

        //this.update_bread_crumb(type, name);
        //this.medios_el.innerHTML = mini_data.medios;
    }

    update_bread_crumb(type, name) {

        //console.log(this.breadcrumb_el, type, name);

        this.breadcrumb_el.dataset.breadcrumbLevel = type;

        if (type == 'municipios') {

            document.querySelector('.breadcrumb-provincia').innerText = main.data.retrieve_data('municipios', name).parent_name;

        }

    }

    monitorSelect() {

        console.log('monitoring select!');

        this.select.addEventListener('change', (e) => {
            this.updateBarsAndLabels(this)
        });

    }

    updateBarsAndLabels(thisObject) {

        const option = thisObject.select.value;

        //console.log('Chamou!', thisObject, option);

        const categories = ['No desierto', 'Desierto', 'Desierto Moderado'];

        categories.forEach(category => {

            const bar = document.querySelector(`[data-bar-category="${category}"]`);
            const label = document.querySelector(`[data-label-category="${category}"]`)

            // option will be pop or qty, resulting in dataset.popValue/popInfo or qtyValue/qtyInfo
            bar.style.flexBasis = bar.dataset[option + 'Value'];
            label.innerText = label.dataset[option + 'Info'];

        })

    }
}

class Controls {

    buttons = [

        
        /*{

            ref : 'btn-reset-map',
            handler : (e) => {

                console.log('fire');
                main.mapa.reset_map();

                // precisa resetar o zoom

            }
        },*/

        /*
        {

            ref : 'breadcrumb-venezuela',
            handler : (e) => {

                //console.log('fire');
                //main.mapa.reset_map();
                fit_bounds('venezuela');

            }
        },*/

        {

            ref : 'back-to-main-map',
            handler : (e) => {

                //console.log('fire');
                //main.mapa.reset_map();
                fit_bounds('venezuela');

            }
        },

        /*
        {

            ref : 'breadcrumb-provincia',
            handler : (e) => {

                //console.log('fire');
                const provincia = document.querySelector('.breadcrumb-provincia').innerText;
                //console.log(provincia);
                main.mapa.fit_bounds('provincias', provincia);

            }
        },*/

        {
            ref: 'btn-explora',
            handler: (e) => {

                document.querySelector('.outer-wrapper').dataset.state = "explore";

                utils.getDims();
                utils.position_back_button();

                fit_bounds('venezuela');

                if (!main.monitoringEstado) monitorEstado('on');



                //console.log(document.querySelector('.outer-wrapper'));

            }
        },



    ];

    refs = {};

    constructor() {

        this.buttons.forEach(button => {

            this.refs[button.ref] = new Button('.' + button.ref, button.handler)

        })

    }

}

class Button {

    ref;
    el;

    handler;

    constructor(ref, handler) {

        this.ref = ref;
        this.el = document.querySelector(ref);
        this.handler = handler;
        this.monitor();

    }

    monitor() {

        console.log(this.el, ' -- monitoring...');
        this.el.addEventListener('click', this.handler);

    }

}

class SearchBar {

    el;
    datalist;
    provincias;

    constructor(ref) {

        this.el = document.querySelector(ref);
        this.datalist = document.querySelector('datalist');

        this.populate_datalist();
        this.monitor();

    }

    populate_datalist() {

        const provincias = main.data.provincias.features.map(d => d.properties.name);
        this.provincias = provincias;//.map(d => d.normalize('NFD').replace(/[\u0300-\u036f]/g, ""));

        console.log(provincias);

        provincias.forEach(provincia => {

            const option = document.createElement('option');
            option.value = provincia;//provincia.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            this.datalist.appendChild(option);

            const municipios = main.data.municipios.features.filter(d => d.properties.parent_name == provincia).map(d => d.properties.name);

            municipios.forEach(municipio => {

                main.mun_to_estado_dict[municipio] = provincia;

                const option = document.createElement('option');
                option.value = '    ' + municipio;
                //option.dataset.parent_estado = provincia;
                this.datalist.appendChild(option);

            })

        })

    }

    monitor() {

        this.el.addEventListener('change', e => this.submit(e, this));

    }

    submit(e, thisObj) {

        let text = e.target.value;

        let mun;

        if (text.slice(0,4) == '    ') {
            mun = text.slice(4);
            text = main.mun_to_estado_dict[mun];
        }

        console.log(text, thisObj.provincias.indexOf(e.target.value), mun);
        //if (this.provincias.indexOf(e.target.value)

        const index = thisObj.provincias.indexOf(text);

        if (index >= 0) {

            //main.mapa.fit_bounds('provincias', text);
            fit_bounds('provincias', text);

        }

    }

}

function test() {
    main.features.provincias.hide();
    main.features.municipios.change_to_circle();
}


function populate_select(level) {

    const sel = document.querySelector('#select-' + level);

    const data = main.data[level].features
      .map(d => d.properties.name)
      .sort( (a,b) => a.localeCompare(b))
    ;

    data.forEach(local => {

        const new_option = document.createElement('option');
        new_option.value = local;
        new_option.innerText = local;
        sel.append(new_option);

    })

}

function monitor_select(level) {

    const sel = document.querySelector('#select-' + level);

    sel.addEventListener('change', e => {
        
        //console.log(e, e.target.value, e.value);
        main.mapa.fit_bounds(level, e.target.value);
        
    });

}

