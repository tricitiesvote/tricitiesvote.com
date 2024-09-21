import PropTypes from 'prop-types';

const generateAnswersPropTypes = questionKeys => {
  return PropTypes.arrayOf(
    PropTypes.shape(
      questionKeys.reduce((acc, key) => {
        acc[key] = PropTypes.string;
        return acc;
      }, {})
    )
  );
};

export default generateAnswersPropTypes;
