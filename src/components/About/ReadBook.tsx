import React from "react"
import styled from "styled-components"

import { Book } from "types/Goodreads"
import ThemeColors from "theme/colors"

interface Props {
  book: Book
}

const ReadBook = ({ book }: Props) => (
  <StyledItem>
    <div>
      <Title
        href={book.book.link}
        title={`View ${book.book.title} on Goodreads`}
      >
        {book.book.title_without_series}
      </Title>
      <Author>{book.book.authors.author.name}</Author>
    </div>
    <span>
      {book.rating}{" "}
      <span role="img" aria-label={`A rating ${book.rating} out of 5`}>
        ⭐
      </span>
    </span>
  </StyledItem>
)

const StyledItem = styled.li`
  border-bottom: 1px solid rgba(15, 70, 100, 0.12);
  display: grid;
  font-size: 0.8rem;
  grid-gap: 0.5rem;
  grid-template-columns: auto max-content;
  padding: 0.5rem 0;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border: 0;
    padding-bottom: 0;
  }
`

const Title = styled.a`
  display: block;
  }
`

const Author = styled.span`
  color: ${ThemeColors.texts.darkSecondary};
  font-size: min(max(14px, 0.7rem), 18px);

  @supports (font-size: clamp(14px, 0.7rem, 18px)) {
    font-size: clamp(14px, 0.7rem, 18px);
  }
`

export default ReadBook
