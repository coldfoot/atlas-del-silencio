const criteria = {};
let filtered_data;
let original_data;

fetch('./data/medios.json').then(response => response.json()).then(data => {

    filtered_data = [...data];
    original_data = data;

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

    function get_unique_entries(dat, col) {

        return dat
          .map(d => d[col])
          .filter( (d, i, a) => a.indexOf(d) == i)
        ;

    }

    make_table(filtered_data);
    populate_selectors();
    monitor_change_on_selectors();

    function update_results_count() {

        const t = document.querySelector('.table-results-count');

        let text;

        const count = filtered_data.length;

        if (count == 0) {
            text = 'Sin resultados!';
        } else {
            text = '';
        }
        /*
        else {
            if (count == 1) {
                text = '1 resultado'
            } else {
                text = count + ' resultados'
            }
        }*/

        t.innerText = text;



    }

    function monitor_change_on_selectors() {

        const sels = document.querySelectorAll('.table-filters select');

        sels.forEach(sel => sel.addEventListener('change', filter_table));

    }

    function filter_table(e) {

        const col_name = e.target.dataset.colName;

        const filter_value = e.target.value;

        console.log(col_name, filter_value);

        criteria[col_name] = filter_value;

        filtered_data = [...original_data];

        Object.keys(criteria).forEach(crit => {

            filtered_data = filtered_data.filter(d => {
                if (criteria[crit] == 'todos') {
                    return true;
                } else {
                    return d[crit] == criteria[crit];
                }
            });
            
        })

        make_table(filtered_data);
        update_results_count();

    }

    function populate_selectors() {

        cols.forEach(col => {

            if (col.name == 'medio_name') return;

            criteria[col.name] = 'todos';

            const domain = get_unique_entries(data, col.name);

            const generic_option = document.createElement('option');
            generic_option.value = "todos";
            generic_option.innerText = col.title + (col.title == 'Naturaleza' ? ' (todas)' : ' (todos)'); 

            const new_select = document.createElement('select');
            new_select.dataset.colName = col.name;

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


    function make_table(data) {

        tb.innerHTML = '';

        if (data.length == 0) return;

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