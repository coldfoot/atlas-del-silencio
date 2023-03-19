const main = {};

Promise.all([

    fetch('./data/output/level-1.geojson').then(response => response.json()),
    fetch('./data/output/level-2.geojson').then(response => response.json())

]).then( init )

function init(data) {

    console.log(data);

    main.data = {

        level1: data[0],
        level2: data[1]

    } 

    main.mapa = new Mapa('.map');

    main.features = {

        paroquias  : new Features('paroquias' , ref_to_data = main.data.level2, ref_to_map = main.mapa),
        provincias : new Features('provincias', ref_to_data = main.data.level1, ref_to_map = main.mapa)

    }

    main.mapa.initZoom();

    main.controls = new Controls();


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
        this.d3sel
            .attr('transform', e.transform);
    }

    initZoom() {
        console.log('init');
        d3.select('svg')
            .call(this.zoom);
    }

    reset_map() {
        //d3.select('g').transition().duration(1000).attr('transform', '');
        d3.select('svg').transition().duration(500).call(this.zoom.transform, d3.zoomIdentity);
        if (this.flag_zoom_to_feature) this.fit_bounds('reset');
    }

    fit_bounds(class_name, name) {

        const margin = 20;

        let viewBox;

        if (class_name == 'reset') {

            viewBox = this.original_viewbox;

            this.flag_zoom_to_feature = false;

        } else {

            this.flag_zoom_to_feature = true;

            const feat = document.querySelector(`[data-name-${class_name}="${name}"]`);
    
            const bbox = feat.getBBox();
    
            viewBox = `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + 2*margin} ${bbox.height + 2*margin}`
        
            console.log(feat, bbox, viewBox);

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

    }

    change_to_circle() {

        const w = this.ref_to_map.w;

        // const r = d3.scaleSqrt()
        //   .domain([0, max_pop])
        //   .range([1, 20]) 
        // ;

        let r = 10;

        this.d3sel
            .transition()
            //.delay((d,i) => (i % 100) * 100)
            .duration(3000)
            .attrTween('d', function(d, i) {

                let x = 50 + (2 * r + 10) * i;

                const j = Math.floor(x / w);

                x = x % w;
                let y = 200 + (2 * r + 10) * j;

                const d_attr = d3.select(this).attr('d');

                return flubber.toCircle(d_attr, x, y, r, {maxSegmentLength: 2});

        })

    }

    hide() {
        this.d3ContSel.transition().duration(500).attr('opacity', 0);
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
    main.features.paroquias.change_to_circle();
}