const main = {};

Promise.all([

    fetch('./data/output/level-1.geojson').then(response => response.json()),
    fetch('./data/output/level-2.geojson').then( response => response.json())

]).then( init )

function init(data) {
    console.log(data);
}