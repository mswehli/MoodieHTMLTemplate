'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass')

var browserSync = require('browser-sync').create();

gulp.task('default', function()
{
    browserSync.init({
        server: {
            baseDir: ""
        }
    });
    
     gulp.watch('sass/**/*.scss',['sass']);
     gulp.watch('**/*.html').on('change', browserSync.reload);
});


gulp.task('sass', function()
{
    return gulp.src('sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('CSS'))
    .pipe(browserSync.stream()); 
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: ""
        }
    });
});
