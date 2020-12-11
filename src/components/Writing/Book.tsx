import React from "react"
import styled from "styled-components"
import Img from "gatsby-image"
import { v4 as uuidv4 } from "uuid"
import { OutboundLink } from "gatsby-plugin-google-analytics"

import H3 from "components/H3"

import AmazonIcon from "assets/icons/icon-amazon.jpg"
import GoodreadsIcon from "assets/icons/icon-goodreads-alt.jpg"

import { BookChild } from "types/Goodreads"
import { ICover } from "types/Development"

interface Props {
  data: BookChild
  amazon: string
  cover: ICover
}

const Book: React.FunctionComponent<Props> = ({ data, amazon, cover }) => {
  const formatBookDescription = (): JSX.Element => {
    let textArr: string[] = data.description.split("<br />")
    textArr = textArr
      .filter((item: string) => !item.includes("<br />"))
      .filter((t: string) => t)

    return (
      <div>
        {textArr.map((t: string) => (
          <DescriptionP key={uuidv4()}>{t}</DescriptionP>
        ))}
      </div>
    )
  }
  return (
    <GridContainer>
      <div>
        <Img fluid={cover} alt={`${data.title} cover`} fadeIn />
        <LinksContainer>
          <div>
            <OutboundLink href={amazon}>
              <img src={AmazonIcon} alt={`Order ${data?.title} on Amazon`} />
            </OutboundLink>
          </div>
          <div>
            <OutboundLink href={data?.link}>
              <img
                src={GoodreadsIcon}
                alt={`View ${data?.title} on Goodreads`}
              />
            </OutboundLink>
          </div>
        </LinksContainer>
      </div>
      <section>
        <H3>{data?.title}</H3>
        {data && formatBookDescription()}
      </section>
    </GridContainer>
  )
}

const GridContainer = styled.section`
  align-items: start;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fit, 1fr);

  @media (min-width: 750px) {
    grid-template-columns: minmax(350px, 1fr) minmax(300px, 3fr);
  }
`

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 0.5rem 0;

  @supports (margin-inline: 1rem) {
    margin-block: 0.5rem;
    margin-inline: 0;
  }

  img {
    height: auto;
    width: 50px;

    @supports (block-size: 1rem) {
      block-size: auto;
    }

    @supports (inline-size: 1rem) {
      inline-size: 50px;
    }
  }

  div + div {
    margin-left: 0.5rem;

    @supports (margin-inline: 1rem) {
      margin-inline-start: 0.5rem;
    }
  }
`

const DescriptionP = styled.p`
  + p {
    margin-top: 1rem;

    @supports (margin-block: 1rem) {
      margin-block-start: 1rem;
    }
  }
`

export default Book
