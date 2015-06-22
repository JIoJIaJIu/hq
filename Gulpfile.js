var gulp = require('gulp');
var exec = require('gulp-exec');
var jasmine = require('gulp-jasmine');

gulp.task('default', []);

gulp.task('test', function () {
    return gulp.src('test/**.js').pipe(jasmine());
});

gulp.task('deps', function () {
    exec('./node_modules/bower-installer/bower-installer.js');
});
