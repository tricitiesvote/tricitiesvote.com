import React from 'react';

const StrongA = props => {
 
 return ( 
    <td className="strong-a">
      {props.children ? props.children : ''}
    </td>
  )
}

export default StrongA;
