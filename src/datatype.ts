
interface Entry {
  id: string;
  title: string;
  content: string;
  tags: Array<string>;
}

interface EntryContent {
  title: string;
  content: string;
  tags: Array<string>;
}
interface Metadata {
key: string,
value: any
}