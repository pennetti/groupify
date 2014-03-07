require([
  '$api/models#Playlist',
  '$api/models#Track',
  '$views/throbber#Throbber',
  '$views/buttons#Button',
  '$views/list#List'
  ], function(Playlist, Track, Throbber, Button, List) {

  'use strict';

  var PlaylistContainer = function() {
    var _this = this;

    _this.tracks = null;
    _this.list = null;
    _this.save = Button.withLabel('Save Playlist');

    document.getElementById('save-playlist')
    .addEventListener('click', function() {
      _this.savePlaylist();
      _this.save.setDisabled(true);
    });
  };

  function getSpotifyId(echonestId) {
    return echonestId
      .tracks[0].foreign_id
      .replace('spotify-WW', 'spotify');
  }

  PlaylistContainer.prototype.createTemporaryPlaylist = function(playlistTracks) {
    var playlistContainer = document.getElementById('playlist-container'),
        throbber = Throbber.forElement(playlistContainer),
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

        loadedPlaylist.tracks.add(tracks)
        .done(function(_playlist) {
          _this.list = List.forPlaylist(_playlist);
          throbber.hide();
          playlistContainer.appendChild(_this.list.node);
          _this.list.init();

          _this.initSaveButton();
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

  PlaylistContainer.prototype.initSaveButton = function() {
    var _this = this;

    _this.save.setDisabled(false);

    document.getElementById('save-playlist')
    .appendChild(_this.save.node);
  };


  try { exports.PlaylistContainer = PlaylistContainer; }
  catch (e) { /* Ignore, this is to suppress warnings about 'exports' */ }
});
