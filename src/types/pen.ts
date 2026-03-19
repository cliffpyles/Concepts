export interface CodePenUser {
  username: string;
  nicename?: string;
  avatar?: string;
}

export interface CodePenImages {
  small?: string;
  large?: string;
}

export interface PenCode {
  html?: string;
  css?: string;
  js?: string;
}

export interface Pen {
  id: string;
  title: string;
  details: string;
  link: string;
  views?: string;
  loves?: string;
  comments?: string;
  images?: CodePenImages;
  user?: CodePenUser;

  /** True creation date fetched from the CodePen GraphQL API */
  createdAt?: string;

  /** Last updated date fetched from the CodePen GraphQL API */
  updatedAt?: string;

  /** Legacy fallback: When this resource was first added to the log */
  firstSeen?: string;

  /** Source code flags fetched from the resource URL */
  code?: PenCode;
}

export interface PensData {
  pens: Pen[];
  lastSynced: string | null;
  username: string;
}