import React from 'react';

const StrongB = props => {
 
 return ( 
    <td className="strong-b">
      {props.children ? props.children : ''}
    </td>
  )
}

export default StrongB;
