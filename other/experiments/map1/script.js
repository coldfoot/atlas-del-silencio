const ygg = {};
const zoom = d3.zoom();

fetch("map.geojson").then(response => response.json()).then(data => {

    init(data);

})

function init(data) {

    console.log(data);

    ygg.mapa = new Mapa('.map', data);

    ygg.mapa.render();

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

    center = [-74, -33];

    constructor(ref, data) {

        this.el = document.querySelector(ref);
        this.d3sel = d3.select(ref);
        this.ref = ref;

        const cont = document.querySelector(ref + '-container');

        this.w = +window.getComputedStyle(cont).width.slice(0,-2);
        this.h = +window.getComputedStyle(cont).height.slice(0,-2);

        this.original_viewbox = `0 0 ${this.w} ${this.h}`

        this.el.setAttribute('viewBox', this.original_viewbox);

        this.proj = d3.geoMercator()
          .center(this.center)
          //.rotate([10, 0])
          .translate([this.w/4, this.h/1.5])
          .scale(650)

        ;

        this.data = data;
        this.features = data.features;

    }

    render() {

        const path = d3.geoPath().projection(this.proj);

        this.d3sel
            .selectAll("path")
            .data(this.features)
            .join("path")
            .attr('data-nome', d => d.properties.name_state)
            .attr('data-abbrev', d => d.properties.abbrev_state)
            .attr("stroke", "white")
            .attr('stroke-width',  .5)
            .attr('fill', 'hotpink')
            .attr("d", path)
            .append("title")
            .text(d => d.properties.name_state)
        ;


    }


}

const margin = 20;
const sel = document.querySelector('select');
sel.addEventListener('change', fire);
function fire(e) {
    const option = e.target.value;
    console.log(option);

    let viewBox;

    if (option == 'BR') {
        viewBox = ygg.mapa.original_viewbox;
    } else {
        const state = document.querySelector(`[data-abbrev="${option}"]`);
    
        const bbox = state.getBBox();

        viewBox = `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + 2*margin} ${bbox.height + 2*margin}`
    
        console.log(option, bbox, viewBox);

    }

    ygg.mapa.d3sel.transition().duration(2000).attr('viewBox', viewBox);


}