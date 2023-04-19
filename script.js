const main = {};

Promise.all([

    fetch('./data/output/finished-geojsons/level_1_results.geojson').then(response => response.json()),
    fetch('./data/output/finished-geojsons/level_2_results.geojson').then(response => response.json())

]).then( init )

function init(data) {

    console.log(data);

    main.data = new Data(data[0], data[1]);

    main.mapa = new Mapa('.map');

    main.features = {

        municipios  : new Features('municipios' , ref_to_data = main.data.municipios, ref_to_map = main.mapa),
        provincias : new Features('provincias', ref_to_data = main.data.provincias, ref_to_map = main.mapa)

    }

    main.mapa.initZoom();

    main.controls = new Controls();

    main.card = new Card('card-container', data[0].features, data[1].features);

    main.never_clicked = true;

    main.format = function(n) {
        return new Intl.NumberFormat("es-VE", { style: 'decimal' }).format(n)
    }

    //populate_select('provincias');
    //populate_select('municipios');
    //monitor_select('provincias');
    //monitor_select('municipios');

    //animation();


}

class Data {

    provincias;
    municipios;

    constructor(provincias_data, municipios_data) {
        this.provincias = provincias_data;
        this.municipios = municipios_data;
    }

    retrieve_data(type, name) {

        console.log(type, this[type]);
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
        console.log('init');
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

            viewBox = this.original_viewbox;

            this.flag_zoom_to_feature = false;
            this.el.classList.remove('zoomed');
            //document.querySelector('.tooltip').innerHTML = "";

        } else {

            main.card.set(class_name, name);

            this.el.classList.add('zoomed');
            this.flag_zoom_to_feature = true;

            const feat = document.querySelector(`[data-${class_name}="${name}"]`);

            console.log(class_name, name);
            feat.classList.add('selected');

            // also make the parent provincia selected, so it stays transparent;
            if (class_name == 'municipios') {
                const mun_data = main.data.retrieve_data('municipios', name);
                const provincia = mun_data.parent_name;
                console.log(mun_data, provincia);
                document.querySelector(`[data-provincias="${provincia}"]`).classList.add('selected');
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

        console.log(qde);

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

    data;

    title_el;
    pop_el;
    medios_el;

    breadcrumb_el;

    constructor(ref, data_provincias, data_municipios) {

        this.ref = ref;
        this.el = document.querySelector('.' + ref);
        this.breadcrumb_el = document.querySelector('.' + ref + ' .card-breadcrumbs');
        this.title_el = document.querySelector('[data-text="location"]');
        this.pop_el = document.querySelector('[data-text="poblacion"]');
        //this.medios_ = document.querySelector('[data-text="medios"]');
        this.data = {

            'provincias' : data_provincias.map(d => d.properties),
            'municipios' : data_municipios.map(d => d.properties)

        }

    }

    set(type, name) {

        this.el.dataset.locationType = type;

        let mini_data;
        
        if (type == 'venezuela') {

            mini_data = {
                name : 'Venezuela',
                population : 28200000
            }
        }
        
        else  mini_data = main.data.retrieve_data(type, name);

        
        console.log(mini_data);

        this.title_el.innerHTML = mini_data.name;
        this.pop_el.innerHTML = main.format(mini_data.population);

        // numeric info
        if (type == 'provincias') {
            document.querySelector('[data-text="medios"]').innerText = mini_data.total_medios;
            const medios_types = ['tv', 'print', 'digital', 'radio'];
            medios_types.forEach(medio => {

                let nof_medios = mini_data[medio + "_medios"];

                if (nof_medios == null) nof_medios = 0;

                document.querySelector(`[data-text="${medio}"]`).innerText = nof_medios;

            })
        }

        this.update_bread_crumb(type, name);
        //this.medios_el.innerHTML = mini_data.medios;
    }

    update_bread_crumb(type, name) {

        console.log(this.breadcrumb_el, type, name);

        this.breadcrumb_el.dataset.breadcrumbLevel = type;

        if (type == 'municipios') {

            document.querySelector('.breadcrumb-provincia').innerText = main.data.retrieve_data('municipios', name).parent_name;

        }

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

                console.log('fire');
                main.mapa.reset_map();

            }
        },

        {

            ref : 'breadcrumb-provincia',
            handler : (e) => {

                console.log('fire');
                const provincia = document.querySelector('.breadcrumb-provincia').innerText;
                console.log(provincia);
                main.mapa.fit_bounds('provincias', provincia);

            }
        },

        {
            ref: 'btn-explora',
            handler: (e) => {

                document.querySelector('.outer-wrapper').dataset.state = "explore";

                console.log(document.querySelector('.outer-wrapper'));

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