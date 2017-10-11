require.config({
    baseUrl: '../dist',

    paths: {
        'lodash': '../lib/lodash.min',
        'jasmine-boot': '../tests/jasmine-2.6.0/boot'
    },

    shim: {
    }
});

require(['jasmine-boot'], function () {
    require(['tests/spec'], function () {
        window.onload(null);
    });
});