import React from "react"
import styled from "styled-components"
import Img from "gatsby-image"
import { v4 as uuidv4 } from "uuid"
import { OutboundLink } from "gatsby-plugin-google-analytics"

import { IProject, ICover } from "types/Development"

import ThemeColors from "theme/colors"

interface Props {
  data: IProject
  cover: ICover
}

const Project: React.FunctionComponent<Props> = ({ data, cover }) => {
  const buildLinksList = (project: IProject): JSX.Element[] => {
    const links: JSX.Element[] = []

    for (let [key, value] of Object.entries(project.links)) {
      links.push(
        <OutboundLink key={uuidv4()} href={value}>
          {key}
        </OutboundLink>
      )
    }

    return links
  }
  const { title, subtitle, id, links } = data

  return (
    <ProjectItem key={id}>
      <a href={links.live}>
        <Img fluid={cover} alt={`${title}`} fadeIn />
      </a>
      <ProjectInfo>
        <ProjectTitle>
          <a href={links.live}>
            {title}
            <ProjectSubTitle>{subtitle}</ProjectSubTitle>
          </a>
        </ProjectTitle>
        {buildLinksList(data)}
      </ProjectInfo>
    </ProjectItem>
  )
}

const ProjectItem = styled.section`
  overflow: hidden;

  @media (min-width: 750px) {
    img {
      filter: blur(1px) grayscale(0.5);
      transform: scale(1);
      transition: all 0.15s ease-in;
    }

    &:hover img {
      filter: blur(0) grayscale(0);
      transform: scale(1.01);
    }
  }
`

const ProjectInfo = styled.div`
  text-align: center;

  a {
    color: ${ThemeColors.texts.darkSecondary};
    font-size: 0.9rem;
    text-transform: capitalize;
  }

  a + a:before {
    content: "|";
    margin: 0 0.5rem;
  }
`

const ProjectTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;

  a,
  a:active,
  a:visited,
  a:hover {
    color: ${ThemeColors.core.orange};
    font-size: inherit;
    text-decoration: none;
  }
`

const ProjectSubTitle = styled.h5`
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1;
`

export default Project
