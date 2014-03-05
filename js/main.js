require([
  '$api/facebook',
  '$api/models',
  '$views/throbber#Throbber',
  '/js/tasteprofile',
  '/js/playlistcontainer'
], function(facebook, models, Throbber, tasteprofile, playlistcontainer) {

  'use strict';

  // this.pc = new playlistcontainer.PlaylistContainer();
  // this.tp = new tasteprofile.TasteProfile();
  // this. = new tasteprofile.TasteProfile();



  var FriendList = function() {

  };

  var tp = new tasteprofile.TasteProfile();
  var pc = new playlistcontainer.PlaylistContainer();
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

  facebook.session.load('friends').done(function(facebookSession) {
    facebookSession.friends.snapshot().done(function(friends) {
      friends.toArray().forEach(function(friend) {
        if (friend.user) {
          createFriendLink(friend, createFriendListItem);
        }
      });
    })/* .fail(); */;
  });

  function createFriendLink(friend, listItemCallback) {
    var facebookFriends = document.getElementById('friend-list'),
        friendStarredPlaylistURI = friend.user.uri + ':starred';

    models.Playlist.fromURI(friendStarredPlaylistURI)
    .load('tracks')
    .done(function(playlist) {
      playlist.tracks.snapshot(1)
      .done(function(snapshot) {
        if (snapshot.length !== 0)
          listItemCallback(
            friendStarredPlaylistURI,
            friend.name,
            facebookFriends
          );
      })/* .fail(); */;
    })/* .fail(); */;
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
  //     });
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
        tp.getStaticPlaylist(id, 50)
        .done(function(tracks) {
          pc.createTemporaryPlaylist(tracks);
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
                  pc.createTemporaryPlaylist(playlist);
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

  document.getElementById('save-playlist')
  .addEventListener('click', function() {
    pc.savePlaylist();
    this.disabled = true;
  });
  /****************************************************************************/
});
