
class Router {
  constructor (routes) {
    this.routes = routes;
  }

  boot () {
    app.set('port', 5000);
    this.route();
    this.listen();
  }

  route () {
    _.each(this.routes.get, (Class, route) => {
      app.get(route, this.controllerResponse(Class));
    });

    _.each(this.routes.post, (method, route) => {
      app.post(route, method);
    });
    _.each(this.routes.use, (usable) => {
      app.use(usable);
    });
  }

  listen () {
    // Set up a port
    app.listen(app.get('port'), () => {
      console.log('Node app is running on port', app.get('port'));
    });
  }

  controllerResponse (SomeClass) {
    return (request, response) => {
      SomeClass.respond(request, response);
    };
  }
};

export default Router;
