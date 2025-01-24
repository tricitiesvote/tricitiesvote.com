import React from 'react';

const NoResponse = props => {
 
 return ( 
    <div className="no-response">
      {props.children ? props.children : ''}
    </div>
  )
}

export default NoResponse;
