describe('Artist Graph Module', function() {

  it('should set branching factor do default if not specified', function() {

    var ag = new ArtistGraph({},
      document.createElement('div'), {
        name: 'Anamanaguchi'
      }
    );

    expect(ag.branching).toBe(ag.DEFAULT_BRANCHING);
  });

  it('should set depth value do default if not specified', function() {

    var ag = new ArtistGraph({},
      document.createElement('div'), {
        name: 'Anamanaguchi'
      }
    );

    expect(ag.depth).toBe(ag.DEFAULT_DEPTH);
  });

  it('should set branching factor for graph', function() {
    var ag = new ArtistGraph({
        branching: 20
      },
      document.createElement('div'), {
        name: 'Anamanaguchi'
      }
    );

    expect(ag.branching).toBe(20);
  });

  it('should set depth factor for graph', function() {
    var ag = new ArtistGraph({
        depth: 2
      },
      document.createElement('div'), {
        name: 'Anamanaguchi'
      }
    );

    expect(ag.depth).toBe(2);
  });
});