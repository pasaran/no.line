var no = no || {};

//  ---------------------------------------------------------------------------------------------------------------  //

(function() {

var ping_url;
var ping_interval;

var is_online;

var native_offline = ( navigator.onLine === false );
var ping_timer;

//  ---------------------------------------------------------------------------------------------------------------  //

//  Проверяем, поддерживает ли браузер Page Visibility API.
//  Поперто [отсюда](https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API).

var visibility_prop, visibility_event;

if ( document.visibility_prop !== undefined ) {
    visibility_prop = 'hidden';
    visibility_event = 'visibilitychange';
} else if ( document.mozHidden !== undefined ) {
    visibility_prop = 'mozHidden';
    visibility_event = 'mozvisibilitychange';
} else if ( document.msHidden !== undefined ) {
    visibility_prop = 'msHidden';
    visibility_event = 'msvisibilitychange';
} else if ( document.webkitHidden !== undefined ) {
    visibility_prop = 'webkitHidden';
    visibility_event = 'webkitvisibilitychange';
}

//  ---------------------------------------------------------------------------------------------------------------  //

no.line = {};

no.line.init = function( options ) {
    options = options || {};

    //  Параметры пингования. Урл и интервал.
    ping_url = options.url || '/';
    ping_interval = options.interval || 5000;

    $( window )
        .on( 'online', on_online )
        .on( 'offline', on_offline );

    if ( native_offline ) {
        //  Браузер нативно поддерживает события `online` и `offline`
        //  и считает, что он находится в состоянии offline.
        //  К слову, это не означает, что он на самом деле offline.
        on_offline();
    } else {
        //  Либо браузер не поддерживает эти события,
        //  либо он считает, что находится в состоянии online.
        on_online();
    }

    if ( visibility_prop ) {
        //  Браузер поддерживает Page Visibility API.
        $( document )
            .on( visibility_event, function() {
                if ( document[visibility_prop] ) {
                    //  Страница не видна, незачем и пинговать.
                    stop_ping();
                } else {
                    //  Страница в фокусе. Начинаем пинговать опять.
                    start_ping();
                }
            } );
    }
};

no.line.status = function() {
    return is_online;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function on_online() {
    native_offline = false;

    start_ping();
}

function on_offline() {
    native_offline = true;
    set_offline();

    stop_ping();
}

function start_ping() {
    if ( !ping_timer ) {
        ping_timer = setInterval( ping, ping_interval );
        ping();
    }
}

function stop_ping() {
    if ( ping_timer ) {
        ping_timer = clearInterval( ping_timer );
    }
}

//  Пингуем сервер.
function ping() {
    //  Если браузер поддерживает события `offline` и `online` и считает,
    //  что он находится в оффлайне, то пинговать незачем.
    if ( !native_offline ) {
        //  Делаем HEAD запрос.
        $.ajax( {
            type: 'head',
            cache: false,
            url: ping_url,
            timeout: ping_interval,
            success: set_online,
            error: set_offline
        } );
    }
}

function set_online() {
    var changed = ( is_online !== true );
    is_online = true;
    //  Генерить событие нужно только если значение is_online
    //  на самом деле изменилось с прошлого раза.
    if ( changed ) {
        $( window ).trigger( 'no-online' );
    }
}

function set_offline() {
    var changed = ( is_online !== false );
    is_online = false;
    //  Генерить событие нужно только если значение is_online
    //  на самом деле изменилось с прошлого раза.
    if ( changed ) {
        $( window ).trigger( 'no-offline' );
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

})();

//  ---------------------------------------------------------------------------------------------------------------  //

