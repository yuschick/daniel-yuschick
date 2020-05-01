import React from "react"
import styled from "styled-components"
import Img from "gatsby-image"
import { v4 as uuidv4 } from "uuid"

import { IProject, ICover } from "types/Development"

import ThemeColors from "theme/colors"

interface Props {
  data: IProject
  cover: ICover
}

const Project: React.FunctionComponent<Props> = ({ data, cover }) => {
  const buildLinksList = (project: IProject): JSX.Element[] => {
    const links: JSX.Element[] = []

    if (project.live) {
      links.push(
        <a key={uuidv4()} href={project.live}>
          Live
        </a>
      )
    }

    if (project.github) {
      links.push(
        <a key={uuidv4()} href={project.github}>
          Github
        </a>
      )
    }

    if (project.codepen) {
      links.push(
        <a key={uuidv4()} href={project.codepen}>
          Codepen
        </a>
      )
    }

    return links
  }

  return (
    <ProjectItem key={data.id}>
      <a href={data.live}>
        <Img fluid={cover} alt={`${data.title}`} fadeIn />
      </a>
      <ProjectInfo>
        <ProjectTitle>
          <a href={data.live}>
            {data.title}
            <ProjectSubTitle>{data.subtitle}</ProjectSubTitle>
          </a>
        </ProjectTitle>
        {buildLinksList(data)}
      </ProjectInfo>
    </ProjectItem>
  )
}

const ProjectItem = styled.section`
  overflow: hidden;
  img {
    filter: blur(1px) grayscale(0.5);
    transform: scale(1);
    transition: all 0.15s ease-in;
  }

  &:hover img {
    filter: blur(0) grayscale(0);
    transform: scale(1.01);
  }
`

const ProjectInfo = styled.div`
  text-align: center;

  a {
    color: ${ThemeColors.texts.darkSecondary};
    font-size: 0.9rem;
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
