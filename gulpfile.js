/*
 * Place    <!-- build:css --> <!-- endbuild -->
 * around CSS link tags, to replace with cleaned/minified css
 * and <!-- build:js --> <!-- endbuild --> around js tags.
 * e.g.:
 * <!-- build:js -->
 * <script src="scripts/slider.js" async></script>
 * <script src="scripts/hammer.min.js" async></script>
 * <!-- endbuild -->
 * Will replace both script tags with
 * <script src="scripts/site.min.js" async></script>
 */
'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var stripCssComments = require('gulp-strip-css-comments');
var removeEmptyLines = require('gulp-remove-empty-lines');
var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var htmlreplace = require('gulp-html-replace');
var htmlmin = require('gulp-htmlmin');

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


/*dockerbuild tasks*/
gulp.task('dockerbuild',['docker-minify','docker-sass','docker-imagemin','docker-copy']);

gulp.task('docker-minify',function()
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
    .pipe(concat('site.min.js'))
    .pipe(gulp.dest('dist/scripts'));
})

gulp.task('docker-sass', function()
{
    return gulp.src('sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(stripCssComments())
    .pipe(removeEmptyLines())
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream()); 
});

gulp.task('docker-imagemin',function()
{
    return gulp.src('media/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/media'));
});

gulp.task('docker-copy',function()
{
    gulp.src('*.html')
    .pipe(htmlreplace({
        'css': 'css/main.css',
        'js': {src:'scripts/site.min.js', tpl: '<script src="%s" async></script>'}
    }))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist/'));

});