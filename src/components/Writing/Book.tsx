import React from "react"
import styled from "styled-components"
import Img from "gatsby-image"

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
  return (
    <GridContainer>
      <div>
        <Img fluid={cover} alt={`${data?.title} cover`} fadeIn />
        <LinksContainer>
          <div>
            <a href={amazon}>
              <img src={AmazonIcon} alt={`Order ${data?.title} on Amazon`} />
            </a>
          </div>
          <div>
            <a href={data?.link}>
              <img
                src={GoodreadsIcon}
                alt={`View ${data?.title} on Goodreads`}
              />
            </a>
          </div>
        </LinksContainer>
      </div>
      <section>
        <H3>{data?.title}</H3>
        {data && <div dangerouslySetInnerHTML={{ __html: data.description }} />}
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

  img {
    height: auto;
    width: 50px;
  }

  div + div {
    margin-left: 0.5rem;
  }
`

export default Book
