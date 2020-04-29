import React from 'react';
import styled from 'styled-components';

import ThemeColors from 'theme/colors';

const Block: React.FunctionComponent = ({ children }) => {
  return <article>{children}</article>;
};

const Header: React.FunctionComponent = ({ children }) => {
  return (
    <HeaderContainer>
      <Square />
      {children}
    </HeaderContainer>
  );
};

const Content: React.FunctionComponent = ({ children }) => {
  return <SubSection>{children}</SubSection>;
};

const HeaderContainer = styled.header`
  align-items: center;
  display: flex;
  font-weight: 500;
`;

const Square = styled.div`
  background: ${ThemeColors.core.orange};
  height: 12px;
  margin-right: 0.5rem;
  width: 12px;
`;

const SubSection = styled.main`
  border-left: 1px solid ${ThemeColors.core.lightGrey};
  margin: 0.5rem 0 0.5rem 1rem;
  padding-left: 1rem;
`;

export default {
  Block,
  Header,
  Content,
};
