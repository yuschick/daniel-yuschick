import React from 'react';
import styled from 'styled-components';

const ContentContainer: React.FunctionComponent = ({ children }) => {
  return <Section>{children}</Section>;
};

const Section = styled.section`
  margin: 0 auto;
  max-width: clamp(350px, 90vw, 1250px);
  padding: 2rem 0.5rem;
`;

export default ContentContainer;
