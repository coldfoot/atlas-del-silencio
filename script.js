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
}

class Mapa {

    el = null;
    d3sel = null;
    ref = null;

    original_viewbox;

    features;

    proj = null;

    h;
    w;

    center = [-70.7, 6.6];

    constructor(ref) {

        this.el = document.querySelector(ref);
        this.d3sel = d3.select(ref);
        this.ref = ref;

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

        //this.data = data;
        //this.features = data.features;

    }

}

class Features {

    ref;
    el;
    d3sel;

    ref_to_data;
    ref_to_map;

    path_generator;

    constructor(class_name, ref_to_data, ref_to_map) {

        this.ref = '.' + class_name;
        this.ref_to_data = ref_to_data;
        this.ref_to_map = ref_to_map;

        this.path_generator = d3.geoPath().projection(ref_to_map.proj);

        this.d3sel = ref_to_map.d3sel
            .selectAll("path." + class_name)
            .data(ref_to_data.features)
            .join("path")
            .classed(class_name, true)
            .attr('data-name', d => d.properties.name)
            .attr("d", this.path_generator)
            .append("title")
            .text(d => d.properties.name)
        ;

    }

}