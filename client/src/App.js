import {ApolloClient, HttpLink, InMemoryCache, ApolloProvider} from "@apollo/client";
import {NavLink, BrowserRouter as Router, Route, Routes, Link} from "react-router-dom";
import './App.css';
import Home from "./components/Home";
import map from './img/map.jpeg'
import MyLikes from "./components/MyLikes";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'http://localhost:4000'
  })
});

function App() {
  return (
      <ApolloProvider client={client}>
          <Router>
              <div className="App">
                  <header className='App-header'>
                      <img src={map} className='App-logo' alt='logo' />
                      <h1 className='App-title'>
                          Welcome to BoreSquare
                      </h1>
                      <Link className='showlink' to='/'>
                          Locations
                      </Link>
                      <Link className='showlink' to='/my-likes'>
                          My Liked Locations
                      </Link>
                  </header>
                  <div className='App-body'>
                      <Routes>
                          <Route exact path='/' element={<Home/>}/>
                          <Route path='/my-likes' element={<MyLikes/>}/>
                      </Routes>
                  </div>
              </div>
          </Router>
      </ApolloProvider>

  );
}

export default App;
