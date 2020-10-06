import React from 'react';

const LeanB = props => {
 
 return ( 
    <td className="lean-b">
      {props.children ? props.children : ''}
    </td>
  )
}

export default LeanB;
