export interface Book {
  id: string
  book: BookChild
  rating: string
  read_at: string
  url: string
  link: string
}

export interface ReadBook {
  id: string
  book: BookChild
  rating: string
  read_at: string
  url: string
  link: string
}

export interface BookChild {
  id: BookId
  uri: string
  title: string
  title_without_series: string
  link: string
  description: string
  authors: AuthorParent
  average_rating: string
  publication_day: string
  publication_month: string
  publication_year: string
}

interface BookId {
  _: string
}

interface AuthorParent {
  author: Author
}

interface Author {
  id: string
  name: string
}
