import React from "react"

import ListContent from "components/ListContent"
import Content from "./content"

const AboutContent: React.FunctionComponent = () => {
  return (
    <section>
      {Content.map((item: { title: string; content: string[] }) => (
        <ListContent.Block>
          <ListContent.Header>{item.title}</ListContent.Header>
          <ListContent.Content>
            <ul>
              {item.content.map((i: string) => (
                <li>{i}</li>
              ))}
            </ul>
          </ListContent.Content>
        </ListContent.Block>
      ))}
    </section>
  )
}

export default AboutContent
