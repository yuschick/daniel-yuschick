import React from "react"
import styled from "styled-components"

import ListContent from "components/ListContent"

const AboutContent: React.FunctionComponent = () => {
  return (
    <section>
      <ListContent.Block>
        <ListContent.Header>
          Born and raised in Pennsylvania, USA
        </ListContent.Header>
        <ListContent.Content>
          <ul>
            <li>
              Spent my 7th birthday singing every word at an Alice Cooper
              concert
            </li>
            <li>Worked two years in a record store</li>
            <li>Freelanced as a web designer and developer</li>
            <li>Played drums in multiple metal bands</li>
          </ul>
        </ListContent.Content>
      </ListContent.Block>
      <ListContent.Block>
        <ListContent.Header>
          Moved to North Carolina, USA in 2009
        </ListContent.Header>
        <ListContent.Content>
          <ul>
            <li>Learned what a recession was</li>
            <li>Continued to freelance</li>
            <li>
              Never used my Bachelor's Degree in Criminal Justice / Computer
              Forensics
            </li>
            <li>Adopted my dog, Abbie</li>
            <li>Competed in several YMCA basketball leagues</li>
            <li>Tried bean-to-bar chocolate and have been spoiled since</li>
            <li>
              Taught Frontend Engineering at The Iron Yard coding bootcamp
            </li>
          </ul>
        </ListContent.Content>
      </ListContent.Block>
      <ListContent.Block>
        <ListContent.Header>
          Followed my love of winter and metal to Helsinki, Finland in 2017
        </ListContent.Header>
        <ListContent.Content>
          <ul>
            <li>
              Lived in an AirBnB without running water for the first two weeks
            </li>
            <li>A lot more basketball and a lot less freelancing</li>
            <li>Discovered my love of traveling</li>
            <li>
              Wrote my first novel,&nbsp;
              <em>
                <a href="https://www.goodreads.com/book/show/45730020-the-mines">
                  The Mines
                </a>
              </em>
            </li>
            <li>Attended Turkmenistan's annual Independence Day horse race</li>
            <li>Returned to indoor rock climbing</li>
            <li>Learned what a pandemic was</li>
          </ul>
        </ListContent.Content>
      </ListContent.Block>
      <ListContent.Block>
        <ListContent.Header>Still to come...</ListContent.Header>
        <ListContent.Content>
          <ul>
            <li>
              <Strikethrough>Finish this website</Strikethrough>
            </li>
            <li>Write my second, not-a-sequel, novel</li>
            <li>Climb a mountain in Antarctica</li>
          </ul>
        </ListContent.Content>
      </ListContent.Block>
    </section>
  )
}

const Strikethrough = styled.span`
  text-decoration: line-through;
`

export default AboutContent
