import React from 'react';
import { Link } from 'gatsby';

const Nav = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/kennewick">Kennewick</Link>
      <Link to="/pasco">Pasco</Link>
      <Link to="/richland">Richland</Link>
      <Link to="/west-richland">West Richland</Link>
    </nav>
  );
};

export default Nav;
