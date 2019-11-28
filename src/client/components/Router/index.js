import React from 'react';
import App from '../App';
import About from '../About';

class Router extends React.Component {
  constructor() {
    super();
    this.state = {
      queryParam: null,
    };
  }

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('screen');
    this.setState({ queryParam });
  }

  render() {
    const { queryParam } = this.state;

    switch (queryParam) {
      case 'main':
        return <App />;
      case 'about':
        return <About />;
      default:
        return <div>no-query</div>;
    }
  }
}

export default Router;
