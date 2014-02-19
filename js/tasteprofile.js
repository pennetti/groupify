// require([
//   '$api/models',
//   '/js/echonest',
// ], function(models, en) {
// 'use strict';
// var  tasteprofile = (function(){

// jQuery.ajaxSettings.traditional = true;
// var api_key = 'NO_API_KEY';
// // var en = en;
// var curSong = null;
// var maxTimeForSkip = 3000;
// var cookieOpts = {expires:365, path: '/' };
// var catalogID = 'CALQHEI13DB585AFEA';

// Object.prototype.foo = function() {console.log("***");}

Object.prototype.createTasteProfile = function(artistList) {
  // var blocks = getArtistUpdateBlock();
  console.log("Creating Taste Profile...");

  if (artistList.length <= 2) {
    alert("Sorry, need at least 3 artists. More is better");
  } else {
    console.log("Creating your very own Taste Profile");
    var catName = 'manual-' + Math.round(Math.random() * 10000000);
    // en.catalog.create(catName,
    //   function(data) {
    //     var catalogID = data.response.id;
    //     updateTasteProfile(catalogID, artistList);
    //   },

    //   function(data) {
    //     console.log("Couldn't create catalog " + catName);
    //   }
    // );
  }
}

// exports.createTasteProfile = createTasteProfile;

// Object.prototype.getArtistUpdateBlock = function () {
//   var artists = $("#artists").val();
//   artists = artists.split(",");
//   var blocks = [];
//   $.each(artists,
//     function(index, artist) {
//       var artist = $.trim(artist);
//       var item = {
//         action : 'update',
//         item : {
//           item_id : 'item-' + index,
//           artist_name: artist,
//           favorite : true
//         }
//       }
//       blocks.push(item);
//     }
//   );
//   return blocks;
// }

// Object.prototype.updateTasteProfile = function (id, blocks) {
//   var progressBar = $("#progress-bar");
//   console.log("Uploading your taste to The Echo Nest");
//   progressBar.css('width', '20%');

//   en.catalog.addArtists(id, blocks,
//     function(data) {
//       var ticket = data.response.ticket;
//       en.catalog.pollForStatus(ticket,
//         function(data) {
//           if (data.response.ticket_status === 'pending') {
//             var percent = 20 + Math.round(80 * data.response.percent_complete / 100.0)
//             console.log("Resolving artists " + percent + " % complete");
//             progressBar.css('width', percent  + '%');
//           } else if (data.response.ticket_status === 'complete') {
//             progressBar.css('width', '100%');
//             console.log("Done!");
//             tasteProfileReady(id);
//           } else {
//             error("Can't resolve taste profile " + data.response.details);
//           }
//         },
//         function() {
//           error("Trouble waiting for catalog");
//         }
//       );
//     },

//     function(data) {
//       error("Trouble adding artists to catalog");
//     });
// }

// function tasteProfileReady(id) {
//   console.log("We've got everything we need, here we go ...");
//   catalogID = id;
//   $.cookie('tpdemo_catalog_id', id, {expires:365, path: '/' });
//   startPlaying();
// }


// Object.prototype.resetTaste = function () {
//   // $.removeCookie('tpdemo_catalog_id', cookieOpts);
//   en.catalog.delete(catalogID,
//     function() {
//       console.log("Your taste has been deleted");
//     },

//     function(data) {
//       error('trouble deleting catalog ', data);
//     }
//   );
//   setTimeout(function() {
//     needCatalog();
//     $('#resetModal').modal('hide')
//   }, 500);
// }

// });
// $(document).ready(function() {
//     // fetchApiKey will fetch the Echo Nest demo key for demos
//     // hosted on The Echo Nest, otherwise it fetch an empty key
//     fetchApiKey( function(key, isLoggedIn) {
//         var trackStartTime = now();
//         if (!key) {
//             key = 'MY_ECHO_NEST_API_KEY';
//         }

//         api_key = key;
//         en = new EchoNest(api_key);
//         $.ajaxSetup( {cache: false});
//     });
// });

  // return my;

// });

