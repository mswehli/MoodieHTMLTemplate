'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var stripCssComments = require('gulp-strip-css-comments');
var removeEmptyLines = require('gulp-remove-empty-lines');
var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');

var browserSync = require('browser-sync').create();

gulp.task('default', function()
{
    browserSync.init({
        server: {
            baseDir: ""
        },
        cors:true
    });
    
     gulp.watch('sass/**/*.scss',['sass']);
     gulp.watch('**/*.html').on('change', browserSync.reload);
     //gulp.watch('Scripts/*.js',['minify']);
});


gulp.task('sass', function()
{
    return gulp.src('sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(stripCssComments())
    .pipe(removeEmptyLines())
    .pipe(cleanCSS())
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

gulp.task('minify',function()
{
    return gulp.src('scripts/*.js')
    .pipe(minify({
        ext:{
            src:'.js',
            min:'.min.js'
        },
        ignoreFiles:['.min.js'],
        noSource: true
    }))
    .pipe(concat('site.js'))
    .pipe(gulp.dest('Scripts/dist'));
});

gulp.task('imagemin',function()
{
    return gulp.src('media/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('media/dist'));
});
