require([
  '$api/facebook',
  '$api/models',
  '/js/echonest',
  '/js/tasteprofile'
], function(facebook, models, echonest, tasteprofile) {
'use strict';

console.log(tasteprofile);

/* This section retrieves the logged-in user's friends list from Facebook...
 *
 *
 *
 * */
facebook.session.load('friends').done(function(facebookSession) {
  facebookSession.friends.snapshot()
  .done(function(friends) {
    for(var i = 0; i < friends.length; i++) {
      var friend = friends.get(i);

      if (friend.user != null) {
        createFriendLink(friend, createFriendsListItem);
      }
    }
  })/* .fail(); */;
});

function createFriendLink(friend, listItemCallback) {
  var friendStarredPlaylistURI = friend.user.uri + ":starred";

  models.Playlist.fromURI(friendStarredPlaylistURI).load('tracks')
  .done(function(playlist) {
    playlist.tracks.snapshot(0, 1).done(function(snapshot) {
      if (snapshot.length !== 0) {
        listItemCallback(friendStarredPlaylistURI, friend.name);
      }
    });
  })/* .fail(); */;
}

function createFriendsListItem(link, text) {
  var a = document.createElement('a');
  a.href = link;
  a.draggable = true;
  a.innerHTML = text;
  a.addEventListener('dragstart', dragStartEventListener, false);

  var li = document.createElement('li');
  li.appendChild(a);

  var facebookFriends = document.getElementById('facebook-friends');
  facebookFriends.appendChild(li);
}

function dragStartEventListener(e){
  e.dataTransfer.setData('text', this);
  data = this;
  e.dataTransfer.effectAllowed = 'copy';
}
/******************************************************************************/


/* This section implements the drag and drop functionality
 *
 *
 *
 * */
var dropBox = document.getElementById('drop-box');
var data = null;

// dropBox.addEventListener('dragstart', dragStartEventListener, false);
dropBox.addEventListener('dragenter', dragEnterEventListener, false);
dropBox.addEventListener('dragover',  dragOverEventListener,  false);
dropBox.addEventListener('dragleave', dragLeaveEventListener, false);
dropBox.addEventListener('drop',      dropEventListener,      false);

function dragEnterEventListener(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  // this.classList.add('over'); // CSS classes to change appearance on drag
}

function dragOverEventListener(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  return false;
}

function dragLeaveEventListener(e){
  e.preventDefault();
  // this.classList.remove('over');
}

function dropEventListener(e){
  e.preventDefault();
  // var drop = e.dataTransfer.getData('text');
  // models.Playlist.fromURI(e.dataTransfer.getData('text'));
  // // console.log(this.classList);
  // // this.classList.remove('over');

  // drop.load('tracks').done(function(droppedPlaylist) {
  //   droppedPlaylist.tracks.snapshot()
  //   .done(function(snapshot) {
  //     buildPreferences(snapshot);
  //   })/* .fail() */;
  // });

  var a = document.createElement('a');
  a.href = data.href;
  a.innerHTML = data.innerHTML;

  var li = document.createElement('li');
  li.appendChild(a);

  var groupList = document.getElementById('group-list');
  groupList.appendChild(li);
}
/******************************************************************************/


/* This section implements...
 *
 *
 *
 * */
function getUserStarredPlaylist(userURI) {
  var promise = new models.Promise();

  models.Playlist.fromURI(userURI).load('tracks')
  .done(function(playlist) {
    playlist.tracks.snapshot()
    .done(function(snapshot){
      snapshot.loadAll()
      .done(function(tracks) {
        promise.setDone(tracks);
      });
    });
  });

  return promise;
}

function aggregatePreferences(userURIList) {
  var allArtists = { };
  var promises = [ ];

  for (var i = 0; i < userURIList.length; i++) {
    var promise = getUserStarredPlaylist(userURIList[i]);
    promises.push(promise);
  }

  models.Promise.join(promises)
  .done(function (results) {
    results.forEach(function(playlist) {
      playlist.forEach(function(track) {
        track.artists.forEach(function(artist) {
          var echonestURI = artist.uri.replace('spotify', 'spotify-WW');
          allArtists[echonestURI] = true;
        });
      });
    });
    tasteprofile.createTasteProfile(Object.keys(allArtists));
  });
}

function aggregateRecommendations(userURIList) {
}
/******************************************************************************/


/* This section implements the drag and drop functionality
 *
 *
 *
 * */
// var tuples = [];
// function mergePlaylists(playlist1, playlist2) {
//   console.log("allTracksURIList: ", allTracksURIList);
//   console.log("finalList: ", finalList);

//   // Convert key, value pairs into tuples to be sorted
//   for(var key in finalList) {
//     tuples.push([key, finalList[key]]);
//   }
//   tuples.sort(compare);

//   console.log("sorted finalList: ", tuples);
// }

// /* Compare function for sorting list of artists */
// function compare(a, b) {
//   a = a[1];
//   b = b[1];
//   return (a.artist_count - b.artist_count ||
//     a.artist_tracks.length - b.artist_tracks.length);
// }

// function buildPlaylistFromTrackURIArray(trackURIArray) {
//   // require(['$api/models'], function(models) {
//     models.Playlist.create("Temp")
//     .done(function(playlist) {
//       playlist.load('tracks').done(function() {
//         for (var i = 0; i < trackURIArray.length; i++) {
//           playlist.tracks.add(models.Track.fromURI(trackURIArray[i]));
//         }
//       });
//     });
//     // .fail();
//   // });
// }

// function buildPlaylist() {
//   if (trackURIList.length > 0) {
//     console.log("Making playlist...");
//     // do stuff with trackURIList
//     buildPlaylistFromTrackURIArray(trackURIList);
//   } else {
//     console.log("No songs added to playlist.");
//   }
// }

// var artistNames = []
// function buildPlaylistFromArtistURIs() {
//   for(var i = 0; i < tuples.length; i++) {
//     resolveArtistURIToArtistName(tuples[i][0]);
//   }
//   for(var i = 0; i < artistNames.length; i++) {
//     artistNames[i] = artistNames[i].replace(' ', '+');
//   }
//   console.log(artistNames);
//   fetchPlaylistFromArtists(artistNames);
// }

// function resolveArtistURIToArtistName(artistURI) {
//   require(['$api/models#Artist'], function(Artist) {
//     Artist.fromURI(artistURI).load('name').done(function(artist) {
//       artistNames.push(artist.name);
//     });
//   });
// }

// var buttonBuildPlaylist = document.createElement("button");
// var buttonTextBuildPlaylist = document.createTextNode(" Playlist! ");
// // buttonBuildPlaylist.onclick = buildPlaylist;
// // buttonBuildPlaylist.appendChild(buttonTextBuildPlaylist);
// // playlistContainer.appendChild(buttonBuildPlaylist);

// var buttonMerge = document.createElement("button");
// var buttonTextMerge = document.createTextNode(" Merge ");
// buttonMerge.onclick = buildPlaylistFromArtistURIs;
// buttonMerge.appendChild(buttonTextMerge);
// playlistContainer.appendChild(buttonMerge);
/******************************************************************************/


/* This section implements the drag and drop functionality
 *
 *
 *
 * */
function getGroupList() {
  var groupList = document.getElementById('group-list').getElementsByTagName('li');
  var groupListArray = new Array();
  for(var i = 0; i < groupList.length; i++) {
      // console.log(groupList[i].innerHTML);
      var groupListElement = groupList[i].getElementsByTagName('a')[0];
      groupListArray.push(groupListElement.href);
  }
  return groupListArray;
}
/******************************************************************************/


/* This section implements the drag and drop functionality
 *
 *
 *
 * */
var aggregatePrefBtn = document.getElementById('aggregate-pref');
aggregatePrefBtn.addEventListener('click', function(){
  var groupURIList = getGroupList();
  // console.log(aggregatePreferences);
  // console.log(aggregatePreferences);
  aggregatePreferences(groupURIList);
  // .done(function(results) {
  //   console.log("*****");
  //   console.log(results);
  // });

  // console.log(jQuery);
  // console.log(Object.jQuery);

  // var artists = aggregatePreferences.done(function(results) {
  //   console.log(results);
  // });

  // .done(function(artists) {
  //   tasteprofile.createTasteProfile(artists);
  // });




});

var aggregateRecBtn = document.getElementById('aggregate-rec');
/******************************************************************************/


});
