import {ApolloClient, HttpLink, InMemoryCache, ApolloProvider} from "@apollo/client";
import {NavLink, BrowserRouter as Router, Route, Routes, Link} from "react-router-dom";
import './App.css';
import Locations from "./components/Locations";
import map from './img/map.jpeg'
import MyLikes from "./components/MyLikes";
import MyLocations from "./components/MyLocations";
import AddLocation from "./components/AddLocation";
import Distance from "./components/Distance";

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
                      <br/>
                      <Link className='showlink' to='/'>
                          Locations
                      </Link>
                      <Link className='showlink' to='/my-likes'>
                          Liked Locations
                      </Link>
                      <Link className='showlink' to='/my-locations'>
                          My Locations
                      </Link>
                      <Link className='showlink' to='/new-location'>
                          Add a New Location
                      </Link>
                      <Link className='showlink' to='/distance'>
                          Distance
                      </Link>
                  </header>
                  <div className='App-body'>
                      <Routes>
                          <Route exact path='/' element={<Locations/>}/>
                          <Route path='/my-likes' element={<MyLikes/>}/>
                          <Route path='/new-location' element={<AddLocation/>}/>
                          <Route path='/my-locations' element={<MyLocations/>}/>
                          <Route path='/distance' element={<Distance/>}/>
                      </Routes>
                  </div>
              </div>
          </Router>
      </ApolloProvider>

  );
}

export default App;
