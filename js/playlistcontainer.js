require([
  '$api/models#Playlist',
  '$api/models#Track',
  '$views/throbber#Throbber',
  '$views/list#List'
  ], function(Playlist, Track, Throbber, List) {

  'use strict';

  var PlaylistContainer = function() {
    this._tracks = null;
    this._list = null;
  };

  function getSpotifyId(echonestId) {
    return echonestId
      .tracks[0].foreign_id
      .replace('spotify-WW', 'spotify');
  }

  PlaylistContainer.prototype.createTemporaryPlaylist = function(playlistTracks) {
    var playlistContainer = document.getElementById('playlist-container'),
        savePlaylistButton = document.getElementById('save-playlist'),
        // throbber = Throbber.forElement(playlistContainer),
        _this = this;

    if (_this._tracks === null) _this._tracks = playlistTracks;

    Playlist.createTemporary('temp_' + new Date().getTime())
    .done(function(playlist) {
      playlist.load('tracks')
      .done(function(loadedPlaylist) {
        var tracks = [ ];
        playlistTracks.forEach(function(track) {
          if (track.tracks.length) {
            tracks.push(Track.fromURI(getSpotifyId(track)));
          }
        });

        loadedPlaylist.tracks.add(tracks).done(function(_playlist) {
          var list = List.forPlaylist(_playlist);
          // throbber.hide();
          playlistContainer.appendChild(list.node);
          list.init();
          savePlaylistButton.disabled = false;
        });
      });
    });
  };

  PlaylistContainer.prototype.savePlaylist = function() {
    var _this = this;

    Playlist.create('temp_' + new Date().getTime())
    .done(function(playlist) {
      playlist.load('tracks')
      .done(function(loadedPlaylist) {
        _this._tracks.forEach(function(track) {
          if (track.tracks.length) {
            loadedPlaylist.tracks.add(Track.fromURI(getSpotifyId(track)));
          }
        });
      });
    });
  };
  // };


  try { exports.PlaylistContainer = PlaylistContainer; }
  catch (e) { /* Ignore, this is to suppress warnings about 'exports' */ }
});
