// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {

    var gm = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);

    window.gm = gm;

    var _size = 4;
    var total = _size * _size;
    var direction_literal = { 0: "up", 1: "right", 2: "down", 3: "left", };
    var enable = false;
    var debug = true;
    // var debug = false;

    if ( debug ) {
    }
    else {
        console.log = function(){}
    }

    document.addEventListener( "keydown", function( ev ){
        // u
        if ( ev.which == 85 ) {
            gm.storageManager.setGameState( window.prev );
            gm.setup();
            event.preventDefault();
            return;
        }


        // o
        if ( ev.which == 79 ) {
            move_one();
            event.preventDefault();
            return;
        }

        // space
        if ( ev.which == 32 ) {
            enable = !enable;
            event.preventDefault();
            return;
        }

        // enter
        if ( ev.which == 13 ) {

            console.clear();

            var move = get_move();

            console.log( "decided direction:", direction_literal[ move.direction ] );

            var arr = toarr( gm.grid.cells );
            move_arr( arr, move.direction );
            logarr( arr );
            event.preventDefault();
            return;
        }

    } );

    window.setInterval( function () {
        if ( enable ) {
            move_one();
        }
    }, 10 );

    function move_one () {
        window.prev = gm.serialize();

        console.clear();

        move = get_move();
        console.log( "decided direction:", direction_literal[ move.direction ] );
        gm.move( move.direction );
    }

    function get_move () {
        var cells = gm.grid.cells
        var arr = toarr( cells );
        logarr( arr );

        return calc_step( arr );
    }

    function calc_step ( arr ) {

        console.log( "calc_step----------------" );
        var r = search_highest( arr, 1 );
        return r;
    }

    function sizeof (arr) {
        var n = 0;
        for ( var y = 0; y < _size; y++ ) {
            for ( var x = 0; x < _size; x++ ) {
                if ( arr[ y ][ x ] > 0 ) {
                    n += 1;
                }
            }
        }
        return n;
    }

    function search_highest ( arr, depth ) {

        var copy;
        var maxmove = { r:0, direction: 0 };
        var e;
        var rst = 0;
        var r2;
        var r4;
        var r;
        var nzero = 0;
        var n = 0;
        var d;
        var dword;

        // console.log( "search: depth: ", depth );
        // logarr( arr, depth );

        var has_move = 0;
        for ( var _dir = 0; _dir < 4; _dir++ ) {
            d = ((_dir & 2) >> 1) | ( (_dir & 1) << 1 );
            dword = direction_literal[ d ];

            copy = make_copy( arr );
            move_arr( copy, d );

            if ( is_same( copy, arr ) ) {
                continue;
            }

            has_move = 1;

            // console.log( "move:", dword, "depth:", depth );
            // logarr( copy, depth );

            if ( depth == 0 ) {
                r = connectivity_rank( copy );
                var sz;
                sz = sizeof( arr );
                if ( sz > total * 0.7 ) {
                    r *= 0.8 + 0.2 * ( total - sz ) / ( total * 0.3 );
                }
            }
            else {

                var lowest = { r:0 };

                for ( var y = 0; y < _size; y++ ) {
                    for ( var x = 0; x < _size; x++ ) {

                        if ( copy[ y ][ x ] > 0 ) {
                            continue;
                        }

                        copy[ y ][ x ] = 2;
                        r2 = search_highest( copy, depth-1 );

                        if ( ! lowest.r || lowest.r > r2.r ) {
                            lowest = { r:r2.r, arr: make_copy( copy ), direction:r2.direction };
                        }
                        copy[ y ][ x ] = 0;
                    }
                }

                console.log( "search: depth: ", depth, "move: ", dword );
                logarr( arr, depth );

                console.log( "current rank" );
                logarr( connectivity_rank( arr, true ), depth );

                console.log( "after move ", dword );
                logarr( copy, depth );

                console.log( "worst case: ", lowest.r );
                logarr( lowest.arr, depth );

                console.log( "best choice in worst case:", direction_literal[ lowest.direction ] );
                move_arr( lowest.arr, lowest.direction );
                logarr( lowest.arr, depth );

                console.log( "solution rank" );
                logarr( connectivity_rank( lowest.arr, true ), depth );

                r = lowest.r;
            }


            // console.log( "rank array:==============, depth:", depth, "rank:", r );
            // logarr( connectivity_rank( copy, true ), depth );

            if ( r > maxmove.r ) {
                maxmove = { r:r, direction:d };
            }
        }
        console.log( "search result r:", maxmove.r, "direction:", direction_literal[ maxmove.direction ], "depth:", depth );
        logarr( depth );

        // maxmove.r *= has_move;
        return maxmove;
    }


    function probability_rank ( arr ) {
        // calculate rank with probability of 2 or 4 being put onto the map
        var rst = 0;
        var r2;
        var r4;
        var r;
        var nzero = 0;
        var n = 0;
        for ( var y = 0; y < _size; y++ ) {
            for ( var x = 0; x < _size; x++ ) {
                e = arr[ y ][ x ];
                if ( e == 0 ) {
                    nzero += 1;

                    arr[ y ][ x ] = 2;
                    r2 = connectivity_rank( arr );

                    arr[ y ][ x ] = 4;
                    r4 = connectivity_rank( arr );

                    arr[ y ][ x ] = 0;

                    // 4 has 10% of the chance
                    r = r2 * 0.9 + r4 * 0.1;

                    rst += r;
                }
            }
        }

        n = _size*_size - nzero;
        return rst / ( _size*_size + n );
    }

    function connectivity_rank ( arr, returnmatrix ) {
        var e;
        var r;
        var rst = 0;
        var rarr = [];

        for ( var y = 0; y < arr.length; y++ ) {
            rarr[ y ] = [];
            for ( var x = 0; x < arr[ y ].length; x++ ) {
                r = connectivity_rank_of_elt( arr, y, x );
                rarr[ y ][ x ] = r;
                rst += r;
            }
        }
        if ( returnmatrix ) {
            return rarr;
        }
        else {
            return rst;
        }
    }

    function connectivity_rank_of_elt ( arr, i0, j0, log ) {
        var e;
        var rank;
        var frm = arr[ i0 ][ j0 ];
        var positive = 0;
        var negative = 0;
        var rst = 0;
        var nrank;
        var dist;
        var has_same = 0;

        var posarr = [];
        var max_rank = 0;

        for ( var y = 0; y < arr.length; y++ ) {
            posarr[ y ] = [];

            for ( var x = 0; x < arr[ y ].length; x++ ) {
                posarr[ y ][ x ] = 0;

                e = arr[ y ][ x ];
                dist = distance( [ i0, j0 ], [ y, x ] );

                if ( e > 0 && dist <= 2 ) {
                    nrank = num_rank( frm, e );
                    rank = nrank / ( dist + 1 );

                    if ( i0 != y || j0 != x ) {
                        positive += rank;
                        if ( rank > max_rank ) {
                            posarr[ y ][ x ] = rank;
                            max_rank = rank;
                        }
                    }
                    else {
                        positive += rank;
                        posarr[ y ][ x ] = rank;
                    }
                }
            }
        }

        if ( log ) {
            console.log( "positive:" );
            logarr( posarr );
        }

        if ( i0 == 0 || i0 == _size-1 ) {
            positive += num_rank( frm, frm*4 ) * 0.7;
        }
        if ( j0 == 0 || j0 == _size-1 ) {
            positive += num_rank( frm, frm*4 ) * 0.7;
        }

        rst = positive;

        // debug
        rst = Math.floor( rst );

        return rst;
    }

    function move_arr (arr, direction) {
        for ( var t = 0; t < _size; t++ ) {
            if ( direction == 0 ) {
                move_elts( arr, { x:t, y:0 }, { x:0, y:1 } )
            }
            else if ( direction == 1 ) {
                move_elts( arr, { x:_size-1, y:t }, { x:-1, y:0 } )
            }
            else if ( direction == 2 ) {
                move_elts( arr, { x:t, y:_size-1 }, { x:0, y:-1 } )
            }
            else if ( direction == 3 ) {
                move_elts( arr, { x:0, y:t }, { x:1, y:0 } )
            }
        }
    }

    function move_elts ( arr, frm, stp ) {
        var dst = { x:frm.x, y:frm.y };
        var e;
        var prv = 0;

        for ( var t = 0; t < _size; t++ ) {
            e = arr[ frm.y ][ frm.x ];
            arr[ frm.y ][ frm.x ] = 0;

            if ( e > 0 ) {
                if ( e == prv ) {
                    arr[ dst.y - stp.y ][ dst.x - stp.x ] += e;
                    prv = 0;
                }
                else {
                    arr[ dst.y ][ dst.x ] = e;
                    dst.x += stp.x;
                    dst.y += stp.y;
                    prv = e;
                }
            }
            frm.x += stp.x;
            frm.y += stp.y;
        }
    }

    function toarr (cells) {

        var arr = [];
        for ( var y = 0; y < cells.length; y++ ) {
            arr[ y ] = [];
            for ( var x = 0; x < cells[ y ].length; x++ ) {
                var v = cells[ x ][ y ];
                if ( v ) {
                    arr[ y ][ x ] = v.value;
                }
                else {
                    arr[ y ][ x ] = 0;
                }
            }
        }
        return arr;
    }

    function is_same (a, b) {
        for ( var y = 0; y < _size; y++ ) {
            for ( var x = 0; x < _size; x++ ) {
                if ( a[ y ][ x ] != b[ y ][ x ] ) {
                    return false;
                }
            }
        }
        return true;
    }

    function make_copy ( arr ) {
        var copy = [];
        for ( var y = 0; y < _size; y++ ) {
            copy[ y ] = [];
            for ( var x = 0; x < _size; x++ ) {
                copy[ y ][ x ] = (arr[ y ] || [])[ x ] || 0;
            }
        }
        return copy;
    }

    function logarr (arr, depth) {
        if ( ! debug ) {
            return;
        }
        var s = "                              ";
        var indent = s.substr( 0, 16-depth*4 );
        for ( var y = 0; y < arr.length; y++ ) {

            var l = [];
            for ( var x = 0; x < arr.length; x++ ) {
                l[ x ] = s.substr( 0, 5-( ""+arr[ y ][ x ] ).length ) + arr[ y ][ x ];
            }

            console.log( indent + l.join( "  " ) );
        }
    }


    function distance ( a, b ) {
        return Math.abs( a[0] - b[0] ) + Math.abs( a[1] - b[1] );
    }

    function num_rank ( a, b ) {

        if ( a == 0 && b == 0 ) {
            return 0;
        }
        var distance = Math.abs(lg2( a ) - lg2( b )) + 3;
        var abmin = Math.min( a, b );
        var abmax = Math.max( a, b );

        // var v = abmin * 0.7 + abmax * 0.3;
        var v = abmin;
        return v*v / distance;
    }

    function lg2 (v) {
        return Math.log( v ) / Math.log( 2 );
    }

    window.num_rank = num_rank;
    window.connectivity_rank = connectivity_rank;
    window.connectivity_rank_of_elt = connectivity_rank_of_elt;
    window.calc_step = calc_step;
    window.move_arr = move_arr;
    window.logarr = logarr;
    window._toarr = function () {
        var cells = gm.grid.cells;
        return toarr( cells );
    }

});
