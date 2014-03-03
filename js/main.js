require([
  '$api/facebook',
  '$api/models',
  '$views/throbber#Throbber',
  '$views/list#List',
  '/js/tasteprofile'
], function(facebook, models, Throbber, List, tasteprofile) {
  'use strict';

  var tp = new tasteprofile.TasteProfile();

  // TODO: make this a module
  // TODO: fix friends list throbber
  // TODO: change document.getElementById('el') calls to jqeury $('el') calls
  // TODO: limit group members, eliminate duplicates, only allow friends with more than 3 artists in favorites
  // TODO: make playlist size an option
  // TODO: add profile deletion, maybe put playlist inside app and allow to be saved rather than auto saving
  // TODO: add current user to list of potential group members
  // TODO: globalize playlist container

  // TODO: work on css

  // TODO: sort after async call is made
  function compare(a,b) {
    return a.name > b.name;
  }

  /* This section retrieves the logged-in user's friends list from Facebook...
   *
   *
   *
   * */
  var friendList = document.getElementById('facebook-friends'),
      throbber = Throbber.forElement(friendList);
  facebook.session.load('friends')
  .done(function(facebookSession) {
    facebookSession.friends
    .snapshot().done(function(friends) {
      createFriendList(friends.toArray().sort())
      .done(function() {
        throbber.hide();
      });
    });
  });

  function createFriendList(friends) {
    var facebookFriends = document.getElementById('facebook-friends'),
        promise =  new models.Promise(),
        friendsLength = friends.length,
        friendStarredPlaylistUri,
        friendsProcessed = 0,
        promises = [ ];

    friends.forEach(function(friend) {
      friendsProcessed++;
      if (friend.user) {
        friendStarredPlaylistUri = friend.user.uri + ':starred';
        getPlaylistLength(friendStarredPlaylistUri)
        .done(function(playlistLength) {
          if (playlistLength) {
            createFriendListItem(
              friendStarredPlaylistUri,
              friend.name,
              facebookFriends
            );
          }
        })
        .done(function(playlistLength) {
          if (friendsProcessed === friendsLength) {
            promise.setDone(this);
          }
        });
      }
    });

    return promise;
  }

  function getPlaylistLength(playlistUri) {
    var promise = new models.Promise();

    models.Playlist.fromURI(playlistUri)
    .load('tracks')
    .done(function(playlist) {
      playlist.tracks.snapshot(1)
      .done(function(snapshot) {
        promise.setDone(snapshot.length);
      });
    });

    return promise;
  }

  function createFriendListItem(link, text, parent) {
    var a = document.createElement('a'),
        li = document.createElement('li');

    a.href = link;
    a.draggable = true;
    a.innerHTML = text;

    li.className = 'ui-state-highlight';
    li.appendChild(a);

    parent.appendChild(li);
  }
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
    var playlistContainer = document.getElementById('playlist-container'),
        throbber = Throbber.forElement(playlistContainer);

    models.Playlist.createTemporary(playlistTitle + new Date().getTime())
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
          playlistContainer.appendChild(list.node);
          throbber.hide();
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
    var tracksPerUser = Math.round(50 / userUriList.length),
        artistCollection = [ ],
        catalogIds = [ ],
        playlist = [ ],
        promises = [ ],
        allArtists = { };

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


  /* This section implements ...
   *
   *
   *
   * */
  function getGroupMemberUris() {
    var groupMembers = document
      .getElementById('group-list')
      .getElementsByTagName('li'),
        groupMemberUris = [ ];

    for (var i = 0, len = groupMembers.length; i < len; i++) {
        var groupMember = groupMembers[i]
          .getElementsByTagName('a')[0];
        groupMemberUris.push(groupMember.href);
    }

    return groupMemberUris;
  }

  document.getElementById('aggregate-pref')
  .addEventListener('click', function() {
    var groupMemberUris = getGroupMemberUris();
    if (groupMemberUris.length) aggregateArtistPreferences(groupMemberUris);
  });

  document.getElementById('aggregate-rec')
  .addEventListener('click', function() {
    var groupMemberUris = getGroupMemberUris();
    if (groupMemberUris.length) aggregateArtistRecommendations(groupMemberUris);
  });
  /****************************************************************************/
});
