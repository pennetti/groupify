require([
  '$api/models',
  '/js/echonest'
], function(models, echonest) {
  'use strict';

  var TasteProfile = function (en) {
    this.en = new echonest.EchoNest('VO9NDXU6IZBMOMI2X');
  };

  TasteProfile.prototype.create = function (artists) {
    var blocks  = getArtistUpdateBlock(artists),
        promise = new models.Promise(),
        _this   = this;

    if (artists.length < 3) {
      alert('Sorry, need at least 3 artists. More is better.');
    } else {
      // TODO: might need to change naming scheme
      var catName = 'manual-' + Math.round(Math.random() * 10000000);
      _this.en.catalog.create(catName,
        function (data) {
          var id = data.response.id;
          _this.updateTasteProfile(id, blocks).done(function () {
            promise.setDone(id);
          });
        },

        function (data) {
          // Couldn't create catalog
        }
      );
    }
    return promise;
  };

  // TODO: make a method like this for tracks
  var getArtistUpdateBlock = function (artists) {
    var blocks  = [ ],
        index   = 0;

    Object.keys(artists).forEach(function (artist) {
      var artistID = artist.trim().replace('spotify', 'spotify-WW');
      var item = {
        action : 'update',
        item : {
          item_id : 'item-' + index,
          artist_name: artistID,
          play_count: artists[artist],  // Test if this has an effect
          favorite : true
        }
      }
      index++;
      blocks.push(item);
    });
    return blocks;
  }

  TasteProfile.prototype.updateTasteProfile = function (id, blocks) {
    var promise = new models.Promise(),
        _this   = this;

    _this.en.catalog.addArtists(id, blocks,
      function (data) {
        var ticket = data.response.ticket;
        _this.en.catalog.pollForStatus(ticket,
          function (data) {
            if (data.response.ticket_status === 'pending') {
              // Loading...
            } else if (data.response.ticket_status === 'complete') {
              promise.setDone({});
              // console.log('update complete');
            } else {
              // Can't resolve taste profile
              promise.setFail(this);
            }
          },

          function () {
            // Trouble waiting for catalog
          }
        );
      },

      function (data) {
        // Trouble adding artists to catalog
      }
    );
    // console.log('update promise: ', promise);
    return promise;
  };

  // about to add callback to this function and change the pl size to a param,
  // move getspotifyid and saveplaylist methods to main.js and pa
  TasteProfile.prototype.getStaticPlaylist = function (id, results) {
    var _this = this,
        promise = new models.Promise();

    _this.en.playlist.static(id, results,
      function(data) {
        promise.setDone(data.response.songs);
      },

      function(data) {
        // Trouble making playlist from catalog
        promise.setFail(data);
      }
    );
    // console.log('static playlist promise: ', promise);
    return promise;
  };

  TasteProfile.prototype.resetTaste = function (id) {
    var _this = this;

    _this.en.catalog.delete(id,
      function (data) {
        // Success
      },

      function (data) {
        // Fail
      }
    );
  };

  exports.TasteProfile = TasteProfile;
});
