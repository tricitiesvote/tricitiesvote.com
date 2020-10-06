import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const BradPeck = ({says}) => {
	
	return (
		<CompareCandidateStatement 
			position="franklin-1"
			name="Brad Peck"
			last="Peck"
			image="/images/candidates/brad-peck.jpeg"
			comment={says}
		/>
	)
}

export default BradPeck;
