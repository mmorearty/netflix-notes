// Netflix Notes - Chrome extension
// version 2.0
// 2013-05-16
// Copyright (c) 2008-2013, Mike Morearty
// Released under the MIT license
// http://www.opensource.org/licenses/mit-license.php
//
// --------------------------------------------------------------------
//
// This lets you add a short note to yourself for each movie in your
// Netflix queue.  Below each movie name, you will see the words
// "add note".  Notes are synchronized across all your computers that
// are running Chrome.

var defaultNote = 'add note';  // displayed next to movies that don't have a note
var loadingNote = "";

var noteColor = 'black';       // text color for the note
var defaultNoteColor = 'gray'; // text color for "add note" default text

// This is called when the user begins editing a note, by clicking on it.
// It turns the <span> of text into an edit box.
function onEditMovieNote(event)
{
    var elem = event.currentTarget;
    var noteText = elem.textContent;
    if (noteText == defaultNote)
        noteText = '';
    elem = elem.parentNode;
    var input = document.createElement("input");

    // If the user clicks outside the edit box, he is done editing:
    input.addEventListener('blur', onDoneEditingMovieNote, true);

    // If the user presses Return, he is done editing:
    input.addEventListener('keydown',
        function(event) { 
            if (event.keyCode==13) 
                onDoneEditingMovieNote(event);
        }, true);

    input.value = noteText;
    elem.innerHTML = "";
    elem.appendChild(input);
    input.focus();
}

// This is called when the user is done editing a note, e.g. because they click
// outside of the note or they press Return.  It saves the new note, and turns
// the edit box back into a regular <span> of text.
function onDoneEditingMovieNote(event)
{
    var elem = event.currentTarget;

    // Figure out the movie title
    var title = null;
    for (var e = elem; title == null && e; e = e.parentNode) {
        var anchors = e.getElementsByTagName('a');
        if (anchors.length == 1) {
            title = anchors[0].text;
        }
    }

    var noteText = elem.value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    if (noteText == '') {
        noteText = defaultNote;
        // if edit box is empty, remove any existing note from storage
        removeNote(title);
	} else {
        // Save the note
        saveNote(title, noteText);
	}

    // Replace the edit box with a regular <span> of text
    setNoteText(elem, noteText);
}

function setNoteText(innerSpan, noteText)
{
    // Replace the edit box with a regular <span> of text
    var elem = innerSpan.parentNode;
    elem.innerHTML = "";
    elem.appendChild(makeNoteSpan(noteText));
}

// Given the text of a note (which might be the defaultNote text), return
// a <span> element representing that note, along with the proper
// color, click handler, etc.
function makeNoteSpan(noteText)
{
    var innerSpan = document.createElement("span");
    innerSpan.style.color = (noteText == defaultNote ? defaultNoteColor : noteColor);
    innerSpan.style.cursor = 'pointer';
    innerSpan.addEventListener('click', onEditMovieNote, true);
    innerSpan.innerHTML = noteText;
    return innerSpan;
}

// movies: Map of movies, each one of which is of the
// form { movieTitle1: htmlElem1, movieTitle2: htmlElem2, ... }
// where htmlElem is the element whose innerHTML should be set
// to the new note.
function loadNotes(movies)
{
    var movieTitles = [];
    for (var movieTitle in movies) {
        movieTitles.push(movieTitle);
    }

    chrome.storage.sync.get(movieTitles, function(notes) {
        for (var i in movieTitles) {
            var movieTitle = movieTitles[i];
            var movieNote = notes[movieTitle];
            if (movieNote === undefined || movieNote === "")
                movieNote = defaultNote;
            setNoteText(movies[movieTitle], movieNote);
        }
    });
}

// remove any existing note for the title
function removeNote(movieTitle)
{
    chrome.storage.sync.remove(movieTitle);
}

function saveNote(movieTitle, note)
{
    var obj = {};
    obj[movieTitle] = note;

    // Note, this is asynchronous
    chrome.storage.sync.set(obj);
}

// The main initialization function.  Loops through all the movies on the page,
// and for each one, adds a <span> to the page showing its note.
function initialize()
{
    insertNotesByClass('qtbl');
}

function insertNotesByClass(className)
{
    var q = document.getElementsByClassName(className);
    if (q && q.length) {
        var titles = {};

        for (var i=0; i<q.length; ++i) {
            var elem = q[i];
            var newTitles = insertNotesInElem(elem);
            for (var newTitle in newTitles)
                titles[newTitle] = newTitles[newTitle];
        }

        loadNotes(titles);
    }
}

function insertNotes(idOfSection)
{
    var q = document.getElementById(idOfSection);
    if (q) {
        var titles = insertNotesInElem(q);
        loadNotes(titles);
    }
}

// Returns a map { movieTitle1: htmlElem1, movieTitle2: htmlElem2, ... }
function insertNotesInElem(elem)
{
    // Each movie is inside <span class="title">
    var spans = elem.getElementsByTagName('span');
    var foundTitle = false;
    var movies = {};
    for (var s=0; s<spans.length; ++s) {
        if (spans[s].className.match(/\btitle\b/)) {
            foundTitle = true;
            var anchors = spans[s].getElementsByTagName('a');
            if (anchors.length == 1) {
                var movieTitle = anchors[0].text;

                // Create a <span> and insert it
                var innerSpan = makeNoteSpan(loadingNote);

                var outerSpan = document.createElement("span");
                outerSpan.appendChild(innerSpan);

                spans[s].appendChild(document.createElement("br"));
                spans[s].appendChild(outerSpan);

                // Add this movie title to the list of movie titles
                // we are returning; our caller will then load the
                // notes for all of the movies at once.
                movies[movieTitle] = innerSpan;
            }
        }
    }
    return movies;
}

// this is executed when this script loads:
initialize();

// vim:ts=4 sw=4 et:
