import React from "react"
import styled from "styled-components"
import Img from "gatsby-image"
import { v4 as uuidv4 } from "uuid"

import H3 from "components/H3"

import AmazonIcon from "assets/icons/icon-amazon.jpg"
import GoodreadsIcon from "assets/icons/icon-goodreads-alt.jpg"

import { BookChild } from "types/Goodreads"
import { ICover } from "types/Development"
import trackEvent from "utils/trackEvent"

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
            <a
              href={amazon}
              onClick={() =>
                trackEvent(`${data.title} - Clicked Amazon link`, {
                  category: "Writing",
                })
              }
            >
              <img src={AmazonIcon} alt={`Order ${data?.title} on Amazon`} />
            </a>
          </div>
          <div>
            <a
              href={data?.link}
              onClick={() =>
                trackEvent(`${data.title} - Clicked Goodreads link`, {
                  category: "Writing",
                })
              }
            >
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

  img {
    height: auto;
    width: 50px;
  }

  div + div {
    margin-left: 0.5rem;
  }
`

const DescriptionP = styled.p`
  + p {
    margin-top: 1rem;
  }
`

export default Book
