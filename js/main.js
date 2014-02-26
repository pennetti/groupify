require([
  '$api/facebook',
  '$api/models',
  '$views/throbber',
  '/js/tasteprofile'
], function(facebook, models, throbber, tasteprofile) {
  'use strict';

  /* This section retrieves the logged-in user's friends list from Facebook...
   *
   *
   *
   * */
  var facebookFriends = document.getElementById('facebook-friends');
  var throb = throbber.Throbber.forElement(facebookFriends);
  facebook.session.load('friends').done(function(facebookSession) {
    facebookSession.friends.snapshot()
    .done(function(friends) {
      friends.toArray().forEach(function(friend) {
        if (friend.user != null) {
          createFriendLink(friend, createFriendsListItem);
        }
      });
      throb.hide();
    })/* .fail(); */;
  });

  function createFriendLink(friend, listItemCallback) {
    var friendStarredPlaylistURI = friend.user.uri + ":starred";

    models.Playlist.fromURI(friendStarredPlaylistURI).load('tracks')
    .done(function(playlist) {
      playlist.tracks.snapshot(0, 1)
      .done(function(snapshot) {
        if (snapshot.length !== 0) {
          listItemCallback(friendStarredPlaylistURI, friend.name);
        }
      })/* .fail(); */;
    })/* .fail(); */;
  }

  function createFriendsListItem(link, text) {
    var a = document.createElement('a');
    a.href = link;
    // a.className = 'list-group-item';
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

var catalogID = '_CAT_ID_';

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
            if (artist.uri in allArtists)
              allArtists[artist.uri]++;
            else
              allArtists[artist.uri] = 1;
          });
        });
      });
      // console.log(allArtists); To return just artist uris use Object.keys()
      // var tp = new tasteprofile.TasteProfile();
      catalogID = tasteprofile.createTasteProfile(allArtists);
      // console.log(catalogID);
    });
  }

  function aggregateRecommendations(userURIList) {
    // TODO: implement
    tasteprofile.createTasteProfile(["spotify-WW:artist:3ICflSq6ZgYAIrm2CTkfVP"]);
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
    tasteprofile.getStaticPlaylist();
    // aggregateRecommendations(getGroupList());
    // tasteprofile.createDynamicPlaylist();

  });

  document.getElementById('reset-taste').addEventListener('click', function(){
    tasteprofile.resetTaste();
  });
  /****************************************************************************/


});
