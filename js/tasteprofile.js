require([
  '$api/models#Promise',
  '/js/echonest#EchoNest'
], function(Promise, EchoNest) {

  'use strict';

  // TODO: move api key to config file
  var TasteProfile = function(en) {
    this.en = new EchoNest('VO9NDXU6IZBMOMI2X');
  };

  // TODO: change constructor to take no parameters, call update separately??
  // OR make a generic function to get blocks for tracks or artists
  TasteProfile.prototype.createFromArtists = function(artists) {
    var blocks = getArtistUpdateBlock(artists),
        promise = new Promise(),
        _this = this,
        profileName;

    if (Object.keys(artists).length < 3) {
      promise.setFail({ });
    } else {
      profileName = 'profile-' + _this.en.now();
      _this.en.catalog.create(profileName, 'artist',
        function(data) {
          var id = data.response.id;
          _this.updateTasteProfile(id, blocks)
          .done(function() {
            promise.setDone(id);
          });
        },

        function(data) {
          // Couldn't create catalog
        }
      );
    }

    return promise;
  };

  // TODO: make a method like this for tracks
  function getArtistUpdateBlock(artists) {
    var blocks = [ ];

    Object.keys(artists).forEach(function(artist, index) {
      var artistId = artist.trim().replace('spotify', 'spotify-WW'),
          item = {
        action: 'update',
        item: {
          item_id: 'item-' + index,
          artist_name: artistId,
          play_count: artists[artist],  // Test if this has an effect
          favorite: true
        }
      };
      blocks.push(item);
    });
    return blocks;
  }

  // Experimental
  // TODO: switch to include artist id as well
  TasteProfile.prototype.createFromTracks = function(tracks) {
    var blocks = getTrackUpdateBlock(tracks),
        promise = new Promise(),
        _this = this;

    if (tracks.length < 3) {
      promise.setFail({ });
    } else {
      // TODO: might need to change naming scheme
      var profileName = 'manual-' + new Date().getTime();
      _this.en.catalog.create(profileName, 'general',
        function(data) {
          var id = data.response.id;
          _this.updateTasteProfile(id, blocks)
          .done(function() {
            promise.setDone(id);
          });
        },

        function(data) {
          // Couldn't create catalog
        }
      );
    }

    return promise;
  };

  function getTrackUpdateBlock(tracks) {
    var blocks = [ ];

    tracks.forEach(function(track, index) {
      var trackId = track.trim().replace('spotify', 'spotify-WW');
      var item = {
        action: 'update',
        item: {
          item_id: 'item-' + index,
          song_id: trackId,
          favorite: true
        }
      };
      blocks.push(item);
    });

    return blocks;
  }

  TasteProfile.prototype.updateTasteProfile = function(id, blocks) {
    var promise = new Promise(),
        _this = this;

    _this.en.catalog.addArtists(id, blocks,
      function(data) {
        var ticket = data.response.ticket;
        _this.en.catalog.pollForStatus(ticket,
          function(data) {
            if (data.response.ticket_status === 'pending') {
              // Loading...
            } else if (data.response.ticket_status === 'complete') {
              promise.setDone({});
            } else {
              promise.setFail(data); // Can't resolve taste profile
            }
          },

          function(data) {
            // Trouble waiting for catalog
          }
        );
      },

      function(data) {
        // Trouble adding artists to catalog
      }
    );

    return promise;
  };

  TasteProfile.prototype.getStaticPlaylist = function(id, results) {
    var _this = this,
        promise = new Promise();

    _this.en.playlist.static(id, results,
      function(data) {
        promise.setDone(data.response.songs);
      },

      function(data) {
        // Trouble making playlist from catalog
        promise.setFail(data);
      }
    );

    return promise;
  };

  // TODO: figure out if this can be called automatically after playlist is made
  TasteProfile.prototype.resetTaste = function(id) {
    var _this = this;

    _this.en.catalog.delete(id,
      function(data) {
        // Success
      },

      function(data) {
        // Fail
      }
    );
  };


  try { exports.TasteProfile = TasteProfile; }
  catch (e) { /* Ignore, this is to suppress warnings about 'exports' */ }
});
