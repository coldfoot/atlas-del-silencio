const main = {};

Promise.all([

    fetch('./level-1.geojson').then(response => response.json()),
    fetch('./level-2.geojson').then(response => response.json())

]).then( init )

function init(data) {

    console.log(data);

    main.data = {

        level1: data[0],
        level2: data[1]

    } 

    main.mapa = new Mapa('.map');

    main.features = {

        municipios  : new Features('municipios' , ref_to_data = main.data.level2, ref_to_map = main.mapa),
        provincias : new Features('provincias', ref_to_data = main.data.level1, ref_to_map = main.mapa)

    }

    main.mapa.initZoom();

    main.controls = new Controls();

    populate_select('provincias');
    populate_select('municipios');
    monitor_select('provincias');
    monitor_select('municipios');


}

class Controls {

    buttons = [

        {

            ref : 'btn-reset-map',
            handler : (e) => {

                console.log('fire');
                main.mapa.reset_map();

                // precisa resetar o zoom

            }
        }

    ];

    refs = {};

    constructor() {

        this.buttons.forEach(button => {

            this.refs[button.ref] = new Button('.' + button.ref, button.handler)

        })

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
          .translate([this.w/4, this.h/1.5])
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

        const margin = 20;

        let viewBox;
        main.features.municipios.d3sel.classed('selected', false);

        if (class_name == 'reset') {

            viewBox = this.original_viewbox;

            this.flag_zoom_to_feature = false;
            this.el.classList.remove('zoomed');
            document.querySelector('.tooltip').innerHTML = "";

        } else {

            this.el.classList.add('zoomed');
            this.flag_zoom_to_feature = true;

            const feat = document.querySelector(`[data-name-${class_name}="${name}"]`);

            feat.classList.add('selected');

            document.querySelector('.tooltip').innerHTML = name + ` (${class_name})`;
    
            const bbox = feat.getBBox();
    
            viewBox = `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + 2*margin} ${bbox.height + 2*margin}`
        
            //console.log(feat, bbox, viewBox);

        }

        main.mapa.d3svg.transition().duration(500).attr('viewBox', viewBox);

    }

}

class Features {

    ref;
    el;
    d3sel;
    d3ContSel;

    ref_to_data;
    ref_to_map;

    path_generator;

    constructor(class_name, ref_to_data, ref_to_map) {

        this.ref = '.' + class_name;
        this.ref_to_data = ref_to_data;
        this.ref_to_map = ref_to_map;

        this.path_generator = d3.geoPath().projection(ref_to_map.proj);

        ref_to_map.d3sel.append('g').classed('container-' + class_name, true);

        this.d3ContSel = d3.select('.container-' + class_name);

        this.d3sel = this.d3ContSel
            .selectAll("path." + class_name)
            .data(ref_to_data.features)
            .join("path")
            .classed(class_name, true)
            .attr('data-name-' + class_name, d => d.properties.name)
            .attr("d", this.path_generator);

        this.d3sel
            .append("title")
            .text(d => d.properties.name)
        ;

        this.d3sel.on('click', function(e) {

            const name = e.target.dataset.nameMunicipios
            main.mapa.fit_bounds('municipios', name);
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

        this.el.addEventListener('click', this.handler);

    }

}

function test() {
    main.features.provincias.hide();
    main.features.municipios.change_to_circle();
}


function populate_select(level) {

    const sel = document.querySelector('#select-' + level);

    const data = main.data[level == 'provincias' ? 'level1' : 'level2'].features
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