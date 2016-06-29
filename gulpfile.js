var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('styles', function() {
    gulp.src('./resources/assets/app/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./public/stylesheets/'))
});

//Watch task
gulp.task('default',function() {
    gulp.watch('./resources/assets/app/*.scss',['styles']);   
});