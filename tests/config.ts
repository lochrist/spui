require.config({
    baseUrl: '../dist',

    paths: {
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