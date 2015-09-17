var gulp = require('gulp');
var exec = require('child_process').exec
var jasmine = require('gulp-jasmine');

gulp.task('default', ['deps']);

gulp.task('test', function () {
    return gulp.src('test/**.js').pipe(jasmine());
});

gulp.task('deps', function () {
    exec('./node_modules/bower-installer/bower-installer.js');
});
