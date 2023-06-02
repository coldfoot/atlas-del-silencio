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

    const table_header = document.createElement('thead');
    const header_row = document.createElement('tr');

    table_header.appendChild(header_row);
    tb.appendChild(table_header);
    
    cols.forEach(col => {

        const th = document.createElement('th');
        th.innerText = col.title;
        header_row.appendChild(th);

    })

    const table_body = document.createElement('tbody');

    data.forEach(row => {

        const new_row = document.createElement('tr');

        const row_data = Object.values(row);

        row_data.forEach(cell_data => {

            const new_cell = document.createElement('td');
            new_cell.innerText = cell_data;
            new_row.appendChild(new_cell);

        })

        table_body.appendChild(new_row);

    })

    tb.appendChild(table_body);
})