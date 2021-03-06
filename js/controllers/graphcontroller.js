require([
  'js/controllers/controller#controller',
  '$api/models',
  '$views/throbber#Throbber',
  'js/models/artistgraph#ArtistGraph'
], function(
  Controller,
  models,
  Throbber,
  ArtistGraph) {

  /** 
    Controller for the Graph UI component

    Extends the controllers.Controller generic class
  */
  var GraphController = function(name, config) {
    Controller.call(this, name, config);

    this.options = config.options;

    this.customEvents = [];
    this.graphevents = [];
  };

  GraphController.prototype = Object.create(Controller.prototype);

  GraphController.BASE_URL =
    'http://developer.echonest.com/api/v4/artist/terms';
  GraphController.API_KEY = '29N71ZBQUW4XN0QXF';

  // parameter settings is a dependency.
  // this means that at this point (when loadController runs)
  // the settings' DOM element will be done loading
  GraphController.prototype.loadController = function() {
    models.player.load('track')
      .done(this, function(player) {

        // this.nowplayingArtist refers to the artist
        // of the current playing track
        this.nowplayingArtist = player.track.artists[0];
        this.newGraph(this.nowplayingArtist);
      });
  };

  // this.updateView
  // Redraws the graph and centers the throbber if being shown.
  // This is useful when the window is being resized and
  // the throbbers is not aligned at the center of the screen.
  GraphController.prototype.updateView = function() {
    if (this.artistgraph) {
      this.artistgraph.redrawGraph();

      if (this.artistgraph.throbber)
        this.artistgraph.throbber.setPosition('center', 'center');
    }
  };

  /**
      Set artist from the current playing track.
      Creates this.artistgraph object.

      The parameter artist (if defined) is used as the root node.
      Otherwise, the this.nowplayingArtist is used.
    */
  GraphController.prototype.newGraph = function(artist) {
    var config = {
      options: this.options
    };

    // if the artistGraph object as already been defined
    // then use the previous settings
    if (this.artistgraph) {
      config.branching = this.artistgraph.branching;
      config.depth = this.artistgraph.depth;
      config.treemode = this.artistgraph.treemode;
    }

    this.artistgraph = new ArtistGraph(
      this.element,
      artist,
      config
    );

    this.showThrobber();
    this.artistgraph.buildGraph(
      this.hideThrobber.bind(this)
    );

    this.bindAllEvents();
  };
  // Updates the graph given the new config values
  GraphController.prototype.updateGraph = function(config) {
    this.showThrobber();
    this.artistgraph.updateGraph(config,
      this.hideThrobber.bind(this)
    );
  };
  // Updates graph's data (nodes and edges)
  GraphController.prototype.updateData = function() {
    this.artistgraph.updateData();
  };
  GraphController.prototype.updateNodes = function() {
    this.artistgraph.updateNodes();
  };

  GraphController.prototype.getData = function() {
    return this.artistgraph.data;
  };

  GraphController.prototype.fetchTags = function(artistURI, sortType) {
    // Paul Lamere
    // http://developer.echonest.com/forums/thread/353
    // Artist terms (tags) -> 
    //      what is the difference between weight and frequency
    //                          (values of sortType)

    // term frequency is directly proportional to how often 
    // that term is used to describe that artist. 
    // Term weight is a measure of how important that term is 
    // in describing the artist. As an example of the difference, 
    // the term 'rock' may be the most frequently applied term 
    // for The Beatles. However, 'rock' is not very descriptive 
    // since many bands have 'rock' as the most frequent term. 
    // However, the most highly weighted terms for The Beatles 
    // are 'merseybeat' and 'british invasion', which give you 
    // a better idea of what The Beatles are all about 
    // than 'rock' does. 
    // We don't publish the details of our algorithms, 
    // but I can tell you that frequency is related to the 
    // simple counting of appearance of a term, whereas 
    // weight is related to TF-IDF as described 
    // here (http://en.wikipedia.org/wiki/Tf%E2%80%93idf).

    // the url to query echonest's API.
    // the list of tags are being sorted by weight.
    return $.ajax({
      url: GraphController.BASE_URL + '?' +
        'api_key=' + GraphController.API_KEY + '&' +
        'format=json' + '&' +
        'sort=' + sortType + '&' +
        'id=' + artistURI.replace('spotify', 'spotify-WW')
    });
  };

  // Expands the specific given artist in the graph.
  // the artist is required to be in the graph
  GraphController.prototype.expandNode = function(artist) {
    this.artistgraph.expandNode(
      0,
      artist,
      this.updateData.bind(this)
    );
  };
  // Displays a loading throbber and hides the graph canvas
  GraphController.prototype.showThrobber = function() {
    if (this.throbber)
      this.throbber.hide();

    this.throbber =
      Throbber.forElement($('.loading-wrapper')[0]);

    this.throbber.setPosition('center', 'center');
    this.throbber._addBackground();
  };
  GraphController.prototype.hideThrobber = function() {
    if (this.throbber)
      this.throbber.hide();
  };

  GraphController.prototype.highlightNodes = function(nodes) {
    _.each(nodes, this.highlightNode);
    this.updateNodes();
    _.each(nodes, this.unHighlightNode);
  };
  GraphController.prototype.unHighlightNodes = function(nodes) {
    _.each(nodes, this.unHighlightNode);
    this.updateNodes();
  };
  GraphController.prototype.highlightArtist = function(artist) {
    this.highlightNode(this.artistgraph.getNode(artist));
  };
  GraphController.prototype.highlightNode = function(node) {
    if (node.isRoot)
      node.color = {
        border: '#7fb701'
      };
    else
      node.color = {
        border: '#7fb701',
        background: '#313336'
      };
  };
  GraphController.prototype.unHighlightNode = function(node) {
    if (node.isRoot)
      node.color = {
        highlight: {
          border: '#7fb701'
        }
      };
    else
      node.color = {
        background: '#313336',
        highlight: {
          border: '#7fb701'
        }
      };
  };

  // Events

  // Binds all the events related to the graph component.
  GraphController.prototype.bindAllEvents = function() {
    this.artistgraph.onGraph('doubleClick',
      this.events.onNodeDoubleClick.bind(this));

    var onPlayerChange = this.events.onPlayerChange.bind(this);
    models.player.addEventListener('change', function(player) {
      models.player.load('track').done(onPlayerChange);
    });

    var onItemDropped = this.events.onItemDropped.bind(this);
    models.application.addEventListener('dropped', function() {
      models.application.load('dropped').done(onItemDropped);
    });

    _.each(this.graphevents, function(event) {
      this.artistgraph.onGraph(event.eventName, event.eventHandler);
    }, this);

    _.each(this.customEvents, function(event) {
      this.artistgraph.on(event.eventName, event.eventHandler);
    }, this);
  };

  // Adds eventName to the ArtistGraph object given eventHandler,
  // as a graph event.
  GraphController.prototype.addGraphEvent = function(eventName, eventHandler) {
    this.artistgraph.onGraph(eventName, eventHandler);

    this.graphevents.push({
      eventName: eventName,
      eventHandler: eventHandler
    });
  };

  // Adds eventName to the ArtistGraph object given eventHandler,
  // as a custom event. The event should be run by ArtistGraph
  // accordingly.
  GraphController.prototype.addCustomGraphEvent = function(eventName, eventHandler) {
    this.customEvents.push({
      eventName: eventName,
      eventHandler: eventHandler
    });
  };

  GraphController.prototype.events = {

    // Event for double clicking a graph node
    onNodeDoubleClick: function(data) {

      // find the clicked node.
      var node = _.findWhere(this.artistgraph.data.nodes, {
        id: parseInt(data.nodes[0])
      });

      // ignore event if it's the same artist
      if (!node || this.nowplayingArtist.uri === node.artist.uri)
        return;

      // play top list tracks from artist.
      node.artist.load('compilations').done(function(artist) {
        models.player.playContext(artist.compilations);
      });
    },

    // Spotify events

    // When the player changes the playing track,
    // update this.nowplayingArtist with the track's artist.
    onPlayerChange: function(player) {

      if (!player.track)
        return;

      // ignore change if it's playing an ad.
      if (player.track.advertisement)
        return;

      this.nowplayingArtist = player.track.artists[0];
    },

    // When spotify items (artist, track, album)
    // are dropped to the application
    // draw the graph of the artist of the item.
    // note: item can be an artist, track or album.
    onItemDropped: function(application) {
      var itemURI = application.dropped[0].uri;

      if (itemURI.contains('artist')) {
        models.Artist.fromURI(itemURI).load('name')
          .done(this, this.newGraph);
      } else if (itemURI.contains('track')) {
        models.Track.fromURI(itemURI).load('artists')
          .done(this, function(track) {
            track.artists[0].load('name')
              .done(this, this.newGraph);
          });
      } else if (itemURI.contains('album')) {
        models.Album.fromURI(itemURI).load('artists')
          .done(this, function(album) {
            album.artists[0].load('name')
              .done(this, this.newGraph);
          });
      }
    }

  };

  GraphController.prototype.constructor = GraphController;

  exports.graphcontroller = GraphController;
});