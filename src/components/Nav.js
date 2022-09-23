import React from 'react';
import { Link } from 'gatsby';

const Nav = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/benton-county">Benton County</Link>
      <Link to="/franklin-county">Franklin County</Link>
    </nav>
  );
};

export default Nav;
