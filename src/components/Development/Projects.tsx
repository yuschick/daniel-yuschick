import React from "react"
import styled from "styled-components"
import { useStaticQuery, graphql } from "gatsby"
import { v4 as uuidv4 } from "uuid"

import H3 from "components/H3"

import Project from "./Project"
import ProjectsData from "./projectsdata.json"

import { IProject } from "types/Development"

const Projects: React.FunctionComponent = () => {
  const {
    allFile: { edges: projectImages },
  } = useStaticQuery(graphql`
    query ProjectImages {
      allFile(
        filter: {
          extension: { eq: "jpg" }
          relativeDirectory: { eq: "projects" }
        }
      ) {
        edges {
          node {
            childImageSharp {
              fluid {
                ...GatsbyImageSharpFluid_withWebp
                aspectRatio
                base64
                sizes
                src
                srcSet
              }
            }
            name
          }
        }
      }
    }
  `)

  return (
    <section>
      <H3>Projects</H3>
      <GridContainer>
        {ProjectsData &&
          Object.keys(ProjectsData)
            .sort((a: string, b: string): number =>
              (ProjectsData as any)[a].title < (ProjectsData as any)[b].title
                ? -1
                : 1
            )
            .map((name: string) => {
              const project: IProject = (ProjectsData as any)[name]
              const { 0: img } = projectImages.filter(
                (p: any) => p.node.name === project.image
              )

              if (!img) return

              return (
                <Project
                  key={uuidv4()}
                  data={project}
                  cover={img.node.childImageSharp.fluid}
                />
              )
            })}
      </GridContainer>
    </section>
  )
}

const GridContainer = styled.section`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
`

export default Projects
