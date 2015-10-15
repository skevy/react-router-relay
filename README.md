# react-router-relay [![npm version](https://badge.fury.io/js/react-router-relay.svg)](http://badge.fury.io/js/react-router-relay)
[Relay](http://facebook.github.io/relay/) integration for [React Router](http://rackt.github.io/react-router/).

## Usage

Use `ReactRouterRelay.createElement` on your `<Router>`, then define Relay queries and render callbacks for each of your routes:

```js
import ReactRouterRelay from 'react-router-relay';

/* ... */

const ViewerQueries = {
  viewer: () => Relay.QL`query { viewer }`
};

const WidgetQueries = {
  widget: () => Relay.QL`query { widget(widgetId: $widgetId) }`
}

ReactDOM.render((
  <Router history={history} createElement={ReactRouterRelay.createElement}>
    <Route
      path="/" component={Application}
      queries={ViewerQueries}
    >
      <Route
        path="widgets" component={WidgetList}
        queries={ViewerQueries}
        queryParams={['color']} stateParams={['limit']}
        prepareParams={prepareWidgetListParams}
        renderLoading={() => <Loading />}
      />
      <Route
        path="widgets/:widgetId" component={Widget}
        queries={WidgetQueries}
      />
    </Route>
  </Router>
), container);
```

`react-router-relay` will automatically generate a combined Relay route with all queries and parameters from the active React Router routes, then pass down the query results to each of the route components. As the queries are all gathered onto a single route, they'll all be fetched at the same time, and the data for your entire page will load and then render in one go.

You can find an example implementation of TodoMVC with routing using `react-router-relay` at https://github.com/taion/relay-todomvc.

## Guide

### Installation

Relay requires React 0.14, which limits compatibility to the pre-release versions of React Router. Currently, `react-router-relay` supports React Router v1.0.0-rc1:

```shell
$ npm install react react-dom react-relay react-router@latest
$ npm install react-router-relay
```

### Routes and Queries

For each of your routes that requires data from Relay, define a `queries` prop on the `<Route>`. These should be just like the queries on a Relay route:

```js
const ViewerQueries = {
  viewer: () => Relay.QL`query { viewer }`
};

const applicationRoute = (
  <Route
    path="/" component={Application}
    queries={ViewerQueries}
  />
);
```

Just like with `Relay.RootContainer`, the component will receive the query results as props, in addition to the other injected props from React Router.

If your route doesn't have any dependencies on Relay data, just don't declare `queries`. The only requirement is that any route that does define `queries` must have a Relay container as its component.

Any URL parameters for routes with queries and their ancestors will be used as parameters on the Relay route:

```js
const WidgetQueries = {
  widget: () => Relay.QL`
    query {
      widget(widgetId: $widgetId) # `widgetId` receives a value from the route
    }
  `
}

class Widget extends React.Component { /* ... */ }

Widget = Relay.createContainer(Widget, {
  fragments: {
    widget: () => Relay.QL`
      fragment on Widget {
        name
      }
    `
  }
});

// This handles e.g. /widgets/3.
const widgetRoute = (
  <Route
    path="widgets/:widgetId" component={Widget}
    queries={WidgetQueries}
  />
);
```

If your route requires parameters from the location query or state, you can specify them respectively on the `queryParams` or `stateParams` props on the `<Route>`. URL and query parameters will be strings, while missing query and state parameters will be `null`.

If you need to convert or initialize these parameters, you can do so with `prepareParams`, which has the same signature and behavior as `prepareVariables` on a Relay container, except that it also receives the React Router route object as an argument.

Additionally, you can use route parameters as variables on your containers:

```js
class WidgetList extends React.Component { /* ... */ }

WidgetList = Relay.createContainer(WidgetList, {
  initialVariables: {
    color: null,
    size: null,
    limit: null
  },

  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        widgets(color: $color, size: $size, first: $limit) {
          edges {
            node {
              name
            }
          }
        }
      }
    `
  }
});

function prepareWidgetListParams(params, route) {
  return {
    ...params,
    size: params.size ? parseInt(params.size, 10) : null,
    limit: params.limit || route.defaultLimit
  };
};

// This handles e.g. /widgets?color=blue&size=3.
const widgetListRoute = (
  <Route
    path="widgets" component={WidgetList}
    queries={ViewerQueries}
    queryParams={['color', 'size']} stateParams={['limit']}
    prepareParams={prepareWidgetListParams}
    defaultLimit={10}
  />
);
```

### Render Callbacks

You can pass in custom `renderLoading`, `renderFetched`, and `renderFailure` callbacks to your routes:

```js
<Route /* ... */ renderLoading={() => <Loading />} />
```

These have the same signature and behavior as they do on `Relay.RootContainer`, except that the argument to `renderFetched` also includes the injected props from React Router. As on `Relay.RootContainer`, the `renderLoading` callback can simulate the default behavior of rendering the previous view by returning `undefined`.

### Notes

- `react-router-relay` only updates the Relay route on actual location changes. Specifically, it will not update the Relay route after changes to location state, so ensure that you update your container variables appropriately when updating location state.
- `react-router-relay` uses referential equality on route objects to generate unique names for queries. If your `route` objects do not maintain referential equality, then you can specify a globally unique `name` property on the route to identify it.
- Relay's re-rendering optimizations only work when all non-Relay props are scalar. As the props injected by React Router are objects, they disable these re-rendering optimizations. To take maximum advantage of these optimizations, you should make the `render` methods on your route components as lightweight as possible, and do as much rendering work as possible in child components that only receive scalar and Relay props.

## Authors

- [@devknoll](https://github.com/devknoll)
- [@cpojer](https://github.com/cpojer)
- [@taion](https://github.com/taion)
