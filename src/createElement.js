import createContainer from './Container';

export default function createCreateElement(React) {
  const Container = createContainer(React);

  return function createElement(Component, props) {
    return (
      <Container
        Component={Component}
        {...props}
      />
    );
  };
}
