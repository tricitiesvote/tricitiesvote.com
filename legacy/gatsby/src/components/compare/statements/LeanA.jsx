import React from 'react';

const LeanA = props => {
 
 return ( 
    <td className="lean-a">
      {props.children ? props.children : ''}
    </td>
  )
}

export default LeanA;
