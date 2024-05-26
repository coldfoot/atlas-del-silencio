const main = {
    menuIsExpanded : false
}

class Controls {

    buttons = [

        {
        
            ref : 'btn-menu',
            handler : (e) => {

                const menu = document.querySelector('.menu');
                menu.classList.toggle('hidden');

                const line_top = d3.select('.line-top');
                const line_mid = d3.select('.line-mid');
                const line_bottom = d3.select('.line-bottom');

                let top_y2 = main.menuIsExpanded ? '10' : '30';
                let bottom_y2 = main.menuIsExpanded ? '30' : '10';
                let mid_opacity = main.menuIsExpanded ? '1' : '0';

                line_top.transition().duration(200).attr('y2', top_y2);
                line_bottom.transition().duration(200).attr('y2', bottom_y2);
                line_mid.transition().duration(200).attr('opacity', mid_opacity);

                main.menuIsExpanded = !main.menuIsExpanded;

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

        //console.log(this.el, ' -- monitoring...');
        this.el.addEventListener('click', this.handler);

    }

}

main.controls = new Controls();