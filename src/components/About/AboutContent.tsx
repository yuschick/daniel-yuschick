import React from "react"
import { v4 as uuidv4 } from "uuid"

import ListContent from "components/ListContent"
import Content from "./content"

const AboutContent: React.FunctionComponent = () => {
  return (
    <section>
      {Content.map((item: { title: string; content: string[] }) => (
        <ListContent.Block key={uuidv4()}>
          <ListContent.Header>{item.title}</ListContent.Header>
          <ListContent.Content>
            <ul>
              {item.content.map((i: string) => (
                <li key={uuidv4()}>{i}</li>
              ))}
            </ul>
          </ListContent.Content>
        </ListContent.Block>
      ))}
    </section>
  )
}

export default AboutContent
