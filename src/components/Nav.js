import React from 'react';
import { Link } from 'gatsby';

const Nav = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/kennewick">Kennewick</Link>
      <Link to="/pasco">Pasco</Link>
      <Link to="/richland">Richland</Link>
      <Link to="/westrichland">W. Richland</Link>
    </nav>
  );
};

export default Nav;
