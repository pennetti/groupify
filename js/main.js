require([
  '$api/facebook',
  '$api/models',
  '$views/throbber',
  '/js/tasteprofile'
], function(facebook, models, throbber, tasteprofile) {
  'use strict';

  var tp = new tasteprofile.TasteProfile();

  // TODO: make this a module
  // TODO: fix friends list throbber
  // TODO: change document.getElementById('el') calls to jqeury $('el') calls

  /* This section retrieves the logged-in user's friends list from Facebook...
   *
   *
   *
   * */
  facebook.session.load('friends').done(function (facebookSession) {
    facebookSession.friends.snapshot().done(function (friends) {
      friends.toArray().forEach(function (friend) {
        if (friend.user != null) {
          createFriendLink(friend, createFriendsListItem);
        }
      });
    })/* .fail(); */;
  });

  function createFriendLink(friend, listItemCallback) {
    var friendStarredPlaylistURI = friend.user.uri + ":starred";

    models.Playlist.fromURI(friendStarredPlaylistURI).load('tracks')
    .done(function (playlist) {
      playlist.tracks.snapshot(1)
      .done(function (snapshot) {
        if (snapshot.length !== 0)
          listItemCallback(friendStarredPlaylistURI, friend.name);
      })/* .fail(); */;
    })/* .fail(); */;
  }

  function createFriendsListItem(link, text) {
    var a = document.createElement('a');
    a.href = link;
    a.draggable = true;
    a.innerHTML = text;
    a.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text', this);
      e.dataTransfer.effectAllowed = 'copy';
      _dropData = this;
    }, false);

    var li = document.createElement('li');
    li.appendChild(a);

    var facebookFriends = document.getElementById('facebook-friends');
    facebookFriends.appendChild(li);
  }
  /****************************************************************************/


  /* This section implements the drag and drop functionality
   *
   *
   *
   * */
   // TODO: fix drag and drop bug where any playlist outside the app becomes last _dropData
  var _dropData = null;
  var dropBox = document.getElementById('drop-box');

  dropBox.addEventListener('dragenter', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // this.classList.add('over'); // CSS classes to change appearance on drag
  }, false);
  dropBox.addEventListener('dragover',  function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    return false;
  }, false);
  dropBox.addEventListener('dragleave', function (e) {
    e.preventDefault();
    // this.classList.remove('over');
  }, false);
  dropBox.addEventListener('drop',      function (e) {
    e.preventDefault();

    var a = document.createElement('a');
    a.href = _dropData.href;
    a.innerHTML = _dropData.innerHTML;

    var li = document.createElement('li');
    li.appendChild(a);

    var groupList = document.getElementById('group-list');
    groupList.appendChild(li);
  }, false);
  /****************************************************************************/


  /* This section implements...
   *
   *
   *
   * */
  function getUserStarredPlaylist(userURI) {
    var promise = new models.Promise();

    models.Playlist.fromURI(userURI)
    .load('tracks')
    .done(function (playlist) {
      playlist.tracks.snapshot()
      .done(function (snapshot){
        snapshot.loadAll()
        .done(function (tracks) {
          promise.setDone(tracks);
        });
      });
    });

    return promise;
  }

  /* Reverse URI mapping from EchoNest back to Spotify */
  function getSpotifyID(echonestID) {
    return echonestID
      .tracks[0].foreign_id
      .replace('spotify-WW', 'spotify');
  }

  /* Create and save Spotify playlist */
  function savePlaylist(title, songs) {
    models.Playlist.create(title).done(function (playlist) {
      playlist.load('tracks').done(function (playlist) {
        var tracks = [ ];
        for (var i = 0; i < songs.length; i++) {
          if (songs[i].tracks.length) {
            tracks.push(models.Track.fromURI(getSpotifyID(songs[i])));
          }
        }
        playlist.tracks.add(tracks);
      });
    });
  }

  function aggregatePreferences(userURIList) {
    var allArtists  = { },
        promises    = [ ];

    for (var i = 0; i < userURIList.length; i++) {
      var promise = getUserStarredPlaylist(userURIList[i]);
      promises.push(promise);
    }

    models.Promise.join(promises)
    .each(function (playlist) {
      playlist.forEach(function (track) {
        track.artists.forEach(function (artist) {
          if (artist.uri in allArtists)
            allArtists[artist.uri]++;
          else
            allArtists[artist.uri] = 1;
        });
      });
    })
    .done(function (results) {
      tp.create(allArtists).done(function (id) {
        tp.getStaticPlaylist(id, 20).done(function (tracks) {
          savePlaylist('temp_pref', tracks);
        });
      });
    });
  }

  function aggregateRecommendations(userURIList) {
    var allArtists    = { },
        artistCollection = [ ],
        trackPromises = [ ],
        promises      = [ ],
        playlist      = [ ],
        catalogIDs    = [ ];

    var numSongs = 5; // Should be a function of the numbe of people in group

    for (var i = 0; i < userURIList.length; i++) {
      var promise = getUserStarredPlaylist(userURIList[i]);
      promises.push(promise);
    }

    models.Promise.join(promises)
    .each(function (playlist) {
      playlist.forEach(function (track) {
        track.artists.forEach(function (artist) {
          if (artist.uri in allArtists)
            allArtists[artist.uri]++;
          else
            allArtists[artist.uri] = 1;
        });
      });
      artistCollection.push(allArtists);
      allArtists = { };
    })
    .done(function (results) {
      artistCollection.forEach(function (collection) {
        tp.create(collection).done(function (id) {
          catalogIDs.push(id);
        })
        .done(function (collection) {
          if (catalogIDs.length === artistCollection.length) {
            console.log('catalogIDs: ', catalogIDs);
            catalogIDs.forEach(function (catalogID) {
              tp.getStaticPlaylist(catalogID, numSongs)
              .done(function (tracks) {
                tracks.forEach(function (track) {
                  playlist.push(track);
                });
              })
              .done(function (tracks) {
                if (playlist.length === (catalogIDs.length * numSongs)) {
                  savePlaylist('temp_rec', playlist);
                }
              });
            });
          };
        });
      });
    });


  }
  /****************************************************************************/


  /* This section implements the drag and drop functionality
   *
   *
   *
   * */
  function getGroupList() {
    var groupList = document
      .getElementById('group-list')
      .getElementsByTagName('li');
    var groupListArray = [ ];
    for(var i = 0; i < groupList.length; i++) {
        var groupListElement = groupList[i].getElementsByTagName('a')[0];
        groupListArray.push(groupListElement.href);
    }
    return groupListArray;
  }
  /****************************************************************************/


  /* This section implements ...
   *
   *
   *
   * */
  document.getElementById('aggregate-pref').addEventListener('click', function(){
    var groupList = getGroupList();
    if (groupList.length !== 0)
      aggregatePreferences(groupList);
  });

  document.getElementById('aggregate-rec').addEventListener('click', function(){
    var groupList = getGroupList();
    if (groupList.length !== 0)
      aggregateRecommendations(groupList);
  });

  document.getElementById('reset-taste').addEventListener('click', function(){
    tp.resetTaste();
  });
  /****************************************************************************/


});
