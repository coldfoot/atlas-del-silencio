fetch('./data/medios.json').then(response => response.json()).then(data => {
    console.log(data);

    const tb = document.querySelector('.table-wrapper table');

    const cont_sels = document.querySelector('.table-filters');

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

    function get_unique_entries(dat, col) {

        return dat
          .map(d => d[col])
          .filter( (d, i, a) => a.indexOf(d) == i)
        ;

    }

    console.log(get_unique_entries(data, 'medio_type'))

    make_table();
    populate_selectors();

    function populate_selectors() {

        cols.forEach(col => {

            const domain = get_unique_entries(data, col.name);

            const generic_option = document.createElement('option');
            generic_option.value = "";
            generic_option.innerText = col.title;

            const new_select = document.createElement('select');

            new_select.appendChild(generic_option);

            domain.forEach(el => {

                const new_option = document.createElement('option');
                new_option.value = el;
                new_option.innerText = el;

                new_select.appendChild(new_option);

            })

            cont_sels.appendChild(new_select);

        })

    }

    function make_table() {

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

    }

})