const main = {};

Promise.all([

    /*fetch(
        '../data/output/finished-geojsons/level_1_results.geojson'
        //'lv1.json'
        ).then(response => response.json()),*/
    fetch(
        '../data/output/finished-geojsons/level_2_results.geojson'
        //'lv2.json'
        ).then(response => response.json())

]).then( init )

function init(data) {

    //console.log(data);

    main.data = new Data(
        null, //data[0], 
        data[0]); //1

    main.r = d3.scaleSqrt().domain(d3.extent(main.data.municipios.features, d => d.properties.population)).range([1,40]);

    compute_subtotals();

    main.mapa = new Mapa('.map');

    main.features = {

        //provincias : new Features('provincias', ref_to_data = main.data.provincias, ref_to_map = main.mapa),
        municipios  : new Features('municipios' , ref_to_data = main.data.municipios, ref_to_map = main.mapa)

    }

    set_centers();

    sim.set();

   // main.mapa.initZoom();

    //main.controls = new Controls();

    //main.searchBar = new SearchBar('#location-search');

    //main.card = new Card('card-container', data[0].features, data[1].features);

    main.never_clicked = true;

    main.format = function(n) {
        return new Intl.NumberFormat("es-VE", { style: 'decimal' }).format(n)
    }

    //populate_select('provincias');
    //populate_select('municipios');
    //monitor_select('provincias');
    //monitor_select('municipios');

    //animation();

    scroller.steps.get();
    scroller.config();


}

function set_centers() {

    document.querySelectorAll('path.municipios').forEach(p => {

        const bbox = p.getBBox();
        //console.log(bbox);

        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2

        p.setAttribute('data-x', x);
        p.setAttribute('data-y', y);


        d3.select(p).datum().x0 = x;
        d3.select(p).datum().x = x;
        d3.select(p).datum().x_last = x;

        d3.select(p).datum().y0 = y;
        d3.select(p).datum().y = y;
        d3.select(p).datum().y_last = y;


    })

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

    /*

    main.data.provincias.features.forEach(provincia => {
        provincia.properties['pop Desierto'] = get_pop(provincia.properties.name, 'Desierto');
        provincia.properties['pop No desierto'] = get_pop(provincia.properties.name, 'No desierto');
        provincia.properties['pop Desierto Moderado'] = get_pop(provincia.properties.name, 'Desierto Moderado');
    })
    */

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

    cont = null;

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
        this.cont = cont;

        this.w = +window.getComputedStyle(cont).width.slice(0,-2);
        this.h = +window.getComputedStyle(cont).height.slice(0,-2);

        this.original_viewbox = `0 0 1000 1000`;//${this.w} ${this.h}`;

        this.el.setAttribute('viewBox', this.original_viewbox);

        this.proj = d3.geoMercator()
          .center(this.center)
          //.rotate([10, 0])
          .translate([this.w/1.4, this.h/1.3]) // arrumar um jeito de calcular isso direito
          .scale(4000)

        ;

        d3.select(ref).append('g');
        this.d3sel = d3.select('svg > g');

        this.zoom = d3.zoom().on('zoom', this.handleZoom);

        //this.data = data;
        //this.features = data.features;

    }

    show(toggle = true) {

        let method = 'remove';
        if (toggle == false) method = 'add';

        this.cont.classList[method]('hidden');

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
       // main.features.provincias.d3sel.classed('selected', false);

        if (class_name == 'reset') {

            //this.el.dataset.zoomedToProvince = "";

            viewBox = this.original_viewbox;

            this.flag_zoom_to_feature = false;
            this.el.classList.remove('zoomed');
            //document.querySelector('.tooltip').innerHTML = "";

        } else {

            //main.card.set(class_name, name);

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
                //document.querySelector(`[data-provincias="${provincia}"]`).classList.add('selected');
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
            .classed('no-color', true)
            .classed('css-controlled', true)
            .attr('data-type', class_name)
            //.style('fill', 'khaki')
            .attr('data-r', d => {
                if (class_name == "municipios") {
                    d.r = main.r(d.properties.population);
                    return d.r 
                } else return ''
            })
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

    toggle_css_control(toggle) {
        this.d3sel.classed('css-controlled', toggle);
    }

    color_single_category(category) {

        this.d3sel.classed('no-color', d => {
            if (category == 'all') return false;
            return d.properties.category != category
        });
    }

    change_to_circle(grid) {

        const w = this.ref_to_map.w;

        // const r = d3.scaleSqrt()
        //   .domain([0, max_pop])
        //   .range([1, 20]) 
        // ;

        let margin = 5;

        //console.log(qde);

        let r;

        this.d3sel
            .transition()
            .delay((d,i) => d.x * 2) //5)//(i % 50) * 100)
            .duration(1000)
            .attrTween('d', function(d, n) {

                //d.cx = x;
                //d.cy = y
                let x, y;

                const d_attr = d3.select(this).attr('d');

                if (!grid) {

                    r = d.r;//+d3.select(this).attr('data-r');
                    x = d.x0;//+d3.select(this).attr('data-x');
                    y = d.y0;//+d3.select(this).attr('data-y');

                    if (n < 10) console.log(x,y);

                } else {

                    let qde = Math.ceil((w - margin - margin) / ((2 * r) + margin));

                    const i = n % qde;
                    const j = Math.floor(n / qde);

                    r = 10;

                    x = 50 + (2 * r + margin) * i;
                    y = 200 + (2 * r + margin) * j;

                }


                d.d = d_attr;

                return flubber.toCircle(d_attr, x, y, r, {maxSegmentLength: 2})
            }) 
            /*.attr('transform', function(d,n) {

                let x, y, r;

                if (!grid) {

                    r = +d3.select(this).attr('data-r');
                    x = +d3.select(this).attr('data-x');
                    y = +d3.select(this).attr('data-y');

                } else {

                    let qde = Math.ceil((w - margin - margin) / ((2 * r) + margin));

                    const i = n % qde;
                    const j = Math.floor(n / qde);

                    r = 10;

                    if (n < 10) console.log(i, j, n, qde);

                    x = 50 + (2 * r + margin) * i;
                    y = 200 + (2 * r + margin) * j;

                }

                return `translate(${x},${y})`
            

            });*/

    }

    change_to_shape() {

        let r, x, y;

        this.d3sel
            .transition()
            //.delay((d,i) => (i % 100) * 100)
            .delay((d,i) => d.x * 2)
            .duration(1000)
            .attr('transform', 'translate(0,0)')
            //.attr('transform', `translate(${0},${0})`)
            .attrTween('d', function(d, n) {

                r = +d.r;
                x = +d.x0;//.attr('data-x');
                y = +d.y0;//.attr('data-y');

                // resets x, y params for simulation
                d.x = d.x0;
                d.y = d.y0;
                d.x_last = d.x0;
                d.y_last = d.y0;

                const d_attr = d.d;

                //r = +d3.select(this).attr('data-r');

                //if (n <10) console.log(x,y,r);

                return flubber.fromCircle (x, y, r, d_attr, {maxSegmentLength: 2})
            })
        ;



    }

    bubble_chart() {

        this.d3sel
        .transition()
        .duration(0)
        .attrTween('d', function(d, n) {

            return flubber.toCircle(d.d, 0, 0, d.r, {maxSegmentLength: 2})

        }) 
        .attr('transform', function(d,n) {

            return `translate(${d.x},${d.y})`
        
        });



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
        this.pop_el.innerHTML = main.format(mini_data.population);

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
                //label.innerText = main.format(mini_data['pop ' + category]) + " (" + pct_pop + ")";

                label.dataset.popInfo = main.format(mini_data['pop ' + category]) + " (" + pct_pop + ")";
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
        this.provincias = provincias.map(d => d.normalize('NFD').replace(/[\u0300-\u036f]/g, ""));

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

            main.mapa.fit_bounds('provincias', text);

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

const sim = {

    first_run : true,

    simulation : d3.forceSimulation().stop(),

    strength : 0.04,

    set : () => {

        const strength = sim.strength;
        //const x = v.scales.x;
        //const y0 = v.sizings.h/2

        main.nodes = main.data.municipios.features;//.features;


        sim.simulation
            .velocityDecay(0.2)
            //.force('x', d3.forceX().strength(strength).x(d => d.x0))
            //.force('y', d3.forceY().strength(strength).y(d => d.y0))
            .force('collision', d3.forceCollide().strength(strength*1.5).radius(d => d.r))
            .alphaMin(0.2)
            /* comentando para não movimentar as bolhas enquanto atualiza */
            .on('tick', () => {
                d3.selectAll('path.municipios')
                    .attr('transform', d => {

                        return `translate(
                            ${d.x - d.x0}, 
                            ${d.y - d.y0})`

                    });
            })
            .on('end', () => {
                
                console.log('terminou');
                main.nodes.forEach(d => {

                    if (sim.first_run) {
                        d.tx_map = d.x - d.x_last;
                        d.ty_map = d.y - d.y_last;
                    }

                    d.x_last = d.x;
                    d.y_last = d.y;

                })

                sim.first_run = false;
            })
            .stop()
        ;

        sim.simulation.nodes(main.nodes);

    },

    start : () => sim.simulation.alpha(1).restart(),

    save_positions_map : () => {
        //main.nodes.forEach()
    }


};

const charts = {

    bubble_groups() {

        const w = +d3.select('svg.map').style('width').slice(0,-2);
        const h = +d3.select('svg.map').style('height').slice(0,-2);

        console.log(w,h);
        
        const charge = function(d) {
            return -Math.pow(d.r, 2.0) * sim.strength;
        }


        sim.simulation.force('x', d3.forceX().strength(sim.strength).x(d => {
            if (d.properties.category == 'Desierto') return w / 6;
            if (d.properties.category == 'Desierto Moderado') return w / 2;
            if (d.properties.category == 'No desierto') return 5*w/6;
            return w/2;
        }))

        .force('y', d3.forceY().strength(sim.strength).y(h/2))
        //.force('charge', d3.forceManyBody().strength(charge))
        //.force('collision', null)
        //.force('collision', d3.forceCollide().strength(sim.strength*1.5).radius(d => d.r))
        //.velocityDecay(0.1)
        .alphaMin(0.02);

        sim.start();

    },

    bubble_map() {

        const strength = sim.strength;

        sim.simulation.stop();
        sim.simulation
          .velocityDecay(0.2)
          .force('x', null)
          .force('y', null)
          .force('collision', d3.forceCollide().strength(strength*1.5).radius(d => d.r))
          .alphaMin(0.2)
        ;

        main.features.municipios.d3sel.transition().duration(500)
          .attr('transform',  d => `translate(
            ${d.tx_map ? d.tx_map : 0},
            ${d.ty_map ? d.ty_map : 0})`
        );

        /*
        const charge = function(d) {
            return -Math.pow(d.r, 2.0) * sim.strength;
        }

        sim.simulation
          .force('x', d3.forceX().strength(sim.strength*3).x(d => d.x0))
          .force('y', d3.forceY().strength(sim.strength*3).y(d => d.y0))
          //.force('charge', d3.forceManyBody().strength(charge))
          //.force('charge', null)
          //.force('collision', d3.forceCollide().strength(sim.strength).radius(d => d.r))
          //.velocityDecay(0.1)
          .alphaMin(0.02);

        sim.start();*/


    },

    grid() {

        const margin = 100;
        const r = 10;
        let qde = Math.ceil((1000 - margin - margin) / ((2 * r) + margin));

        d3.selectAll('path.municipios').transition().duration(1000)
        .attr('transform', (d,n) => {

            const i = n % qde;
            const j = Math.floor(n / qde);
    
            x = (2 * r + margin) * i;
            y = 200 + (2 * r + margin) * j;

            return `translate(${x}, ${y})`


        })


    }

}

const scroller = {

    steps : {

        list : null,

        get : function() {

            const steps_html = document.querySelector(".story").children;

            scroller.steps.list = Array.from(steps_html).map(d => d.dataset.step);

        }

    },

    config : function() {

        enterView({

            selector: '.text-step-wrapper',

            enter: function(el) {

                const step = el.dataset.step;

                console.log("Renderizando step... ", step);

                scroller.render[step]();

            },

            exit: function(el) {

                const step = el.dataset.step;

                const index_step = scroller.steps.list.indexOf(step);

                const step_anterior = scroller.steps.list[index_step - 1];

                console.log(scroller.steps.list);

                scroller.render[step_anterior]('back');

                //console.log("saiu, ", step_anterior);
            },

            offset: 0.5, // enter at middle of viewport
            //once: true, // trigger just once
        });

    },

    // por em outro lugar?

    render : {

        'cover' : function(direction = null) {

            if (direction == 'back') {

                main.mapa.show(false);

            }

        },

        '1' : function(direction = null) {

            main.mapa.show(true);

            if (direction == 'back') {

                main.features.municipios.color_single_category('');

            }

        },

        'desiertos' : function(direction = null) {

            main.features.municipios.color_single_category('Desierto');

            if (direction == 'back') {
                main.mapa.fit_bounds('reset');
            }

        },

        'desiertos, pequeno' : function(direction = null) {

            main.mapa.fit_bounds('municipios', 'Alto Orinoco (La Esmeralda)');
            //main.data.municipios.features.filter(d => d.properties.category == 'Desierto' && d.properties.size == 'Pequeño')

            // Array.from(document.querySelectorAll('path[data-municipios]')).map(m => m.dataset.municipios).filter(d => d.includes('Iturriza'))

        },

        'desiertos, mediano' : function(direction = null) {

            main.mapa.fit_bounds('municipios', 'Junín (Rubio)');
            //main.data.municipios.features.filter(d => d.properties.category == 'Desierto' && d.properties.size == 'Pequeño')

            // Array.from(document.querySelectorAll('path[data-municipios]')).map(m => m.dataset.municipios).filter(d => d.includes('Iturriza'))
            //main.data.municipios.features.filter(d => d.properties.parent_name == 'Zulia').map(d => d.properties.name)

        },

        'desiertos, grande' : function(direction = null) {

            if (direction == 'back') {

                main.features.municipios.color_single_category('Desierto');

            }

            main.mapa.fit_bounds('municipios', 'Cabimas');


        },

        'desiertos moderados 1' : function(direction = null) {

            main.features.municipios.color_single_category('');
            main.mapa.fit_bounds('reset');

        },

        'desiertos moderados 2' : function(direction = null) {

            main.features.municipios.color_single_category('Desierto Moderado');

        },

        'desiertos moderados 3' : function(direction = null) {

        },

        'no desiertos 1' : function(direction = null) {

            main.features.municipios.color_single_category('');

        },

        'no desiertos 2' : function(direction = null) {

            main.features.municipios.color_single_category('No desierto');

        },

        'no desiertos 3' : function(direction = null) {

            if (direction == 'back') {
                main.features.municipios.toggle_css_control(true);
                main.features.municipios.color_single_category('No desierto');
            }

        },

        'pre-bubble' : function(direction = null) {

            main.features.municipios.color_single_category('all');

            if (direction == 'back') { 
                main.features.municipios.change_to_shape();
            }

        },


        'bubble transition' : function(direction = null) {

            if (direction == 'back') { 

                charts.bubble_map();
        
            } else {

                main.features.municipios.change_to_circle();
                setTimeout(() => sim.start(), 500);
                //charts.force_bubble();

            }

        },


        'bubble groups 1' : function(direction = null) {                

            charts.bubble_groups();


        },

        'third' : function(direction = null) {

            main.features.municipios.change_to_circle();
            if (direction == 'back') {

                main.features.municipios.change_to_shape();

            }

        },

        'fourth' : function(direction = null) {

            main.features.municipios.bubble_chart();
            sim.start();

        },

        'fifth' : function(direction = null) {

            charts.force_bubble();

        }

    }

}