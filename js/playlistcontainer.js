require([
  '$api/models#Playlist',
  '$api/models#Track',
  '$views/throbber#Throbber',
  '$views/list#List'
  ], function(Playlist, Track, Throbber, List) {

  'use strict';

  var PlaylistContainer = function() {
    this.tracks = null;
    this.list = null;
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

    if (_this.list) _this.list.destroy();
    _this.tracks = playlistTracks;

    Playlist.createTemporary('temp_' + new Date().getTime())
    .done(function(playlist) {
      playlist.load('tracks')
      .done(function(loadedPlaylist) {
        var tracks = [ ];
        _this.tracks.forEach(function(track) {
          if (track.tracks.length) {
            tracks.push(Track.fromURI(getSpotifyId(track)));
          }
        });

        loadedPlaylist.tracks.add(tracks).done(function(_playlist) {
          _this.list = List.forPlaylist(_playlist);
          // throbber.hide();
          playlistContainer.appendChild(_this.list.node);
          _this.list.init();

          savePlaylistButton.style.visibility = "visible";
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
        _this.tracks.forEach(function(track) {
          if (track.tracks.length) {
            loadedPlaylist.tracks.add(Track.fromURI(getSpotifyId(track)));
          }
        });
      });
    });
  };


  try { exports.PlaylistContainer = PlaylistContainer; }
  catch (e) { /* Ignore, this is to suppress warnings about 'exports' */ }
});
