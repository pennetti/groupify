require([
  '$api/facebook',
  '$api/models',
  '$views/buttons#Button',
  '$views/throbber#Throbber',
  '/js/tasteprofile#TasteProfile',
  '/js/playlistcontainer#PlaylistContainer'
], function(facebook, models, Button, Throbber, TasteProfile, PlaylistContainer) {

  'use strict';

  var FriendList = function() {

  };

  var tp = new TasteProfile();
  var pc = new PlaylistContainer();
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

  facebook.session.load('friends')
  .done(function(facebookSession) {
    facebookSession.friends.snapshot()
    .done(function(friends) {
      friends.toArray().forEach(function(friend) {
        if (friend.user) {
          createFriendLink(friend, createFriendListItem);
        }
      });
    });
  });

  function createFriendLink(friend, listItemCallback) {
    var facebookFriends = document.getElementById('friend-list'),
        friendStarredPlaylistURI = friend.user.uri + ':starred';

    models.Playlist.fromURI(friendStarredPlaylistURI)
    .load('tracks')
    .done(function(playlist) {
      playlist.tracks.snapshot(1)
      .done(function(snapshot) {
        if (snapshot.length)
          listItemCallback(
            friendStarredPlaylistURI,
            friend.name,
            facebookFriends
          );
      });
    });
  }


  // var friendList = document.getElementById('friend-list'),
  //     throbber = Throbber.forElement(friendList);
  // facebook.session.load('friends')
  // .done(function(facebookSession) {
  //   facebookSession.friends
  //   .snapshot().done(function(friends) {
  //     createFriendList(friends.toArray().sort())
  //     .done(function() {
  //       throbber.hide();
      // });
  //   });
  // });

  // function createFriendList(friends) {
  //   var facebookFriends = document.getElementById('friend-list'),
  //       promise =  new models.Promise(),
  //       friendsLength = friends.length,
  //       friendStarredPlaylistUri,
  //       friendsProcessed = 0,
  //       promises = [ ];

  //   friends.forEach(function(friend) {
  //     friendsProcessed++;
  //     if (friend.user) {
  //       friendStarredPlaylistUri = friend.user.uri + ':starred';
  //       getPlaylistLength(friendStarredPlaylistUri)
  //       .done(function(playlistLength) {
  //         if (playlistLength) {
  //           createFriendListItem(
  //             friendStarredPlaylistUri,
  //             friend.name,
  //             facebookFriends
  //           );
  //         }
  //       })
  //       .done(function(playlistLength) {
  //         if (friendsProcessed === friendsLength) {
  //           promise.setDone(); // Still doesn't work
  //         }
  //       });
  //     }
  //   });

  //   return promise;
  // }

  // function getPlaylistLength(playlistUri) {
  //   var promise = new models.Promise();

  //   models.Playlist.fromURI(playlistUri)
  //   .load('tracks')
  //   .done(function(playlist) {
  //     playlist.tracks.snapshot(1)
  //     .done(function(snapshot) {
  //       promise.setDone(snapshot.length);
  //     });
  //   });

  //   return promise;
  // }

  function createFriendListItem(link, text, parent) {
    var li = document.createElement('li'),
        a = document.createElement('a');

    a.href = link;
    a.draggable = true;
    a.innerHTML = text;

    li.className = 'ui-state-highlight';
    li.appendChild(a);

    parent.appendChild(li);
  }

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

  // Experimental
  function aggregateTrackPreferences(userUriObj) {
    var userUris = Object.keys(userUriObj),
        promises = [ ],
        tracks = [ ];

    userUris.forEach(function(userUri) {
      promises.push(getUserStarredPlaylist(userUri));
    });

    models.Promise.join(promises)
    .each(function(playlist) {
      playlist.forEach(function(track) {
        tracks.push(track.uri);
      });
    })
    .done(function(results) {
      tp.createFromTracks(tracks)
      .done(function(id) {
        tp.getStaticPlaylist(id, 50)
        .done(function(tracks) {
          pc.createTemporaryPlaylist(tracks);
        });
      });
    });
  }

  function aggregateArtistPreferences(userUriObj) {
    var userUris = Object.keys(userUriObj),
        allArtists = { },
        promises = [ ];

    userUris.forEach(function(userUri) {
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
      tp.createFromArtists(allArtists)
      .done(function(id) {
        tp.getStaticPlaylist(id, 50)
        .done(function(tracks) {
          pc.createTemporaryPlaylist(tracks);
        });
      });
    });
  }

  function aggregateArtistRecommendations(userUriObj) {
    var tracksPerUser = Math.round(50 / Object.keys(userUriObj).length),
        userUris = Object.keys(userUriObj),
        artistCollection = [ ],
        allArtists = { },
        catalogIds = [ ],
        playlist = [ ],
        promises = [ ];

    userUris.forEach(function(userUri) {
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
        tp.createFromArtists(collection)
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
                  pc.createTemporaryPlaylist(playlist);
                }
              });
            });
          }
        })
        .fail(function(collection) {
          // Unable to make a taste profile, user does not have enough artists
        });
      });
    });
  }

  function getGroupMemberUris() {
    var groupList = document
      .getElementById('group-list')
      .getElementsByTagName('li'),
        groupUris = { };

    for (var i = 0, len = groupList.length; i < len; i++) {
        var groupMember = groupList[i].getElementsByTagName('a')[0];
        groupUris[groupMember.href] = groupMember.innerHTML;
    }

    return groupUris;
  }

  // TODO: change these to Spotify buttons
  document.getElementById('aggregate-artist-pref')
  .appendChild(Button.withLabel('Aggregate Preferences').node)
  .addEventListener('click', function() {
    var groupMemberUris = getGroupMemberUris();
    if (Object.keys(groupMemberUris).length) {
      aggregateArtistPreferences(groupMemberUris);
    }
  });

  document.getElementById('aggregate-artist-rec')
  .appendChild(Button.withLabel('Aggregate Recommendations').node)
  .addEventListener('click', function() {
    var groupMemberUris = getGroupMemberUris();
    if (Object.keys(groupMemberUris).length) {
      aggregateArtistRecommendations(groupMemberUris);
    }
  });
});
