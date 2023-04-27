const main = {

    colors : {
        'No desierto' : '#65CA87',
        'Desierto Moderado' : '#EFBB8B',
        'Desierto' : '#FF8888'
    },
    
    dims : {

        top: null,
        bottom: null

    }

};

Promise.all([

    fetch(
        './data/output/finished-geojsons/level_1_results.geojson'
        //'lv1.json'
        ).then(response => response.json()),
    fetch(
        './data/output/finished-geojsons/level_2_results.geojson'
        //'lv2.json'
        ).then(response => response.json())

]).then( init )

function init(data) {

    //console.log(data);

    main.data = new Data(data[0], data[1]);

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
        main.dims.bottom = +window.getComputedStyle(document.querySelector('.wrapper-text-card-containers')).height.slice(0,-2);

    },

    format(n) {
        if (n == null) return 0;
        return new Intl.NumberFormat("es-VE", { style: 'decimal' }).format(n)
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

}

function map_is_loaded() {

    load_sources_layers();

}

function load_sources_layers() {

    main.mapa.addSource('estados', {
        type: 'geojson',
        data : main.data.provincias,
        'promoteId' : 'id'
    });

    main.mapa.addSource('municipios', {
        type: 'geojson',
        data : main.data.municipios,
        'promoteId' : 'id'
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

    main.mapa.addLayer({
        'id': 'estado-border',
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

}

function toggle_borders_municipios(toggle) {

    main.mapa.setPaintProperty(
        'municipios-border', 
        'line-width', toggle ? 1 : 0
    );

}

function fit_bounds(type, location) {

    const feature = main.data[type].features.filter(d => d.properties.name == location)[0];

    const bbox = turf.bbox(feature);

    console.log(feature, bbox);

    main.mapa.fitBounds(bbox, {
        padding : {
            top: main.dims.top + 10,
            bottom: main.dims.bottom + 10,
            left: 10,
            right: 10
        }
    })

    main.mapa.setFilter(
            'estado-border', 
            [
                '==',
                ['get', 'name'],
                location
            ]
    );

    toggle_borders_municipios(true);

    main.card.set('provincias', location);

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

class Card {

    ref;
    el;
    select;

    data;

    title_el;
    pop_el;
    medios_el;

    breadcrumb_el;

    constructor(ref, data_provincias, data_municipios) {

        this.ref = ref;
        this.el = document.querySelector('.' + ref);
        this.select = document.querySelector('select.info-subtitle');
        this.breadcrumb_el = document.querySelector('.' + ref + ' .card-breadcrumbs');
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

        this.update_bread_crumb(type, name);
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

        {

            ref : 'breadcrumb-venezuela',
            handler : (e) => {

                //console.log('fire');
                main.mapa.reset_map();

            }
        },

        {

            ref : 'breadcrumb-provincia',
            handler : (e) => {

                //console.log('fire');
                const provincia = document.querySelector('.breadcrumb-provincia').innerText;
                //console.log(provincia);
                main.mapa.fit_bounds('provincias', provincia);

            }
        },

        {
            ref: 'btn-explora',
            handler: (e) => {

                document.querySelector('.outer-wrapper').dataset.state = "explore";

                utils.getDims();



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

        })

    }

    monitor() {

        this.el.addEventListener('change', e => this.submit(e, this));

    }

    submit(e, thisObj) {

        const text = e.target.value;
        console.log(text, thisObj.provincias.indexOf(e.target.value));
        //if (this.provincias.indexOf(e.target.value)

        const index = thisObj.provincias.indexOf(e.target.value);

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

function magic() {

    main.features.provincias.hide(0);
    main.features.municipios.change_to_circle();
}

function un_magic() {

    main.features.provincias.hide(1);
    main.features.municipios.change_to_shape();
}

function animation() {

    const tl = gsap.timeline(
        {repeat: 2}
    );

    
    tl
    .to('.municipios[data-grupo="1"]', {
        fill: '#FFA614',
        duration: 2
    }, "<")
    .to('[data-word="1"]', {
        backgroundColor: '#FFA614',
        duration: 2
    }, "<")
    .to('.municipios[data-grupo="1"]', {
        fill: '#20b2aa',
        duration: 2
    }, ">2")
    .to('[data-word="1"]', {
        backgroundColor: '#FFFFFF',
        duration: 2
    }, "<")

    .to('.municipios[data-grupo="2"]', {
        fill: '#B33029',
        duration: 2
    }, "<")
    .to('[data-word="2"]', {
        backgroundColor: '#B33029',
        duration: 2
    }, "<")
    .to('.municipios[data-grupo="2"]', {
        fill: '#20b2aa',
        duration: 2
    }, ">2")
    .to('[data-word="2"]', {
        backgroundColor: '#FFFFFF',
        duration: 2
    }, "<")

    .to('.municipios[data-grupo="0"]', {
        fill: '#17B353',
        duration: 2
    }, "<")
    .to('[data-word="0"]', {
        backgroundColor: '#17B353',
        duration: 2
    }, "<")
    .to('.municipios[data-grupo="0"]', {
        fill: '#20b2aa',
        duration: 2
    }, ">2")
    .to('[data-word="0"]', {
        backgroundColor: '#FFFFFF',
        duration: 2
    }, "<")
    


}