fetch('./data/medios.json').then(response => response.json()).then(data => {
    console.log(data);

    const tb = document.querySelector('.table-wrapper table');

    //const cols = Object.keys(data[0]);

    const cols = [
        {
            name : 'province',
            title : 'Estado'
        },

        {
            name : 'medio_name',
            title : 'Nombre'
        },

        {
            name: 'medio_type',
            title : 'Tipo'
        },

        {
            name : 'medio_nature',
            title : 'Naturaleza'
        }        
    ]

    console.log(cols);
})