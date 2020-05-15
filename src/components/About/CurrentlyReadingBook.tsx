import React from "react"
import styled from "styled-components"

import { Book } from "types/Goodreads"

import ThemeColors from "theme/colors"

interface Props {
  book: Book
}

const CurrentlyReadingBook = ({ book }: Props) => {
  let desc = book.book.description
    .split("<br />")
    .join(" ")
    .split(" ")
    .slice(0, 49)
    .join(" ")

  return (
    <StyledItem>
      <div>
        <Title
          href={book.book.link}
          title={`View ${book.book.title} on Goodreads`}
        >
          {book.book.title_without_series}
        </Title>
        <Description>{book.book.authors.author.name}</Description>
        <Description>{desc}...</Description>
      </div>
    </StyledItem>
  )
}

const StyledItem = styled.div`
  font-size: 0.9rem;
  margin: 0.5rem 0;
`

const Title = styled.a`
  display: block;
`

const Description = styled.p`
  color: ${ThemeColors.texts.darkSecondary};
  font-size: min(max(14px, 0.7rem), 18px);

  @supports (font-size: clamp(14px, 0.7rem, 18px)) {
    font-size: clamp(14px, 0.7rem, 18px);
  }
`

export default CurrentlyReadingBook
