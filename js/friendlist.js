require([
  '$api/facebook'
  ], function(facebook) {

  'use strict';

  // TODO: this is the facebook session for the current user but it may be the
  // case that the user's spotify account is not connected to their facebook
  // accountm this should be replaced with an auth call and Facebook app
  var FriendList = function() {

  };

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


  try { exports.PlaylistContainer = PlaylistContainer; }
  catch (e) { /* Ignore, this is to suppress warnings about 'exports' */ }
});