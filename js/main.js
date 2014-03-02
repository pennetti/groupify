require([
  '$api/facebook',
  '$api/models',
  '$views/throbber',
  '$views/list#List',
  '/js/tasteprofile'
], function(facebook, models, throbber, List, tasteprofile) {
  'use strict';

  var tp = new tasteprofile.TasteProfile();

  // TODO: make this a module
  // TODO: fix friends list throbber
  // TODO: change document.getElementById('el') calls to jqeury $('el') calls
  // TODO: limit group members, eliminate duplicates, only allow friends with more than 3 artists in favorites
  // TODO: make playlist size an option
  // TODO: add profile deletion, maybe put playlist inside app and allow to be saved rather than auto saving
  // TODO: add current user to list of potential group members

  // TODO: work on css

  /* This section retrieves the logged-in user's friends list from Facebook...
   *
   *
   *
   * */
  facebook.session.load('friends').done(function(facebookSession) {
    facebookSession.friends.snapshot().done(function(friends) {
      friends.toArray().forEach(function(friend) {
        if (friend.user) {
          createFriendLink(friend, createFriendsListItem);
        }
      });
    })/* .fail(); */;
  });

  function createFriendLink(friend, listItemCallback) {
    var friendStarredPlaylistURI = friend.user.uri + ':starred';

    models.Playlist.fromURI(friendStarredPlaylistURI)
    .load('tracks')
    .done(function(playlist) {
      playlist.tracks.snapshot(1)
      .done(function(snapshot) {
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
    a.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text', this);
      e.dataTransfer.effectAllowed = 'copy';
      _dropData = this;
    }, false);

    var li = document.createElement('li');
    li.className = 'ui-state-highlight';
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
   // TODO: fix drag and drop bug where any playlist outside the app becomes
   // last _dropData
  var _dropData = null;
  // var dropBox = document.getElementById('drop-box');

  // dropBox.addEventListener('dragenter', function(e) {
  //   e.preventDefault();
  //   e.dataTransfer.dropEffect = 'copy';
  //   // this.classList.add('over'); // CSS classes to change appearance on drag
  // }, false);
  // dropBox.addEventListener('dragover', function(e) {
  //   e.preventDefault();
  //   e.dataTransfer.dropEffect = 'copy';
  //   return false;
  // }, false);
  // dropBox.addEventListener('dragleave', function(e) {
  //   e.preventDefault();
  //   // this.classList.remove('over');
  // }, false);
  // dropBox.addEventListener('drop', function(e) {
  //   e.preventDefault();

  //   var a = document.createElement('a');
  //   a.href = _dropData.href;
  //   a.innerHTML = _dropData.innerHTML;

  //   var li = document.createElement('li');
  //   li.appendChild(a);

  //   var groupList = document.getElementById('group-list');
  //   groupList.appendChild(li);

  //   _dropData = null;
  // }, false);
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
    .done(function(playlist) {
      playlist.tracks.snapshot()
      .done(function(snapshot) {
        snapshot.loadAll()
        .done(function(tracks) {
          promise.setDone(tracks);
        });
      });
    });

    return promise;
  }

  /* Reverse URI mapping from EchoNest back to Spotify */
  function getSpotifyId(echonestId) {
    return echonestId
      .tracks[0].foreign_id
      .replace('spotify-WW', 'spotify');
  }

  /* Create and save Spotify playlist */
  function savePlaylist(playlistTitle, playlistTracks) {
    playlistTitle = playlistTitle + Math.round(Math.random() * 10000000);

    models.Playlist.createTemporary(playlistTitle)
    .done(function(playlist) {
      playlist.load('tracks')
      .done(function(loadedPlaylist) {
        var tracks = [ ];
        playlistTracks.forEach(function(playlistTrack) {
          if (playlistTrack.tracks.length) {
            tracks.push(models.Track.fromURI(getSpotifyId(playlistTrack)));
          }
        });

        loadedPlaylist.tracks.add(tracks).done(function(_playlist) {
          var list = List.forPlaylist(_playlist);
          document.getElementById('playlist-container').appendChild(list.node);
          list.init();
        });
      });
    });
  }

  function aggregateArtistPreferences(userUriList) {
    var allArtists = { },
        promises = [ ];

    userUriList.forEach(function(userUri) {
      promises.push(getUserStarredPlaylist(userUri));
    });

    models.Promise.join(promises)
    .each(function(playlist) {
      playlist.forEach(function(track) {
        track.artists.forEach(function(artist) {
          if (artist.uri in allArtists) allArtists[artist.uri]++;
          else allArtists[artist.uri] = 1;
        });
      });
    })
    .done(function(results) {
      tp.create(allArtists).done(function(id) {
        tp.getStaticPlaylist(id, 50).done(function(tracks) {
          savePlaylist('temp_pref', tracks);
        });
      });
    });
  }

  function aggregateArtistRecommendations(userUriList) {
    var allArtists = { },
        playlist = [ ],
        promises = [ ],
        catalogIds = [ ],
        artistCollection = [ ],
        tracksPerUser = Math.round(50 / userUriList.length);

    userUriList.forEach(function(userUri) {
      promises.push(getUserStarredPlaylist(userUri));
    });

    models.Promise.join(promises)
    .each(function(playlist) {
      playlist.forEach(function(track) {
        track.artists.forEach(function(artist) {
          if (artist.uri in allArtists) allArtists[artist.uri]++;
          else allArtists[artist.uri] = 1;
        });
      });
      artistCollection.push(allArtists);
      allArtists = { };
    })
    .done(function(results) {
      artistCollection.forEach(function(collection) {
        tp.create(collection)
        .done(function(id) {
          catalogIds.push(id);
        })
        .done(function(collection) {
          if (catalogIds.length === artistCollection.length) {
            catalogIds.forEach(function(catalogId) {
              tp.getStaticPlaylist(catalogId, tracksPerUser)
              .done(function(tracks) {
                tracks.forEach(function(track) {
                  playlist.push(track);
                });
              })
              .done(function(tracks) {
                if (playlist.length === (catalogIds.length * tracksPerUser)) {
                  savePlaylist('temp_rec', playlist);
                }
              });
            });
          }
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
  function getGroupMemberUris() {
    // TODO: why doesn't forEach work here?
    var groupMembers = document
      .getElementById('group-list')
      .getElementsByTagName('li'),
        groupMemberUris = [ ];
    for(var i = 0; i < groupMembers.length; i++) {
        var groupMember = groupMembers[i].getElementsByTagName('a')[0];
        groupMemberUris.push(groupMember.href);
    }
    return groupMemberUris;
  }
  /****************************************************************************/


  /* This section implements ...
   *
   *
   *
   * */
  document.getElementById('aggregate-pref')
  .addEventListener('click', function() {
    var groupMemberUris = getGroupMemberUris();
    if (groupMemberUris.length !== 0)
      aggregateArtistPreferences(groupMemberUris);
  });

  document.getElementById('aggregate-rec')
  .addEventListener('click', function() {
    var groupList = getGroupMemberUris();
    if (groupList.length !== 0)
      aggregateArtistRecommendations(groupList);
  });

  document.getElementById('reset-taste')
  .addEventListener('click', function() {
    tp.resetTaste();
  });
  /****************************************************************************/
});
