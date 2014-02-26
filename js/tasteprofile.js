require([
  '$api/models',
  '/js/echonest',
], function(models, echonest) {
  'use strict';

  var catalogID = 'CAODURO144537BE707';

  var en = new echonest.EchoNest('VO9NDXU6IZBMOMI2X');


  var TasteProfile = function (en) {
    // this.en = en;
    // this.catalogID = '_CATALOG_ID_';

  };

  TasteProfile.prototype.create = function (artists) {
    var blocks = getArtistUpdateBlock(artists);
    console.log("Creating Taste Profile...");

    if (artists.length <= 2) {
      alert("Sorry, need at least 3 artists. More is better");
    } else {
      console.log("Creating your very own Taste Profile");
      var catName = 'manual-' + Math.round(Math.random() * 10000000);
      en.catalog.create(catName,
        function(data) {
          var catalogID = data.response.id;
          updateTasteProfile(catalogID, blocks);
          console.log(catalogID);
          getStaticPlaylist(catalogID);
          return catalogID;
        },

        function(data) {
          console.log("Couldn't create catalog " + catName);
        }
      );
    }
  };

  var createTasteProfile = function (artists) {
    var blocks = getArtistUpdateBlock(artists);
    console.log("Creating Taste Profile...");

    if (artists.length <= 2) {
      alert("Sorry, need at least 3 artists. More is better");
    } else {
      console.log("Creating your very own Taste Profile");
      var catName = 'manual-' + Math.round(Math.random() * 10000000);
      en.catalog.create(catName,
        function(data) {
          var catalogID = data.response.id;
          updateTasteProfile(catalogID, blocks);
          console.log(catalogID);
          // getStaticPlaylist(catalogID);
          return catalogID;
        },

        function(data) {
          console.log("Couldn't create catalog " + catName);
        }
      );
    }
  };

  var getArtistUpdateBlock = function (artists) {
    var blocks = [ ];
    $.each(Object.keys(artists),
      function(index, artist) {
        var artistID = $.trim(artist).replace('spotify', 'spotify-WW');
        var item = {
          action : 'update',
          item : {
            item_id : 'item-' + index,
            artist_name: artistID,
            play_count: artists[artist],
            favorite : true
          }
        }
        blocks.push(item);
      }
    );
    return blocks;
  }

  var updateTasteProfile = function (id, blocks) {
    // var progressBar = $("#progress-bar");
    console.log("Uploading your taste to The Echo Nest");
    // progressBar.css('width', '20%');

    en.catalog.addArtists(id, blocks,
      function(data) {
        var ticket = data.response.ticket;
        en.catalog.pollForStatus(ticket,
          function(data) {
            if (data.response.ticket_status === 'pending') {
              // var percent = 20 + Math.round(80 * data.response.percent_complete / 100.0)
              // console.log("Resolving artists " + percent + " % complete");
              // progressBar.css('width', percent  + '%');
            } else if (data.response.ticket_status === 'complete') {
              // progressBar.css('width', '100%');
              console.log("Done!");
              tasteProfileReady(id);

            } else {
              console.log("Can't resolve taste profile " + data.response.details);
            }
          },
          function() {
            console.log("Trouble waiting for catalog");
          }
        );
      },

      function(data) {
        console.log("Trouble adding artists to catalog");
      });
  };

  var createDynamicPlaylist = function () {
    console.log("Creating the playlist ...");

    var args = {
      'bucket': [ 'id:spotify-WW', 'tracks' ],
      'limit' : true,
      'type':'catalog-radio',
      'seed_catalog' : catalogID,
    };

    en.playlist.create(args,
      function(data) {
        console.log(data);
          fetchNextTrack();
      },
      function() {
        console.log("Trouble creating playlist session");
      }
    );
  }

  var getNextTrack = function () {

  };

  var tasteProfileReady = function (id) {
    // console.log("We've got everything we need, here we go ...");
    catalogID = id;
    // $.cookie('tpdemo_catalog_id', id, {expires:365, path: '/' });
    // startPlaying();
  };

  var getStaticPlaylist = function () {
    en.playlist.static(catalogID, 20,
      function(data) {
        console.log(data.response.songs);
        console.log(data.response.songs[0]);
        savePlaylist('temp',data.response.songs)
      },

      function(data) {
        console.log(data);
        console.log('trouble making playlist from catalog ', data);
      }
    );
  };

  /* Reverse URI mapping from Echo Nest back to Spotify */
  function getSpotifyID(song) {
    var uri = song.tracks[0].foreign_id;
    return uri.replace('spotify-WW', 'spotify');
  }

  function savePlaylist(title, songs) {
    models.Playlist.create(title).done(function(playlist) {
      playlist.load("tracks").done(function(playlist) {
        var tracks = [];
        for (var i = 0; i < songs.length; i++) {
          if (songs[i].tracks.length > 0)
            tracks.push(models.Track.fromURI(getSpotifyID(songs[i])));
        }
        playlist.tracks.add(tracks);
      });
    });
  }

  var resetTaste = function () {
    // $.removeCookie('tpdemo_catalog_id', cookieOpts);
    en.catalog.delete(catalogID,
      function() {
        console.log("Your taste has been deleted");
      },

      function(data) {
        console.log('trouble deleting catalog ', data);
      }
    );
    // setTimeout(function() {
    //   needCatalog();
    //   $('#resetModal').modal('hide')
    // }, 500);
  };

  exports.createTasteProfile = createTasteProfile;
  exports.updateTasteProfile = updateTasteProfile;
  exports.getStaticPlaylist = getStaticPlaylist;
  exports.createDynamicPlaylist = createDynamicPlaylist;
  exports.resetTaste = resetTaste;
});
